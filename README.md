# Maramataka Calendar

Maramataka Calendar is an Nx workspace for a modern Maramataka app. The current
product focus is an accurate moon tracker with current mata, moonrise and
moonset, lunar phase anchors, cycle/month views, and a year rhythm view that
shows marama boundaries plus dawn star and moon events.

## Requirements

Use Node.js 20.19.0 or newer in the Node 20 line. Node 22.12.0 or newer is also supported.

If you use `nvm`:

```sh
nvm use
```

The common npm scripts run a Node.js version preflight. If you see an
unsupported Node version message, run `nvm use` from the repo root and retry.

Install dependencies:

```sh
npm ci
```

## Run Locally

Start the Angular app:

```sh
npm start
```

Start the API:

```sh
npm run serve:api
```

Use stub astronomy data when you need deterministic local or CI runs:

```sh
MARAMATAKA_ASTRONOMY_MODE=stub npm run serve:api
```

## Checks

Run the common verification tasks:

```sh
npm run lint
npm test
npm run build
```

Run lint, tests, and builds together:

```sh
npm run check
```

Run the CI-equivalent command with stub astronomy data:

```sh
npm run ci
```

## Calibration And Diagnostics

Generate the official Matariki holiday and Tangaroa-period calibration report:

```sh
npm run compare:matariki-holiday
```

Focus that report on Pipiri, Matariki, Ruhanui, New Moon, and Full Moon
visibility anchors:

```sh
npm run compare:matariki-holiday -- --focus=matariki-visibility
```

Inspect a specific maramataka or sky condition:

```sh
npm run diagnose:maramataka -- year-trace --year 2041
npm run diagnose:maramataka -- holiday-explorer --year 2041
npm run diagnose:maramataka -- sky-position --at 2041-07-21T06:00 --marker all
```

The diagnostic commands are for rule review. They do not use official holiday
dates as inputs to the maramataka calculation.

## CI

GitHub Actions runs CI for pull requests targeting `main`, pushes to `main`, and manual workflow dispatch. CI uses stub astronomy data so checks do not depend on live astronomy provider availability.

## Deployment

Production runtime configuration is documented in [docs/deployment-runtime.md](docs/deployment-runtime.md). Start from `.env.example` when configuring API environment variables.

Current release confidence and open accuracy gates are summarized in
[docs/are-we-ready.md](docs/are-we-ready.md).

## Workspace Layout

- `apps/maramataka-calendar`: Angular frontend.
- `api`: NestJS backend.
- `maramataka-domain`: Maramataka domain logic.
- `astronomy`: astronomical provider interfaces and implementations.
- `location`: location support library.
- `api-e2e` and `apps/maramataka-calendar-e2e`: API and browser e2e tests.
