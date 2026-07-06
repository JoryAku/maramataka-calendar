# Are We Ready?

Last reviewed: 2026-07-04

## Short Answer

We are ready for continued internal review and guided demos of the moon-tracker
experience. We are not yet ready to present the year rhythm, named marama, or
Matariki public holiday calculations as production-trustworthy.

The core app shape is strong: the Angular UI, NestJS API, astronomy provider,
file-backed cache, location registry, maramataka domain model, and CI path are
all in place. The remaining risk is not basic software plumbing. It is rule
confidence: named-year alignment, intercalation, and source-reviewed cultural
interpretation.

## Ready Now

### Product Experience

- Current-day mata lookup works from selected date and location.
- Month view shows moonrise-to-moonrise mata intervals and cycle anchors.
- Month view also places year events on the mata interval containing each
  event timestamp.
- Clicking a mata moves the selected day to that mata.
- Year view shows marama boundaries, month-scoped star markers, seasonal star
  markers, year-level Matariki appearance/disappearance, astronomical New Moon
  and Full Moon markers, and the Matariki public holiday event.
- Clicking a year-view marama moves the selected day to the first mata of that
  marama.
- The year timeline has separated visual lanes for event types, reducing
  crowding.

### Technical Foundation

- The repo has a clear Nx workspace shape: Angular frontend, NestJS API,
  maramataka domain library, astronomy library, and location library.
- API query validation and response shaping are documented in
  [api-contract.md](api-contract.md).
- Deployment runtime expectations are documented in
  [deployment-runtime.md](deployment-runtime.md).
- Astronomy Engine is wrapped behind a provider interface and a persistent
  file-backed cache.
- CI runs lint, tests, build, and e2e with deterministic stub astronomy data.
- The default rule set records source, tradition, version, boundary rule,
  calibration rule, and balancing assumptions.

### Moon Tracker Confidence

The moon-tracker MVP is the strongest part of the system. It has explicit rules
for:

- New Moon anchoring.
- Whiro moonrise start.
- Moonrise-to-next-moonrise mata boundaries.
- Full Moon as an observed astronomical anchor.
- Fixed mata sequence with trailing names dropped when the next Whiro arrives
  early.
- Overlapping Whiro when the next New Moon anchor arrives before a clean
  30-mata cycle finish.

This is ready for close review against known dates and local observations.

## Not Ready Yet

### Named Year And Intercalation

The year rhythm now has a provisional astronomy-only named-year rule, but it
still needs cultural/source review before we can treat it as settled. The
active Living by the Stars model uses Pipiri / Hamal to find the candidate
Whiro for Te Tahi o Pipiri. Ruhanui is inserted when the Hamal/Pipiri-defined
year contains 13 New Moon anchors before the next Hamal/Pipiri year start.

The official Matariki public holiday schedule is a useful calibration dataset.
When checked against Schedule 1 of the Te Kāhui o Matariki Public Holiday Act
2022, the current generated holiday event matches 18 of 31 years. That is not
the best official-date calibration result from the rules tried so far, but it
keeps the three known _Living by the Stars_ source-calendar fixtures aligned.
The remaining misses are still useful evidence that the public-holiday marama
selection, Tangaroa boundary convention, and mata-boundary rules need review
before we treat the holiday calculation as settled.

Until this is solved, the app should not claim that the named marama sequence is
fully production accurate across years.

Official reference:
https://www.legislation.govt.nz/act/public/2022/0014/latest/whole.html

### Review Diagnostics

The repo now includes terminal diagnostics for rule review:

- `npm run compare:matariki-holiday` generates the official holiday and
  Tangaroa-period calibration report.
- `npm run compare:matariki-holiday -- --focus=matariki-visibility` focuses on
  Pipiri, Matariki, Ruhanui, New Moon, and Full Moon anchors around the
  official schedule.
- `npm run diagnose:maramataka -- <command>` inspects specific sky positions,
  dawn visibility windows, first appearances, marama boundaries, year traces,
  holiday candidates, and event placement.

These tools are intentionally diagnostic. They do not feed official dates back
into the calculation. Recent checks did not find a stable Matariki-visibility
cutoff inside Pipiri. The active Ruhanui rule now counts New Moon anchors
between one Hamal/Pipiri-defined year start and the next: 13 anchors inserts
Ruhanui between Pipiri and Takurua, while 12 anchors keeps the regular sequence.
This keeps the three known _Living by the Stars_ source-calendar fixtures
aligned while leaving remaining official-holiday differences in the calibration
report.

