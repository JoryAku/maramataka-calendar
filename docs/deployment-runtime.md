# Deployment And Runtime

This document records the current production runtime contract for the Maramataka
Calendar app. It keeps the hosting platform flexible while making the API,
frontend, and astronomy cache expectations explicit.

## Runtime Shape

The app has two deployable pieces:

- Angular frontend: built from `apps/maramataka-calendar`.
- NestJS API: built from `api`.

The frontend currently calls the API through the `/api` path. The simplest
production deployment is therefore one public origin where:

- static frontend assets are served from `/`
- API traffic is routed to the NestJS API at `/api/*`

If the frontend and API are hosted on different origins, configure
`CORS_ORIGINS` on the API and make sure the frontend deployment routes API calls
to the deployed API origin.

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

The API exposes its health endpoint at:

```text
/api/health
```

Deployment platforms should use this endpoint for liveness checks.

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
running a non-real-data environment. When unset, the API uses the USNO-backed
astronomy provider wrapped in persistent cache layers.

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

The cache stores normalized astronomy results, not raw USNO responses. The cache
file currently uses schema version `1`.

Recommended production behaviour:

- Put the cache on persistent storage if the hosting platform supports it.
- If the platform filesystem is ephemeral, the app will still work, but USNO
  calls will be repeated after restarts.
- Treat the cache as rebuildable operational data, not as source-of-truth data.
- Backups are optional for MVP because the cache can be regenerated.

## Cache Reset And Invalidation

The current cache has no TTL. It is intentionally conservative because
astronomical results for a date/location are stable once fetched.

Manual reset:

```sh
rm "$MARAMATAKA_ASTRONOMY_CACHE_PATH"
```

The API will recreate the cache file on the next successful astronomy fetch.

When to reset:

- USNO provider parsing changes.
- Cache schema changes.
- A bad provider response was cached.
- The `Location` or timezone contract changes in a way that affects cache keys.

Future cache hardening should add explicit invalidation tooling, stale-cache
policy, and migration handling.

## Frontend Hosting

Serve the Angular build output as static files:

```text
dist/apps/maramataka-calendar/browser
```

The frontend should be configured so `/api/*` reaches the deployed NestJS API.
This can be done by hosting both pieces under one origin or by using the
frontend host's rewrite/proxy feature.

For single-page-app routing, route unknown non-API paths back to `index.html`.

## CI And Pre-Deployment Checks

Before deployment, run:

```sh
npm run ci
```

CI uses stub astronomy data so it does not depend on live USNO availability.

For a production smoke test after deployment:

```sh
curl https://your-domain.example/api/health
curl "https://your-domain.example/api/maramataka/today?dateTime=2026-06-28T12:00:00&location=wellington"
```

Use a supported location id from the API locations endpoint.

## Current Open Runtime Decisions

- Choose the actual hosting platform for the frontend and API.
- Decide whether production cache storage is persistent volume, object storage,
  or a future database-backed cache.
- Add first-class cache invalidation/migration tooling.
- Decide whether to add package-based middleware such as `helmet` and
  `compression`, or keep the current manual header/request-limit setup.

