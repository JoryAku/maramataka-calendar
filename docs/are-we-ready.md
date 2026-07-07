# Are We Ready?

Last reviewed: 2026-07-07

## Short Answer

We are ready for continued internal review and guided demos of the Matariki
calendar experience. We are not yet ready to present the year rhythm, named
marama, or Matariki public holiday marker as production-trustworthy.

The core app shape is strong: the Angular UI, NestJS API, astronomy provider,
file-backed cache, location registry, maramataka domain model, and CI path are
all in place. The remaining risk is not basic software plumbing. It is rule
confidence: year alignment, Ruhanui/intercalation, and source-reviewed
cultural interpretation.

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

### Astronomy Calculation Confidence

The astronomy-backed mata and marama calculations are the strongest part of the
system. They have explicit rules for:

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

The active source of truth is the Living by the Stars 2021-2024 calendar
material. The current model uses astronomy to calculate a year that matches
the three known calendar rows we have from that source.

The displayed year begins at the resolved Te Tahi o Pipiri Whiro and ends
immediately before the next resolved Te Tahi o Pipiri Whiro. If Ruhanui is
inserted, it belongs inside the displayed year after Pipiri and before Takurua.

The Living by the Stars calendar comparison currently matches all 3 of 3 known
2021-2024 calendar month placements, so it is the strongest source-of-truth
rule we have at the moment.

Until this is solved, the app should not claim that the named marama sequence is
fully production accurate across years.

### Review Diagnostics

The repo now includes terminal diagnostics for rule review:

- `npm run compare:matariki-holiday` generates an official holiday and
  Tangaroa-period diagnostic report.
- `npm run compare:matariki-holiday -- --focus=matariki-visibility` focuses on
  Pipiri, Matariki, Ruhanui, New Moon, and Full Moon anchors around the
  official schedule.
- `npm run compare:matariki-holiday -- --focus=source-calendar` checks only
  the Living by the Stars 2021-2024 calendar month-placement rows.
- `npm run diagnose:maramataka -- <command>` inspects specific sky positions,
  dawn visibility windows, first appearances, marama boundaries, year traces,
  holiday candidates, and event placement.

These tools are intentionally diagnostic. They do not feed official dates back
into the calculation. The active Living by the Stars calendar rule currently
aligns all 3 of 3 known 2021-2024 calendar month placements.

### Matariki Public Holiday Marker

The current implementation creates a `public-holiday` year event from the
astronomy-derived maramataka model by finding the Friday within the selected
holiday marama that is closest to the four-night Tangaroa period from
`Tangaroa-ā-mua` through `Tangaroa whāriki kio-kio`. The selected marama is Te
Tahi o Pipiri by default, or Ruhanui when the Living by the Stars calendar rule
inserts the regulating marama. The Friday is treated as a local civil-day
interval and compared to the exact generated start/end instants of that
Tangaroa period.
Official holiday dates are diagnostics only. Run
`npm run compare:matariki-holiday` for the current comparison against the
official 2022-2052 schedule.

Known limitations:

- It uses the generated selected holiday marama, so it inherits any year-start,
  Ruhanui, or mata-boundary drift.
- The implementation currently treats the holiday target as the named Tangaroa
  period in the Living by the Stars sequence: `Tangaroa-ā-mua`,
  `Tangaroa-ā-roto`, `Tangaroa-whakapau`, and
  `Tangaroa whāriki kio-kio`.
- The marker should keep being reviewed against the Living by the Stars
  calendar material and local observations.
- Official dates can remain a diagnostic comparison, but should not define the
  rule by themselves.

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
- Tangaroa-period interpretation for the public holiday marker.
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

- Living by the Stars 2021-2024 calendar rows and local observations for
  named-year placement.
- Official Matariki public holiday dates as diagnostic context only.
- Golden moonrise / moonset / Full Moon cases already represented in tests.
- Known local observations for selected locations.
- Years governed by the Living by the Stars calendar Pipiri/Ruhanui rule.

### Public Production

Status: not ready.

Production readiness requires:

- A reviewed intercalation rule or an explicit decision to use a curated
  year/month table.
- A reviewed Tangaroa-period rule for the Matariki public holiday marker.
- Source-reviewed copy for year rhythm, star markers, and uncertainty.
- Monitoring around API readiness and astronomy provider failures.
- A deployment target with persistent cache storage configured.

## Suggested Next Work

1. Review the Pipiri/Ruhanui rule against the Living by the Stars 2021-2024
   calendar material and local observation examples.
2. Add more known calendar/source rows when we find them, especially years with
   and without Ruhanui.
3. Use the diagnostics to test proposed Pipiri/Ruhanui changes against
   Matariki visibility, lunar anchors, and dawn sky positions before changing
   code.
4. Decide whether the Living by the Stars calendar Pipiri/Ruhanui rule is
   sufficient or whether a curated named-year table is still needed.
5. Add UI wording that distinguishes astronomical events, observed maramataka
   model outputs, and legally scheduled holidays.

## Current Decision

Keep the app moving as an astronomy-backed Matariki calendar and review tool.
Do not market the year rhythm or Matariki holiday marker as settled until the
named-year rule has source review and the Tangaroa-period rule is resolved.
