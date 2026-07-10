# Matariki Calendar Production Readiness Backlog

This backlog tracks production-readiness and future-state work that should stay
visible without being treated as an implemented rule. The active calendar frame
is astronomy-backed and grounded in the Living by the Stars 2021-2024 calendar
material.

## Recent Infrastructure

### Cache Fingerprint Observability

Cache fingerprint observability and stale namespace cleanup are available
without adding a database or persistent maramataka year/month output cache.

Implemented:

- log the active raw astronomy, observational astronomy, and maramataka rule-set
  fingerprints with compact metadata summaries at API startup
- include short fingerprints in the startup log line so cache namespace changes
  are obvious during deploys
- provide `npm run diagnose:maramataka -- cache-fingerprints` to print readable
  metadata and fingerprints without requiring the API server to run
- provide `npm run diagnose:maramataka -- cache-namespaces` to inspect active
  and stale raw/observational astronomy namespaces
- provide `npm run diagnose:maramataka -- cache-namespaces --prune` to remove
  stale raw/observational namespaces while leaving active and unknown entries
  untouched

## Future Accuracy

### Extend Layered Cache Fingerprints

The cache work now has three layers defined:

- raw astronomy facts, for stable provider results such as phases, rises, sets,
  transits, and illumination
- observational astronomy, for dawn windows, configured star markers, field of
  view, sunrise horizon limits, and visibility thresholds
- maramataka rules, with readable metadata for rule set id/version,
  `mataVersion`, mata names, year-start logic, Pipiri / Hamal candidate
  selection, Matariki visibility checks, Ruhanui insertion/shift logic, named
  month markers, and Matariki public holiday logic

Fingerprint mismatches are treated as cache misses. Old entries can remain in
the file, but they will not be served through the new namespace and can be
removed with the cache namespace cleanup diagnostic. Raw and observational
astronomy fingerprints are persistent cache namespaces; the maramataka rule-set
fingerprint is currently used for in-memory cache keys and future persistence
metadata.

Remaining work:

- add a persistent derived maramataka-rules namespace if/when year or month
  results become persistent rather than in-memory only

### Refine Dawn Star Marker Sampling

Star marker sampling now uses solar-altitude dawn boundaries for the selected
date and location. Single-day marker positions use the midpoint between the
rising Sun crossing 18° and 12° below the horizon; first-appearance events scan
from the Sun crossing 18° below the horizon through sunrise, using the
configured north-to-south dawn field (`0°..180°`) unless a marker overrides it.

Before the star layer is treated as production-ready:

- decide whether different traditions should use the midpoint, the -18°
  boundary, sunrise, or another configurable point in the dawn window
- record the dawn definition with a more precise API field than the legacy
  `sampleTimeLocal` name
- validate the resulting marker dates against expert/source review