### Matariki Public Holiday Rule

The current implementation creates a `public-holiday` year event from the
astronomy-derived maramataka model by finding the Friday within the selected
holiday marama that is closest to the four-night Tangaroa period from
`Tangaroa-ā-mua` through `Tangaroa whāriki kio-kio`. The selected marama is Te
Tahi o Pipiri by default, or Ruhanui when the Hamal/Pipiri New Moon count rule
inserts the regulating marama. The Friday is treated as a local civil-day
interval and compared to the exact generated start/end instants of that
Tangaroa period.
Against the official 2022-2052 schedule, the current event marker matches
18/31 years.

Known limitations:

- It uses the generated selected holiday marama, so it inherits any year-start,
  Ruhanui, or mata-boundary drift.
- The implementation currently treats the holiday target as the named Tangaroa
  period in the Living by the Stars sequence: `Tangaroa-ā-mua`,
  `Tangaroa-ā-roto`, `Tangaroa-whakapau`, and
  `Tangaroa whāriki kio-kio`.
- The estimate is still imperfect and should keep being calibrated against the
  official schedule. The current date differences are 2024, 2027, 2028, 2030,
  2031, 2034, 2048, and 2051 one Friday late; 2036, 2041, and 2047 one marama
  early.
- The selected holiday marama's generated Tangaroa period overlaps the official
  Tangaroa period in 28/31 comparison years, but the exact generated period
  currently matches 3/31 years. That points to mata-boundary calibration rather
  than the Friday picker alone.
- The public holiday schedule should remain a calibration target for refining
  the astronomy-only rule; it should not be used as an input to the event
  calculation.

### Dawn Star Markers

Star marker calculations are now based on a dawn window, not a fixed 6:00 AM
time. This is a major improvement, but still needs expert/source review.

Open questions:

- Should daily star visibility use the midpoint of astronomical dawn, the
  beginning of the dawn window, sunrise, or a configurable point?
- Should month-scoped and seasonal first appearances use the same visibility
  threshold?
- Should different traditions have different star marker sampling rules?

### Cultural And Source Review

The app is careful to model its current rule set as one explicit
implementation, not a universal maramataka. That posture should continue.

Before public release, the rule set needs review for:

- Mata naming and orthography.
- Month naming and star associations.
- The source split between the active Living by the Stars config and the
  retained Mita Te Tai / Best config.
- How to represent Puanga and Matariki without implying one universal year
  marker.
- Intercalation and thirteenth-month handling.
- Tangaroa-period interpretation for the public holiday.
- Wording in the UI and docs so uncertainty is visible where it matters.

## Release Readiness

### Internal Demo

Status: ready.

Use this mode for product walkthroughs, UI feedback, and rule-review sessions.
Be explicit that the year rhythm is a working model with known open questions.

### Expert Review Beta

Status: nearly ready.

Before this, add a calibration page or report that compares generated outputs
against known anchors:

- Official Matariki public holiday dates, using the current comparison script
  as the review-facing report.
- Golden moonrise / moonset / Full Moon cases already represented in tests.
- Known local observations for selected locations.
- Years governed by the Hamal/Pipiri New Moon count Ruhanui rule.

### Public Production

Status: not ready.

Production readiness requires:

- A reviewed intercalation rule or an explicit decision to use a curated
  year/month table.
- A reviewed Tangaroa-period rule for Matariki public holiday calculation.
- Source-reviewed copy for year rhythm, star markers, and uncertainty.
- Monitoring around API readiness and astronomy provider failures.
- A deployment target with persistent cache storage configured.

## Suggested Next Work

1. For each official date, identify which generated marama and mata contain the
   official Tangaroa period.
2. Use the remaining holiday and Tangaroa-period differences to review the
   Tangaroa-period boundary rule.
3. Use the new diagnostics to test remaining Pipiri/Ruhanui and holiday
   mismatches against Matariki visibility, lunar anchors, and dawn sky
   positions.
4. Decide whether the Hamal/Pipiri New Moon count rule is sufficient or whether
   a curated named-year table is still needed.
5. Add UI wording that distinguishes astronomical events, observed maramataka
   model outputs, and legally scheduled holidays.

## Current Decision

Keep the app moving as an accurate moon tracker and review tool. Do not market
the year rhythm or Matariki holiday calculation as settled until the
named-year rule has source review and the Tangaroa-period rule is resolved.
