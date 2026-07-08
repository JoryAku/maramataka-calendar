# Matariki Calendar Rules

This document records the rules currently used by the Matariki Calendar app.
The app uses astronomy to calculate the dates and boundaries of the maramataka
year for a selected location. The active source material is the **Living by the
Stars 2021-2024 calendar material**.

These rules are intentionally explicit. They are not presented as a universal
maramataka algorithm; they describe the active calendar model implemented in
this app.

## Mata Boundary Rule

In the active model, a mata is defined by moonrise-to-next-moonrise.

1. Get the astronomical New Moon date from Astronomy Engine New Moon data,
   interpreted in the selected location and timezone.
2. Find the moonrise on that local New Moon date. If that date has no moonrise,
   use the first moonrise after the exact New Moon instant.
3. Mark the interval from that moonrise to the next moonrise as Whiro.
4. Assign the remaining 29 mata to the next 29 moonrise-to-moonrise intervals,
   counting forward through the 30 mata sequence.
5. Resolve a current timestamp to the mata whose moonrise-to-moonrise interval
   contains that timestamp.
6. Treat every Astronomy Engine New Moon date as a hard Whiro anchor. If the
   next New Moon date lands before the previous 30-mata cycle has finished, the
   matching moonrise-to-moonrise interval carries both meanings: its position in
   the previous cycle and Whiro for the next cycle.

This means Whiro is anchored to the New Moon date's moonrise. The New Moon date
comes from Astronomy Engine New Moon data, but the mata boundary is the local
moonrise-to-next-moonrise interval for that date. One maramataka cycle contains
Whiro plus the next 29 moonrise-to-moonrise intervals. Cycles may overlap rather
than being forced into a clean cut between New Moons.

## Source And Rule Set Model

Domain code depends on a `MaramatakaRuleSet`, which records:

- how the marama begins
- how mata boundaries are calculated
- which mata names are used
- which astronomical event calibrates the middle of the marama
- which year-start marker defines the first Whiro of the star year
- which named-month markers label marama after the year boundary is known
- how balancing is expected to work
- which source, tradition, and rule-set version produced the result

The current default rule set is `living-by-the-stars-observational-v1`. It uses
the Living by the Stars 2021-2024 calendar material as the source of truth and
keeps each astronomy assumption explicit:

- Whiro/Kohititanga is anchored to the New Moon date's moonrise.
- Mata boundaries are moonrise-to-next-moonrise.
- Full Moon is retained as an observed astronomical anchor.
- Mata names follow the fixed 1-30 sequence; if the next Whiro arrives before
  all 30 intervals are used, trailing mata names are dropped.
- Pipiri / Hamal provides the candidate Whiro for Te Tahi o Pipiri; Matariki
  first visibility and the Hamal-defined New Moon count decide whether that
  candidate is kept, shifted, or followed by Ruhanui.
- `yearStartRule` carries Pipiri / Hamal as the source-linked year-start
  marker, while `matarikiHoliday.calibrationMarker` keeps Matariki available
  for public holiday calibration.

The Mita Te Tai / Best material remains available as a separate rule set and
historical reference. The source passage previously used to reason about lunar
balancing is:

> "In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara's notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."

The implementation now treats this as source context rather than the active
balancing rule:

- Full Moon remains visible as a separate astronomical anchor.
- The mata name sequence is not rewritten to duplicate the full-moon anchor
  name.
- If the next Whiro moonrise arrives early, the marama closes and the unused
  trailing mata names are dropped.
- The next Whiro moonrise closes the current marama and begins the next.

## Dawn Star Marker Rule

The star layer uses Astronomy Engine sky positions for the selected location.
Daily marker visibility is sampled at the midpoint between the rising Sun
crossing 18° and 12° below the horizon. Year-view first-appearance events scan
from the Sun crossing 18° below the horizon through sunrise, so markers that
rise after astronomical dawn, such as Kōpū/Venus in some years, can still be
placed at their first dawn-window horizon appearance.

The first-appearance scan is implemented as a reusable dawn-rising rule with
per-marker settings. The active marker settings currently preserve the previous
behavior for every configured star: start when the Sun is `-18°`, end at
sunrise (`0°`), require the marker to be at least `0°` above the horizon, keep
the north-to-south dawn field from `0°` to `180°`, and sample every five minutes.
These settings are intentionally explicit so individual stars can later use
stricter heliacal-rising thresholds without changing the rest of the timeline
logic.

Year-view star events are split into two scopes:

- Month-scoped markers are searched within the relevant named marama.
- Seasonal markers are searched across the maramataka year after month-scoped
  markers have been placed.
