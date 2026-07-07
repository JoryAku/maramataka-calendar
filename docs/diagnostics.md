# Diagnostics

The diagnostic commands are for rule review and development. They do not feed
official holiday dates or source-calendar examples back into the calendar
calculation.

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

