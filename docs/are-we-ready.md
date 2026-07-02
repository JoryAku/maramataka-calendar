# Are We Ready?

Last reviewed: 2026-07-02

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
- Clicking a mata moves the selected day to that mata.
- Year view shows marama boundaries, month-scoped star markers, seasonal star
  markers, astronomical New Moon and Full Moon markers, and the Matariki public
  holiday event.
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
- Full Moon / Ohua calibration.
- Late full-moon balancing by duplicating Ohua and dropping final mata names.
- Overlapping Whiro when the next New Moon anchor arrives before a clean
  30-mata cycle finish.

This is ready for close review against known dates and local observations.

## Not Ready Yet

### Named Year And Intercalation

The year rhythm still lacks an explicit intercalation rule. This is the largest
accuracy gap.

The official Matariki public holiday schedule is a useful calibration dataset.
When checked against Schedule 1 of the Te Kāhui o Matariki Public Holiday Act
2022, the current generated holiday event matches some years but misses others
by 7 or 28 days. The 28-day misses strongly suggest years where a thirteenth
month or named-month adjustment is needed before Pipiri/Piripi. The 7-day
misses likely point to Tangaroa-period width or boundary interpretation.

Until this is solved, the app should not claim that the named marama sequence is
fully production accurate across years.

Official reference:
https://www.legislation.govt.nz/act/public/2022/0014/latest/whole.html

### Matariki Public Holiday Rule

The current implementation creates a `public-holiday` year event by finding the
closest Friday to the Tangaroa nights in Te Tahi o Pipiri.

Known limitations:

- It uses the generated first named marama, so it inherits any year-start or
  intercalation drift.
- The implementation currently treats explicit `Tangaroa-*` mata as the
  Tangaroa period. Official descriptions refer to a four-day Tangaroa period,
  so we need a source decision about whether to include
  `Korekore whakapiri ki nga Tangaroa`, `Otane`, or another adjacent night.
- The public holiday schedule should remain a calibration target while the rule
  is being refined.

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

- Official Matariki public holiday dates.
- Golden moonrise / moonset / Full Moon cases already represented in tests.
- Known local observations for selected locations.
- Years that appear to require a thirteenth month.

### Public Production

Status: not ready.

Production readiness requires:

- A documented intercalation rule or an explicit decision to use a curated
  year/month table.
- A reviewed Tangaroa-period rule for Matariki public holiday calculation.
- Source-reviewed copy for year rhythm, star markers, and uncertainty.
- Monitoring around API readiness and astronomy provider failures.
- A deployment target with persistent cache storage configured.

## Suggested Next Work

1. Build a calibration fixture for official Matariki public holiday dates from
   2022 to 2052.
2. For each official date, identify which generated marama and mata contain the
   official Tangaroa period.
3. Use that dataset to infer where intercalation or month-name adjustment is
   needed.
4. Decide whether the app should calculate intercalation or store a curated
   named-year table.
5. Update the Matariki public holiday event to use the reviewed rule.
6. Add UI wording that distinguishes astronomical events, observed maramataka
   model outputs, and legally scheduled holidays.

## Current Decision

Keep the app moving as an accurate moon tracker and review tool. Do not market
the year rhythm or Matariki holiday calculation as settled until intercalation
and Tangaroa-period rules are resolved.
