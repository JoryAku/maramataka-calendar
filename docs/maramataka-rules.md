# Maramataka Rules

This document records the domain rules currently used for the MVP moon tracker.
It is intentionally separate from implementation code so cultural, product, and
technical decisions can be reviewed together.

## MVP Mata Boundary Rule

For the MVP, a mata is defined by moonrise-to-next-moonrise.

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

## Rule Set Model

The app does not treat this rule as a universal maramataka algorithm. Domain
code depends on a `MaramatakaRuleSet`, which records:

- how the marama begins
- how mata boundaries are calculated
- which mata names are used
- which astronomical event calibrates the middle of the marama
- which year-start marker defines the first Whiro of the star year
- which named-month markers label marama after the year boundary is known
- how balancing is expected to work
- which source, tradition, and rule-set version produced the result

The current default rule set is `living-by-the-stars-observational-v1`. It
keeps the existing MVP moonrise behaviour while making the source and
assumptions explicit:

- Whiro/Kohititanga is anchored to the New Moon date's moonrise.
- Mata boundaries are moonrise-to-next-moonrise.
- Full Moon is retained as an observed astronomical anchor.
- Mata names follow the fixed 1-30 sequence; if the next Whiro arrives before
  all 30 intervals are used, trailing mata names are dropped.
- Pipiri / Hamal provides the candidate Whiro for Te Tahi o Pipiri; Matariki's
  return timing decides whether that candidate is accepted, followed by
  Ruhanui, or skipped.
- `yearStartRule` currently keeps Matariki as the Ruhanui and holiday
  calibration marker, while `starMonthNaming` carries the source-linked
  named-month markers from _Living by the Stars_.

The exact source passage used for this balancing rule is:

> "In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara's notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."

The implementation now treats this as source context rather than the active
balancing rule:

- Full Moon remains visible as a separate astronomical anchor.
- The mata name sequence is not rewritten to duplicate the full-moon anchor
  name.
- If the next Whiro moonrise arrives early, the marama closes and the unused
  trailing mata names are dropped.
- The next Whiro moonrise closes the current marama and begins the next.

## Current MVP Scope

The first product goal is to become a very accurate moon tracker. The MVP should
prioritise:

- current mata
- moonrise and moonset
- moon transit or meridian where available
- New Moon, Full Moon, and next New Moon anchor points
- lunar age, illumination, phase direction, and distance where available
- the 30-mata cycle wheel
- the year rhythm view, including marama boundaries, month-scoped dawn markers,
  seasonal dawn markers, Matariki disappearance, astronomical New Moon / Full
  Moon events, equinoxes, solstices, and the Matariki public holiday marker

Tide, weather, wind, and three-year intercalation views remain future state
until the core moon tracking is trusted.

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
the eastern azimuth window from `45°` to `135°`, and sample every five minutes.
These settings are intentionally explicit so individual stars can later use
stricter heliacal-rising thresholds without changing the rest of the timeline
logic.

Year-view star events are split into two scopes:

- Month-scoped markers are searched within the relevant named marama.
- Seasonal markers are searched across the maramataka year after month-scoped
  markers have been placed.
- Matariki disappearance is marked separately from first appearance. It is the
  first local date in the longest period where Matariki is never above the
  horizon during astronomical night (`Sun <= -18°`) within the displayed
  maramataka year.

## Solar Season Anchors

The year rhythm view includes the four astronomical solar season anchors:
March equinox, June solstice, September equinox, and December solstice. These
are informational timeline events from Astronomy Engine `Seasons(year)` data.
They do not currently drive Whiro, marama naming, Ruhanui, or Matariki public
holiday calculations.

## Star Year And Thirteenth Month Rule

The active _Living by the Stars_ model separates the named year-start marker
from the Matariki calibration marker:

- Pipiri / Hamal is the named-month marker for Te Tahi o Pipiri.
- The year begins at the first New Moon / Whiro after Pipiri first reappears in
  the eastern dawn sky, unless Matariki returns too late in that candidate
  marama.
- Matariki remains the absence check for deciding whether that year stays with
  the first marama or defers the celebration to the following regulating
  marama.

The current source-calendar calibration distinguishes an early Matariki return
from a late return. In implementation terms, the service compares the first
dawn appearance of the configured Matariki marker with the calculated Whiro
start for the Pipiri New Moon:

- If Matariki has already appeared by that Whiro, the candidate Whiro is
  labelled `Te Tahi o Pipiri`.
- If Matariki appears after that Whiro but within the calibrated early-return
  window (currently 11 local days), the candidate Whiro remains
  `Te Tahi o Pipiri`, the next Whiro is labelled `Ruhanui`, and Takurua follows
  after Ruhanui.
- If Matariki appears later than that early-return window, the candidate Whiro
  is skipped and the next Whiro becomes `Te Tahi o Pipiri` rather than
  `Ruhanui`.

This is not a requirement that Matariki appear during Pipiri. The rule only
uses Matariki's timing relative to the candidate Pipiri Whiro: already-returned
keeps Te Tahi o Pipiri, early-return inserts Ruhanui, and late-return shifts Te
Tahi o Pipiri to the next Whiro. The 11-day threshold is a working
source-calendar calibration from the 2021/2022, 2022/2023, and 2023/2024
_Living by the Stars_ examples: it preserves the explicit Ruhanui in 2023/2024
while treating 10 June 2021 as Te Tahi o Pipiri rather than Ruhanui.

This rule is intentionally astronomy-only. Official holiday dates are used as a
calibration report, not as an input to the calculation. Among the rules tested
so far, this Hamal/Pipiri plus Matariki early-return rule gives the closest
Tangaroa-period calibration while keeping the source indicators explicit.

The Matariki public holiday event is calculated from the Friday closest to the
four-night Tangaroa period in the selected holiday marama. That marama is Te
Tahi o Pipiri by default, or Ruhanui when Matariki returns within the
calibrated early-return window after the candidate Pipiri Whiro. Candidate
Fridays are local dates within the selected marama, but the comparison uses
exact instants: each Friday is treated as a local civil-day interval and
compared to the exact start/end instants of the generated Tangaroa period. For
this rule set, the current Tangaroa target is `Tangaroa-ā-mua`,
`Tangaroa-ā-roto`, `Tangaroa-whakapau`, and
`Tangaroa whāriki kio-kio`.

Against the official 2022-2052 public holiday schedule this astronomy-only
model currently matches 20 of 31 holiday dates. The selected holiday marama's
generated Tangaroa period overlaps the official Tangaroa period in 28 of 31
comparison years. The remaining differences are useful calibration clues for
refining mata boundaries and the source-specific Matariki/Ruhanui rule.

## Astronomy Provider Resilience

The MVP treats Astronomy Engine as the authoritative astronomy provider for New
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
- Cached date strings are revived as `Date` values before reaching domain code.

This file-backed cache is the current persistence boundary. It can later be
swapped for SQLite, Postgres, or object storage without changing the
Maramataka domain service.

## Source Reference

The active default config is now source-specific:

- `living-by-the-stars-observational-v1` supplies the current mata sequence,
  phase groups, named marama, and named-marama star associations. Its marama
  names are `Te Tahi o Pipiri`, `Te Rua o Takurua`,
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
trailing names only when the next Whiro closes the marama early. The MVP
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