- Matariki appearance/disappearance is marked separately from named marama
  markers. First appearance is the Matariki calibration marker's first
  provider-backed dawn-window appearance inside the displayed maramataka year.
  Disappearance is the first local date in the longest period where Matariki is
  never above the horizon during astronomical night (`Sun <= -18°`) within the
  displayed maramataka year.

## Solar Season Anchors

The year rhythm view includes the four astronomical solar season anchors:
March equinox, June solstice, September equinox, and December solstice. These
are informational timeline events from Astronomy Engine `Seasons(year)` data.
They do not currently drive Whiro, marama naming, Ruhanui, or Matariki public
holiday calculations.

## Year Calculation Rule

The active model calculates the displayed maramataka year from astronomy events
only. Official Matariki holiday dates are not inputs to this calculation.

The model separates three concepts:

- Pipiri / Hamal is the named-month marker for Te Tahi o Pipiri.
- Matariki is used to test whether a candidate Pipiri Whiro is early.
- Ruhanui is the intercalary regulating marama when the rule inserts it.

The year calculation is:

1. Find the first provider-backed dawn-window appearance of Pipiri / Hamal for
   the solar year.
2. Find the first Whiro/New Moon on or after that local date. This is the
   candidate `Te Tahi o Pipiri`.
3. Find Matariki's first provider-backed dawn-window appearance for the same
   solar year.
4. If Matariki has already appeared by the candidate Pipiri Whiro, keep the
   candidate as `Te Tahi o Pipiri` and keep the regular month sequence.
5. If Matariki has not appeared by the candidate Pipiri Whiro, count New Moon
   anchors from the candidate Whiro up to, but not including, the next solar
   year's Pipiri / Hamal candidate Whiro.
6. If that candidate year contains 13 New Moon anchors, shift `Te Tahi o
   Pipiri` to the next Whiro. This treats the original candidate as belonging
   to the previous year rather than attaching Ruhanui to the start of the new
   displayed year.
7. If that candidate year contains 12 New Moon anchors, keep the candidate as
   `Te Tahi o Pipiri` and insert `Ruhanui` as the second marama, between
   `Te Tahi o Pipiri` and `Te Rua o Takurua`.

The displayed year begins at the resolved `Te Tahi o Pipiri` Whiro and ends
immediately before the next resolved `Te Tahi o Pipiri` Whiro. If Ruhanui is
inserted, it sits inside that displayed year after Pipiri and before Takurua.

This is the clearest current astronomy-only reading of the Living by the Stars
2021-2024 calendar evidence. The focused calendar-source comparison currently
matches all 3 of 3 known calendar month placements.

## Matariki Public Holiday Marker

The Matariki public holiday event is calculated from the Friday closest to the
four-night Tangaroa period in the selected holiday marama. That marama is Te
Tahi o Pipiri by default, or Ruhanui when the Living by the Stars calendar rule
inserts the regulating marama. Candidate Fridays are local dates within the
selected marama, but the comparison uses exact instants: each Friday is treated
as a local solar-day interval and compared to the exact start/end instants of
the generated Tangaroa period. For this rule set, the current Tangaroa target
is `Tangaroa-ā-mua`,
`Tangaroa-ā-roto`, `Tangaroa-whakapau`, and
`Tangaroa whāriki kio-kio`.

Official public holiday dates are useful diagnostics, but they are not treated
as authoritative inputs while the calendar source material is still being
reconciled. Run `npm run compare:matariki-holiday` for the current
official-date diagnostic summary.

## Calibration And Diagnostic Tools

Terminal tools support rule review without changing the calculation:

- `npm run compare:matariki-holiday` produces the full official Matariki
  diagnostic report. It compares generated public holiday dates, generated
  Tangaroa periods, official Tangaroa periods, selected marama, likely
  difference categories, and Living by the Stars calendar source checks.
- `npm run compare:matariki-holiday -- --focus=matariki-visibility` narrows
  the report to the current Matariki/Ruhanui investigation. It prints Pipiri,
  Matariki, and Ruhanui first-visibility dates against official Tangaroa
  periods, then adds nearby New Moon and Full Moon anchors so proposed rules
  can be checked against lunar events instead of raw day counts.
- `npm run compare:matariki-holiday -- --focus=source-calendar` ignores the
  official holiday schedule and reports only the Living by the Stars 2021-2024
  calendar source rows, including expected Whiro dates, generated Whiro dates,
  Pipiri/Ruhanui/Matariki first appearances, and the current Ruhanui signal.
