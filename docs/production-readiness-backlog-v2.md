# Production Readiness Backlog V2

This backlog tracks production-readiness and future-state work that should stay
visible without being treated as an implemented rule.

## Future Accuracy

### Refine Dawn Star Marker Sampling

Star marker sampling now uses solar-altitude dawn boundaries for the selected
date and location. Single-day marker positions use the midpoint between the
rising Sun crossing 18° and 12° below the horizon; first-appearance events scan
from the Sun crossing 18° below the horizon through sunrise.

Before the star layer is treated as production-ready:

- decide whether different traditions should use the midpoint, the -18°
  boundary, sunrise, or another configurable point in the dawn window
- record the dawn definition with a more precise API field than the legacy
  `sampleTimeLocal` name
- validate the resulting marker dates against expert/source review
