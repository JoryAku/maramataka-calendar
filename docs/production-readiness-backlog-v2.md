# Matariki Calendar Production Readiness Backlog

This backlog tracks production-readiness and future-state work that should stay
visible without being treated as an implemented rule. The active calendar frame
is astronomy-backed and grounded in the Living by the Stars 2021-2024 calendar
material.

## Future Accuracy

### Add Layered Cache Fingerprints

The current cache has schema-version protection, but it does not yet know when
rule inputs have changed. Add cache fingerprints before introducing more
source-specific rule sets.

To do:

- define readable metadata payloads for each cache layer:
  - raw astronomy facts, for stable provider results such as phases, rises,
    sets, transits, equinoxes, and solstices
  - observational astronomy, for dawn windows, configured star markers, field
    of view, and visibility thresholds
  - maramataka rules, for rule set id/version, `mataVersion`, year-start logic,
    Pipiri / Hamal candidate selection, Matariki visibility checks, Ruhanui
    insertion/shift logic, and Matariki public holiday logic
- generate deterministic fingerprints from canonical metadata payloads
- include the relevant fingerprint in cache keys or cache namespaces
- treat fingerprint mismatches as cache misses instead of serving stale derived
  data
- preserve raw astronomy cache data when only maramataka rules change
- add stale namespace cleanup tooling after namespace invalidation is in place
- log the active readable cache metadata and short fingerprint during startup
  or diagnostics so cache invalidation can be reviewed

This should be implemented outside the current branch because it changes cache
contracts and deployment behaviour.

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
