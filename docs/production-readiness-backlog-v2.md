# Production Readiness Backlog V2

This backlog tracks production-readiness and future-state work that should stay
visible without being treated as an implemented rule.

## Future Accuracy

### Define Dawn From Sunrise For Star Marker Sampling

The current star marker proof of concept samples marker positions at `06:00`
local time on the Whiro date. This is only a placeholder for dawn.

Before the star layer is treated as production-ready:

- calculate local sunrise for the selected location and Whiro date
- define the dawn sample time relative to sunrise, for example a configurable
  offset before sunrise
- record that dawn definition in the active `MaramatakaRuleSet`
- use the same dawn definition for month naming and displayed star-marker
  details
