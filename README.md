# Maramataka Calendar

Maramataka Calendar is an Nx workspace for a modern Maramataka app. The current product focus is an accurate moon tracker: current mata, moonrise and moonset, lunar phase anchors, and a cycle/month view.

## Requirements

Use Node.js 20.19.0 or newer in the Node 20 line. Node 22.12.0 or newer is also supported.

If you use `nvm`:

```sh
nvm use
```

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

## CI

GitHub Actions runs CI for pull requests targeting `main`, pushes to `main`, and manual workflow dispatch. CI uses stub astronomy data so checks do not depend on live astronomy provider availability.

## Deployment

Production runtime configuration is documented in [docs/deployment-runtime.md](docs/deployment-runtime.md). Start from `.env.example` when configuring API environment variables.

## Workspace Layout

- `apps/maramataka-calendar`: Angular frontend.
- `api`: NestJS backend.
- `maramataka-domain`: Maramataka domain logic.
- `astronomy`: astronomical provider interfaces and implementations.
- `location`: location support library.
- `api-e2e` and `apps/maramataka-calendar-e2e`: API and browser e2e tests.