- `npm run diagnose:maramataka -- <command>` provides targeted astronomy and
  maramataka inspection. Current commands are `sky-position`,
  `dawn-visibility`, `first-appearance`, `marama-boundary`, `year-trace`,
  `holiday-explorer`, and `event-placement`.

Useful examples:

```sh
npm run compare:matariki-holiday -- --focus=matariki-visibility
npm run compare:matariki-holiday -- --focus=source-calendar
npm run diagnose:maramataka -- year-trace --year 2041
npm run diagnose:maramataka -- holiday-explorer --year 2041
npm run diagnose:maramataka -- sky-position --at 2041-07-21T06:00 --marker all
npm run diagnose:maramataka -- first-appearance --year 2041 --marker matariki
```

The tools remain in the repo as review aids. They should be used to test future
source-derived hypotheses before changing the rule set.

## Astronomy Provider Resilience

The app treats Astronomy Engine as the authoritative astronomy provider for New
Moon, Full Moon, moonrise, moonset, transit, phase, illumination, equinox, and
solstice data.

Provider calls must fail predictably:

- Provider calculation failures are surfaced as typed astronomy provider errors.
- Missing moon events, for example a date with no moonrise, are explicit
  data-unavailable errors rather than implicit nulls.
- API responses map provider failures to a stable unavailable response instead
  of leaking provider internals.

The API also uses a persistent astronomy cache in non-stub mode. The first cache
slice is file-backed and dependency-free:

- Default path: `.cache/astronomy.json`.
- Deployment override: `MARAMATAKA_ASTRONOMY_CACHE_PATH`.
- Cached values are normalized astronomy results, not raw provider responses.
- Cache files and entries carry schema versions so incompatible data can be
  ignored predictably.
- Cache keys include fingerprint namespaces for raw astronomy facts and
  observational dawn/star calculations, so changing visibility metadata creates
  cache misses instead of serving stale derived values.
- The maramataka rule set also has readable fingerprint metadata, currently
  used by in-memory month/year cache keys, covering mata names, named-month
  markers, year-start logic, Ruhanui logic, and the Matariki holiday marker.
- The active short fingerprints and compact metadata summaries are logged at
  API startup. Full readable metadata can be printed with
  `npm run diagnose:maramataka -- cache-fingerprints`.
- Cached date strings are revived as `Date` values before reaching domain code.

This file-backed cache is the current persistence boundary. It can later be
swapped for SQLite, Postgres, or object storage without changing the
Maramataka domain service.

## Source Reference

The active default config is now source-specific:

- `living-by-the-stars-observational-v1` uses the Living by the Stars
  2021-2024 calendar material as the active source of truth. It supplies the
  current mata sequence, phase groups, named marama, named-marama star
  associations, the Ruhanui source note, and the three known calendar
  year-placement rows used by `--focus=source-calendar`. Its marama names are
  `Te Tahi o Pipiri`, `Te Rua o Takurua`,
  `Te Toru Here o Pipiri`, `Te Whā o Mahuru`, `Te Rima o Kōpū`,
  `Te Ono o Whitiānaunau`, `Te Whitu o Hakihea`, `Te Waru o Rehua`,
  `Te Iwa o Rūhī`, `Te Ngahuru o Poutūterangi`,
  `Te Ngahuru mā tahi o Paengawhāwhā`, and
  `Te Ngahuru mā rua o Haki Haratua`, with `Ruhanui` as the regulating
  intercalary marama.
- `mita-te-tai-best-observational-v1` remains available for the Mita Te Tai /
  Elsdon Best material, including the fishing guidance content layer and the
  Himiona Tikitu / Best named-month list.

Elsdon Best, _Fishing Methods and Devices of the Maori_, NZETC, archived by the
National Library of New Zealand:
https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html

The Mita Te Tai / Best source remains useful because it records a 30-night
lunar sequence, Whiro as the first night, the kohititanga/new-moon marker, and
the huanga/full-moon marker. The current implementation keeps the full moon as
a separate astronomical anchor and uses a fixed mata sequence, dropping
trailing names only when the next Whiro closes the marama early. The
moonrise-to-moonrise boundary is an application rule layered onto the selected
source-specific rule set.

## Implementation Decisions To Keep Reviewing

These behaviours are implemented in code but should remain visible during
review:

- If there is no moonrise on the local New Moon date, Whiro uses the first
  moonrise after the exact New Moon instant.
- Since mata are moonrise-to-next-moonrise, every timestamp between fetched
  moonrises belongs to one mata.
- The next astronomical New Moon date's moonrise closes the current marama and
  begins the next Whiro.

The historical source notes that lunar-month naming could be adjusted in
practice. The app should avoid hiding those adjustments inside implicit code.
