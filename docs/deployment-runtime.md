# Deployment And Runtime

This document records the current production runtime contract for the Maramataka
Calendar app. It keeps the hosting platform flexible while making the API,
frontend, and astronomy cache expectations explicit.

## Runtime Shape

The app has two deployable pieces:

- Angular frontend: built from `apps/maramataka-calendar`.
- NestJS API: built from `api`.

The frontend defaults to calling the API through the `/api` path. The simplest
production deployment is therefore one public origin where:

- static frontend assets are served from `/`
- API traffic is routed to the NestJS API at `/api/*`

If the frontend and API are hosted on different origins, configure
`CORS_ORIGINS` on the API and set the frontend API base URL by environment build
configuration or runtime config.

## Build Commands

Install dependencies with the locked dependency tree:

```sh
npm ci
```

Build everything:

```sh
npm run build
```

Build only the deployable apps:

```sh
npx nx build api
npx nx build maramataka-calendar
```

The Angular build output is:

```text
dist/apps/maramataka-calendar/browser
```

The API build output is:

```text
dist/api
```

## API Runtime Command

After building the API, run:

```sh
node dist/api/main.js
```

The API exposes health endpoints at:

```text
/api/health
/api/health/live
/api/health/ready
```

`/api/health` is kept as a backward-compatible liveness endpoint.
Deployment platforms should use `/api/health/live` for liveness checks and
`/api/health/ready` for readiness checks. Readiness performs a lightweight
astronomy-backed check and returns `503` when provider data is unavailable.

## Required Environment

Use Node.js 20.19.0 or newer in the Node 20 line, or Node.js 22.12.0 or newer.

Production should set:

```sh
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://your-frontend.example
MARAMATAKA_ASTRONOMY_CACHE_PATH=/var/cache/maramataka/astronomy.json
```

Optional API runtime values:

```sh
REQUEST_BODY_LIMIT=100kb
TRUST_PROXY=1
MARAMATAKA_ASTRONOMY_MODE=stub
```

Do not set `MARAMATAKA_ASTRONOMY_MODE=stub` in production unless intentionally
running a non-real-data environment. When unset, the API uses Astronomy Engine
wrapped in persistent cache layers.

## Environment Variables

| Name | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | Recommended | unset | Set to `production` for deployed API instances. |
| `PORT` | Platform dependent | `3000` | Port the NestJS API listens on. |
| `CORS_ORIGINS` | Production yes | dev allows all, production denies all | Comma-separated list of frontend origins allowed to call the API. |
| `REQUEST_BODY_LIMIT` | No | `100kb` | JSON and form body size limit. |
| `TRUST_PROXY` | Platform dependent | unset | Enables Express trust-proxy when running behind a platform proxy/load balancer. |
| `MARAMATAKA_ASTRONOMY_MODE` | No | live provider | Set to `stub` for deterministic local/CI runs. |
| `MARAMATAKA_ASTRONOMY_CACHE_PATH` | Production yes | `.cache/astronomy.json` | File path for the persistent astronomy cache. |

## Astronomy Cache

The API uses a file-backed persistent astronomy cache in live astronomy mode.
The default local path is:

```text
.cache/astronomy.json
```

Production should set an explicit path:

```text
MARAMATAKA_ASTRONOMY_CACHE_PATH=/var/cache/maramataka/astronomy.json
```

The cache stores normalized astronomy results, not raw provider responses. The
cache file currently uses schema version `2`, and each cache entry also carries
entry schema version `2`. Persistent cache keys also include a short
fingerprint namespace derived from readable cache metadata.

Current persistent namespaces:

- raw astronomy facts: moon phases, New Moons, Full Moons, solar seasons,
  moonrise, moonrise/set, moon transit, and moon details
- observational astronomy: dawn star markers, dawn-window first appearances,
  and night-invisibility periods

The maramataka rule set also exposes readable fingerprint metadata for mata
names, year-start logic, Ruhanui logic, named-month markers, and Matariki
holiday marker logic. That fingerprint is currently used by in-memory
month/year caches. It is not yet a persistent cache namespace because generated
maramataka year/month outputs are not written to disk.

The API logs the active raw astronomy, observational astronomy, and maramataka
rule-set fingerprints with compact metadata summaries at startup under the
`CacheFingerprint` logger. The full readable metadata can be inspected locally
without starting the API:

```sh
npm run diagnose:maramataka -- cache-fingerprints
```

Recommended production behaviour:

- Put the cache on persistent storage if the hosting platform supports it.
- If the platform filesystem is ephemeral, the app will still work, but
  astronomy calculations will be repeated after restarts.
