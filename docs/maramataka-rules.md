# Maramataka Rules

This document records the domain rules currently used for the MVP moon tracker.
It is intentionally separate from implementation code so cultural, product, and
technical decisions can be reviewed together.

## MVP Mata Boundary Rule

For the MVP, a mata is defined by moonrise-to-next-moonrise.

1. Get the astronomical New Moon date from USNO New Moon data, interpreted in
   the selected location and timezone.
2. Find the moonrise on that local New Moon date. If that date has no moonrise,
   use the first moonrise after the exact New Moon instant.
3. Mark the interval from that moonrise to the next moonrise as Whiro.
4. Assign the remaining 29 mata to the next 29 moonrise-to-moonrise intervals,
   counting forward through the 30 mata sequence.
5. Resolve a current timestamp to the mata whose moonrise-to-moonrise interval
   contains that timestamp.
6. Treat every USNO New Moon date as a hard Whiro anchor. If the next New Moon
   date lands before the previous 30-mata cycle has finished, the matching
   moonrise-to-moonrise interval carries both meanings: its position in the
   previous cycle and Whiro for the next cycle.

This means Whiro is anchored to the New Moon date's moonrise. The New Moon date
comes from USNO New Moon data, but the mata boundary is the local
moonrise-to-next-moonrise interval for that date. One maramataka cycle contains
Whiro plus the next 29 moonrise-to-moonrise intervals. Cycles may overlap rather
than being forced into a clean cut between New Moons.

## Current MVP Scope

The first product goal is to become a very accurate moon tracker. The MVP should
prioritise:

- current mata
- moonrise and moonset
- moon transit or meridian where available
- New Moon, Full Moon, and next New Moon anchor points
- lunar age, illumination, phase direction, and distance where available
- the 30-mata cycle wheel

Tide, weather, wind, year view, and three-year intercalation views are future
state until the core moon tracking is trusted.

## Astronomy Provider Resilience

The MVP treats USNO as the authoritative astronomy provider for New Moon,
Full Moon, moonrise, moonset, transit, phase, and illumination data.

Provider calls must fail predictably:

- Every USNO request has a timeout.
- HTTP failures, request timeouts, invalid JSON, and response-shape changes are
  surfaced as typed astronomy provider errors.
- Missing moon events, for example a date with no moonrise, are explicit
  data-unavailable errors rather than implicit nulls.
- API responses map provider failures to a stable unavailable response instead
  of leaking provider internals.

The API also uses a persistent astronomy cache in non-stub mode. The first cache
slice is file-backed and dependency-free:

- Default path: `.cache/astronomy.json`.
- Deployment override: `MARAMATAKA_ASTRONOMY_CACHE_PATH`.
- Cached values are normalized astronomy results, not raw USNO responses.
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
first night, and fishing guidance linked to moon-age names. The MVP
moonrise-to-moonrise boundary is an application rule layered onto that
reference.

## Open Implementation Decisions

These cases need explicit behaviour before the rule is implemented in code:

- If there is no moonrise on the local New Moon date, Whiro uses the first
  moonrise after the exact New Moon instant.
- Since mata are moonrise-to-next-moonrise, every timestamp between fetched
  moonrises belongs to one mata.
- If the next astronomical New Moon arrives before Whiro plus 29 intervals are
  assigned, mark that interval with overlapping Whiro for the next cycle.
- If Whiro plus 29 intervals complete before the next astronomical New Moon,
  decide whether the app waits for the next Whiro anchor or continues cyclically.

The historical source notes that lunar-month naming could be adjusted in
practice. The app should avoid hiding those adjustments inside implicit code.
