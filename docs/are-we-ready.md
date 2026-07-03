# Are We Ready?

Last reviewed: 2026-07-03

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
  markers, Matariki disappearance, astronomical New Moon and Full Moon markers,
  and the Matariki public holiday event.
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

The year rhythm now has a provisional astronomy-only intercalation rule, but it
still needs cultural/source review before we can treat it as settled.

The official Matariki public holiday schedule is a useful calibration dataset.
When checked against Schedule 1 of the Te Kāhui o Matariki Public Holiday Act
2022, the current generated holiday event matches most years but still misses
two years by 7 days. These remaining misses likely point to Tangaroa-period
width or boundary interpretation rather than the Ruhanui/intercalation layer.

Until this is solved, the app should not claim that the named marama sequence is
fully production accurate across years.

Official reference:
https://www.legislation.govt.nz/act/public/2022/0014/latest/whole.html

### Matariki Public Holiday Rule

The current implementation creates a `public-holiday` year event from the
astronomy-derived maramataka model by finding the Friday within Te Tahi o
Pipiri that is closest to a provisional four-night Tangaroa boundary window
from `Korekore-te-rawea` through `Tangaroa-kiokio`.
Against the official 2022-2052 schedule, the current event marker matches
28/31 years.

Known limitations:

- It uses the generated first named marama, so it inherits any year-start or
  intercalation drift.
- The implementation currently treats the holiday target as:
  `Korekore-te-rawea`, `Korekore-piri-ki-ngā-Tangaroa`, `Tangaroa-ā-mua`,
  `Tangaroa-ā-roto`, and `Tangaroa-kiokio`. This is intentionally provisional
  while we look for a stronger source for the mata names that make up the
  official Tangaroa period.
- The estimate is still imperfect and should keep being calibrated against the
  official schedule. The remaining differences are 2027 and 2030 estimating
  one Friday late, and 2044 estimating one Friday early.
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

- Official Matariki public holiday dates, extending the current comparison
  script into a review-facing report.
- Golden moonrise / moonset / Full Moon cases already represented in tests.
- Known local observations for selected locations.
- Years governed by the provisional Ruhanui / thirteenth-month rule.

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

1. Turn the Matariki holiday comparison script into a review-facing calibration
   report.
2. For each official date, identify which generated marama and mata contain the
   official Tangaroa period.
3. Use the remaining 2027, 2030, and 2044 differences to review the
   Tangaroa-period boundary rule.
4. Review Matariki heliacal rising as a calibration clue for the Pipiri and
   Ruhanui boundary rules.
5. Decide whether the provisional Ruhanui/intercalation rule is sufficient or
   whether a curated named-year table is still needed.
6. Add UI wording that distinguishes astronomical events, observed maramataka
   model outputs, and legally scheduled holidays.

## Current Decision

Keep the app moving as an accurate moon tracker and review tool. Do not market
the year rhythm or Matariki holiday calculation as settled until the
intercalation rule has source review and the Tangaroa-period rule is resolved.