- Treat the cache as rebuildable operational data, not as source-of-truth data.
- Backups are optional for the current cache because it can be regenerated.

## Cache Reset And Invalidation

The current cache has no TTL. It is intentionally conservative because
astronomical results for a date/location are stable once fetched.

Stale-cache behaviour:

- A cache hit is treated as authoritative and does not call the wrapped
  provider.
- If cache metadata changes, for example a dawn visibility definition changes,
  the derived fingerprint namespace changes and old entries become cache
  misses.
- If the astronomy provider is unavailable and a matching cache entry exists,
  the cached value is returned.
- If the astronomy provider is unavailable and no matching cache entry exists,
  the request fails with the provider error and the API maps that to a `503`.
- Unsupported cache file versions are ignored and the cache starts empty.
- Unsupported cache entry versions are ignored individually.
- Corrupt cache files are discarded in memory and rewritten on the next
  successful cache write.

Manual reset:

```sh
rm "$MARAMATAKA_ASTRONOMY_CACHE_PATH"
```

The API will recreate the cache file on the next successful astronomy fetch.

When to reset:

- Astronomy provider calculation changes.
- Cache schema changes.
- A bad provider response was cached.
- The `Location` or timezone contract changes in a way that affects cache keys.

Future cache hardening should add explicit invalidation tooling, stale
namespace cleanup, startup logging for active fingerprints, and a persistent
derived maramataka-rules namespace if year/month outputs become persistent.

## Frontend Hosting

Serve the Angular build output as static files:

```text
dist/apps/maramataka-calendar/browser
```

The frontend should be configured so `/api/*` reaches the deployed NestJS API.
This can be done by hosting both pieces under one origin or by using the
frontend host's rewrite/proxy feature.

For single-page-app routing, route unknown non-API paths back to `index.html`.

### Frontend API Base URL

The frontend uses an injected app config rather than hard-coded endpoint
strings. Supported modes are:

| Environment | Build command | API base URL |
| --- | --- | --- |
| Local/dev | `npx nx run maramataka-calendar:build:development` or `nx serve` | `/api` via the local proxy |
| Staging | `npx nx run maramataka-calendar:build:staging` | `https://staging-api.maramataka.example/api` placeholder |
| Production | `npx nx run maramataka-calendar:build:production` | `/api` on the same public origin |

Until real deployment domains are chosen, staging uses a placeholder API host.
Production defaults to same-origin `/api`, which keeps the recommended routing
simple and avoids rebuilding the frontend for each production host.

Deployments that need to reuse one frontend bundle across environments can
provide runtime config before Angular starts:

```html
<script>
  window.__MARAMATAKA_CONFIG__ = {
    apiBaseUrl: 'https://api.your-domain.example/api',
    errorReporting: 'console',
  };
</script>
```

The runtime value overrides the build-time environment file. The API base URL
must include the `/api` prefix when the API is exposed under that path.

### Frontend Error Reporting

The frontend uses a small global Angular error handler. In local, staging, and
production it reports uncaught frontend errors to `console.error` with a
sanitized message and stack. User-facing API failures are still handled in the
page with calm loading and error states.

Future production hardening can replace the console reporter with an external
error sink without changing page-level code; the current config already exposes
`errorReporting` as the switch point.

## Observability

The API writes one structured log line per request, including:

- `requestId`
- HTTP method and path
- response status code
- request duration in milliseconds
- remote address
- user agent

If a client sends `X-Request-Id`, the API preserves it and returns the same
value in the response header. Otherwise the API generates a request id.

Astronomy provider failures are logged with:

- `event=astronomy_provider_failure`
- API operation name
- provider
- provider error code
- provider message

These failures are also mapped to consistent `503` API error responses.

## CI And Pre-Deployment Checks

Before deployment, run:

```sh
npm run ci
```

CI uses stub astronomy data so it does not depend on live astronomy
availability.

For a production smoke test after deployment:

```sh
curl https://your-domain.example/api/health
curl https://your-domain.example/api/health/live
curl https://your-domain.example/api/health/ready
curl "https://your-domain.example/api/maramataka/page?date=2026-06-28&location=wellington"
```

Use a supported location id from the API locations endpoint.

## Current Open Runtime Decisions

- Choose the actual hosting platform for the frontend and API.
- Decide whether production cache storage is persistent volume, object storage,
  or a future database-backed cache.
- Replace placeholder staging API URL with the real staging domain.
- Decide whether frontend error reporting should stay console-only or report to
  a hosted error sink.
- Add first-class cache invalidation/migration tooling.
- Decide whether to add package-based middleware such as `helmet` and
  `compression`, or keep the current manual header/request-limit setup.
