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
- how balancing is expected to work
- which source, tradition, and rule-set version produced the result

The current default rule set is `mita-te-tai-best-observational-v1`. It keeps
the existing MVP behaviour while making the source and assumptions explicit:

- Whiro/Kohititanga is anchored to the New Moon date's moonrise.
- Mata boundaries are moonrise-to-next-moonrise.
- Ohua/Huanga is the full-moon calibration point.
- Late full moon balancing may duplicate Ohua and drop final mata names.
- Named marama can carry source-linked dawn markers. Te Tahi o Pipiri is
  anchored to Matariki; Puanga is not included in the active marker set because
  it duplicates the same year-start function in this implementation.

The exact source passage used for this balancing rule is:

> "In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara's notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."

The implementation now calibrates Ohua against the observed Full Moon:

- If the Full Moon falls in the 15th interval, the normal sequence is used.
- If the Full Moon falls in the 16th interval, the 15th and 16th intervals are
  both named Ohua and the final mata name is dropped.
- If the Full Moon falls in the 17th interval, the 15th, 16th, and 17th
  intervals are all named Ohua and the final two mata names are dropped.
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
  seasonal dawn markers, and astronomical New Moon / Full Moon events

Tide, weather, wind, and three-year intercalation views remain future state
until the core moon tracking is trusted.

## Dawn Star Marker Rule

The star layer uses Astronomy Engine sky positions for the selected location.
Daily marker visibility is sampled at the midpoint between the rising Sun
crossing 18° and 12° below the horizon. Year-view first-appearance events scan
from the Sun crossing 18° below the horizon through sunrise, so markers that
rise after astronomical dawn, such as Kōpū/Venus in some years, can still be
placed at their first dawn-window horizon appearance.

Year-view star events are split into two scopes:

- Month-scoped markers are searched within the relevant named marama.
- Seasonal markers are searched across the maramataka year after month-scoped
  markers have been placed.

## Astronomy Provider Resilience

The MVP treats Astronomy Engine as the authoritative astronomy provider for New
Moon, Full Moon, moonrise, moonset, transit, phase, and illumination data.

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

The current mata sequence uses the Mita Te Tai / Elsdon Best reference already
represented in the domain model. The working source is:

- Elsdon Best, _Fishing Methods and Devices of the Maori_, NZETC, archived by
  the National Library of New Zealand:
  https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html

The source is useful because it records a 30-night lunar sequence, Whiro as the
first night, the kohititanga/new-moon marker, the huanga/full-moon marker, and
the balancing behaviour where late Ohua can duplicate and final names can be
dropped. The MVP moonrise-to-moonrise boundary is an application rule layered
onto that reference.

## Open Implementation Decisions

These cases need explicit behaviour before the rule is implemented in code:

- If there is no moonrise on the local New Moon date, Whiro uses the first
  moonrise after the exact New Moon instant.
- Since mata are moonrise-to-next-moonrise, every timestamp between fetched
  moonrises belongs to one mata.
- The next astronomical New Moon date's moonrise closes the current marama and
  begins the next Whiro.

The historical source notes that lunar-month naming could be adjusted in
practice. The app should avoid hiding those adjustments inside implicit code.
