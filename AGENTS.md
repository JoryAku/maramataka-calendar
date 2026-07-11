<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Maramataka Calendar Project Notes

This file is intentionally practical guidance for coding agents. Keep it short
enough to scan, and edit it whenever the project workflow changes.

## Project Shape

- This is an Nx workspace for an astronomy-backed Matariki / maramataka
  calendar.
- `apps/maramataka-calendar` is the Angular frontend.
- `api` is the Nest API.
- `maramataka-domain` contains the calendar rule-set model and maramataka
  generation logic.
- `astronomy` wraps Astronomy Engine, moon/sky calculations, timezone helpers,
  and astronomy caching.
- `location` contains supported location data and lookup helpers.
- `api-e2e` contains API end-to-end tests.
- `docs/architecture.md`, `docs/maramataka-rules.md`,
  `docs/api-contract.md`, and `docs/diagnostics.md` are the best first reads
  before changing behaviour.

## Usual Commands

- Use `npm exec -- nx ...` rather than a global `nx`.
- Use `env -u NO_COLOR` for long/check output when readability matters.
- Fast local verification:
  `npm run verify:fast`
- Full local verification:
  `npm run verify`
- API tests:
  `npm exec -- nx test api --skipNxCache --outputStyle=static`
- Domain tests:
  `npm exec -- nx test maramataka-domain --skipNxCache --outputStyle=static`
- Run API:
  `npm exec -- nx serve api`
- Run frontend:
  `npm exec -- nx serve maramataka-calendar`
- Run both:
  `npm run dev:all`
- Diagnostic tool:
  `npm run diagnose:maramataka -- <command>`

## Verification Expectations

- Prefer targeted Nx tests while iterating, then run `npm run verify:fast` or
  `npm run verify` when the change touches shared/domain behaviour.
- Always mention which checks were run and which were skipped.
- Add or update tests when changing maramataka rules, API response shapes,
  time/date interpretation, astronomy provider behaviour, or frontend loading
  orchestration.
- Keep `git diff --check` clean. The verification scripts already include it.

## Domain Rules

- Treat the active default rule set as source-specific, not universal:
  `living-by-the-stars-observational-v1`.
- The active source model is the Living by the Stars 2021-2024 calendar
  material. Do not silently generalise it into "the" maramataka algorithm.
- Interpret local dates in the selected location timezone before applying
  astronomy and maramataka logic.
- Whiro/Kohititanga is anchored to the New Moon date's local moonrise.
- Mata boundaries are moonrise-to-next-moonrise intervals.
- Full Moon is an observed astronomical anchor, not a reason to rewrite the
  mata sequence.
- Pipiri / Hamal, Matariki visibility, Ruhanui insertion, and Matariki public
  holiday placement have deliberately separate rules. Keep them separate.
- Official public holiday dates are useful diagnostics, but are not currently
  authoritative inputs to the calendar calculation.
- If changing these assumptions, update `docs/maramataka-rules.md` and add
  focused tests in `maramataka-domain`.

## Architecture Boundaries

- UI code should render data returned by the API, not duplicate calendar rules.
- API controllers should validate and map requests/responses; keep domain
  calculations in `maramataka-domain` and astronomy details in `astronomy`.
- API response shaping should use explicit DTO/mapping helpers rather than
  large inline object literals.
- Astronomy provider failures should surface as typed, predictable unavailable
  states. Avoid leaking provider internals through API responses.
- Cache keys and fingerprints are intentional. If calculation inputs change,
  update fingerprint metadata so stale astronomy or rule-set results are not
  reused.
- Generated year/month results are currently cached in memory. The file-backed
  cache boundary is astronomy data, normally `.cache/astronomy.json`.

## Frontend Notes

- The maramataka page uses a page-scoped store/facade for selected
  date/location state, request cancellation, shared page data, year-core
  loading, and timeline enrichment.
- Keep page components focused on user interactions and passing state into
  child views.
- Prefer small, readable Angular components and templates over duplicating
  transformation logic in the view.
- For UI work, check desktop and mobile layouts. Avoid overlapping text,
  unstable dimensions, and large layout shifts while async data loads.

## Coding Style

- Follow the existing TypeScript style. Keep names explicit around date,
  timezone, astronomy, and rule-set concepts.
- Prefer structured parsing/formatting helpers over ad hoc date or string
  manipulation.
- Keep comments for source assumptions, non-obvious astronomy/calendar logic,
  and cache/fingerprint reasoning. Avoid comments that merely restate code.
- Do not introduce broad abstractions unless they remove real duplication or
  match an existing pattern.
- Preserve generated or managed sections unless the tool that owns them is
  being run.

## Workflow Preferences

- Make focused changes and avoid unrelated refactors.
- Do not commit unless explicitly asked.
- Do not revert user changes. If the working tree is dirty, work with the
  existing changes and call out any relevant conflicts.
- Before changing maramataka behaviour, inspect the docs and existing tests
  first. This project has a lot of encoded domain reasoning.
- When uncertain about a calendar rule, prefer adding a diagnostic or focused
  test case over guessing.

## Useful Diagnostics

Examples:

```sh
npm exec -- nx test maramataka-domain --skipNxCache --outputStyle=static
npm run diagnose:maramataka -- year-trace --year 2041
npm run diagnose:maramataka -- holiday-explorer --year 2041
npm run diagnose:maramataka -- sky-position --at 2041-07-21T06:00 --marker all
npm run diagnose:maramataka -- first-appearance --year 2041 --marker matariki
npm run diagnose:maramataka -- cache-fingerprints
```
