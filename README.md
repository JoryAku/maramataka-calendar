# Matariki Calendar

Matariki Calendar is an astronomy-backed calendar for exploring the maramataka
year. It calculates moonrise-based mata, marama boundaries, dawn star markers,
and the Matariki year rhythm from astronomical events for a selected location.

The active calendar model is grounded in the **Living by the Stars 2021-2024
calendar material**. The app uses that source material as the current source of
truth for named marama, Pipiri/Ruhanui placement, and the year calculation,
while keeping official public holiday dates as diagnostics rather than rule
inputs.

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

Run the fast developer verification loop:

```sh
npm run verify:fast
```

Run the broader local verification loop:

```sh
npm run verify
```

Start the API and frontend together:

```sh
npm run dev:all
```

Run the CI-equivalent command with stub astronomy data:

```sh
npm run ci
```

## Calibration And Diagnostics

The current year calculation is documented in
[docs/maramataka-rules.md](docs/maramataka-rules.md).
The calculation flow is summarized in [docs/architecture.md](docs/architecture.md),
and diagnostic command examples live in [docs/diagnostics.md](docs/diagnostics.md).

Compare generated dates with the official Matariki holiday schedule:

```sh
npm run compare:matariki-holiday
```

Inspect Pipiri, Matariki, Ruhanui, New Moon, and Full Moon anchors around the
official schedule:

```sh
npm run compare:matariki-holiday -- --focus=matariki-visibility
```

Check only the Living by the Stars 2021-2024 calendar source rows:

```sh
npm run compare:matariki-holiday -- --focus=source-calendar
```

Inspect a specific maramataka or sky condition:

```sh
npm run diagnose:maramataka -- year-trace --year 2041
npm run diagnose:maramataka -- holiday-explorer --year 2041
npm run diagnose:maramataka -- sky-position --at 2041-07-21T06:00 --marker all
```

These commands are for rule review. They do not feed official holiday dates
back into the calendar calculation.

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
