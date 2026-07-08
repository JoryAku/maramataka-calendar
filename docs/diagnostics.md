# Diagnostics

The diagnostic commands are for rule review and development. They do not feed
official holiday dates or source-calendar examples back into the calendar
calculation.

Generated marama, mata, and year comparison rows are read through the API
endpoints so the reports exercise the same composition layer as the app. Start
the API server first, or set `MARAMATAKA_API_BASE_URL` if you are pointing at a
different host. Lower-level sky-position and first-appearance probes still use
the astronomy provider directly because they inspect raw body positions and
visibility rules.

## Quick Checks

Print active cache fingerprints and full readable metadata:

```sh
npm run diagnose:maramataka -- cache-fingerprints
```

Inspect the generated year around a local date:

```sh
npm run diagnose:maramataka -- year-trace --year 2041
```

Inspect Matariki holiday placement for a year:

```sh
npm run diagnose:maramataka -- holiday-explorer --year 2041
```

Inspect a specific sky position:

```sh
npm run diagnose:maramataka -- sky-position --at 2041-07-21T06:00 --marker all
```

Inspect first dawn appearance for a marker:

```sh
npm run diagnose:maramataka -- first-appearance --year 2041 --marker matariki
```

Inspect a marama boundary around a date:

```sh
npm run diagnose:maramataka -- marama-boundary --at 2041-07-21T12:00
```

## Matariki Comparison Reports

Run the full official-date comparison:

```sh
npm run compare:matariki-holiday
```

Focus on Matariki visibility data:

```sh
npm run compare:matariki-holiday -- --focus=matariki-visibility
```

Check only the Living by the Stars 2021-2024 calendar source rows:

```sh
npm run compare:matariki-holiday -- --focus=source-calendar
```

## Location Options

Most diagnostics accept either a named location or explicit coordinates:

```sh
npm run diagnose:maramataka -- sky-position --location Wellington --at 2041-07-21T06:00 --marker all
npm run diagnose:maramataka -- sky-position --lat -41.2865 --lon 174.7762 --timezone Pacific/Auckland --at 2041-07-21T06:00 --marker all
```

Use explicit coordinates when checking whether a rule or sky event is stable
across places.

## Runtime Profiling

Turn on API timing logs when checking slow location changes or heavy calendar
years:

```sh
MARAMATAKA_PROFILE=1 npm run dev:all
```

Each Maramataka endpoint writes a structured `maramataka_profile` log with the
operation, requested location/date, status, and duration in milliseconds. This
is useful for comparing the fast `page` payload with the lazy-loaded
`star-markers` dawn sky and heavier `year` timeline. The app derives the
selected-day panel from the `page.cycle` response.

Turn on browser request timings from DevTools for the frontend fan-out:

```js
localStorage.setItem('maramataka:profile', '1');
```

Reload the page, change location or date, and the console will print timing
lines for the fast `page` request, lazy-loaded dawn sky request, and
lazy-loaded `year` request. Disable it with:

```js
localStorage.removeItem('maramataka:profile');
```

## Dev Verification

Fast local confidence check:

```sh
npm run verify:fast
```

Full local confidence check:

```sh
npm run verify
```

Start the API and frontend together:

```sh
npm run dev:all
```
