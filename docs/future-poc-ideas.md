# Future PoC Ideas

This is a parking place for feature ideas that are not part of the active
implementation plan yet. The current product is a Matariki calendar that uses
astronomy to calculate dates from the Living by the Stars 2021-2024 calendar
material.

## Calendar Rule Sets

- Let users switch between different maramataka calendar traditions or source
  rule sets.
- Keep Living by the Stars as one named rule set, rather than baking it into
  generic calendar code.
- Add rule-set metadata to API responses so generated dates can always explain
  which source and version produced them.
- Explore per-rule-set definitions for Pipiri, Ruhanui, dawn visibility, mata
  names, Matariki holiday framing, and event labels.

## Location-Aware Maramataka

- Support location-specific calendars where Gisborne, Wellington, Hawaii, and
  other places may resolve different dawn skies, moonrise boundaries, and mata.
- Expand custom-location support beyond the current preset locations.
- Consider saved locations if users compare places frequently.
- Make location/timezone assumptions visible in the UI and API diagnostics.

## Dawn Sky Product Feature

- Turn the diagnostic dawn view into a fuller product feature: "what celestial
  bodies are at dawn today?"
- Keep the horizon view grounded in real altitude and azimuth data.
- Let the dawn field of view be configurable by rule set, for example north to
  southeast or north to south.
- Show the Moon in the dawn sky when it is in the configured field.
- Add useful detail on each visible body, such as altitude, direction, rise
  status, and whether it is low, visible, or outside the chosen field.

## Event Timeline Layers

- Continue layering star, seasonal star, solar, lunar phase, holiday, Matariki
  appearance, and Matariki disappearance events.
- Add controls to toggle event layers on and off.
- Explore a better layout for dense years, especially years with Ruhanui.
- Consider adding richer event explanations in tooltips or side panels.

## Tides, Fishing, And Gardening

- Add a tide layer for coastal locations, especially where maramataka practice
  is tied to local harbour, beach, or fishing conditions.
- Explore whether tide data should come from a trusted external provider,
  manually curated stations, or user-selected tide stations.
- Add fishing guidance as an optional interpretive layer connected to mata,
  moon phase, tides, dawn/dusk, and local conditions.
- Add gardening guidance as an optional interpretive layer connected to mata,
  moon phase, season, location, and local climate assumptions.
- Keep fishing and gardening guidance clearly separate from calculated
  astronomy so cultural/source interpretation can be reviewed independently.
- Consider timeline toggles for tides, fishing, and gardening alongside the
  existing star, solar, lunar, and holiday layers.

## Calibration And Research Tools

- If a Matariki holiday comparison report is reintroduced, keep it as a
  review-facing calibration tool, not a source of truth.
- Keep source-calendar calibration focused on the Living by the Stars calendar
  rows we have evidence for.
- Add reports that compare Whiro, Pipiri, Ruhanui, Matariki appearance,
  Tangaroa periods, New Moons, Full Moons, and dawn visibility in one place.
- Preserve terminal diagnostics for deeper research while deciding which should
  become UI features.

## Cache And Runtime

- Use readable cache fingerprints so rule or astronomy changes create cache
  misses instead of serving stale results.
- Add stale namespace cleanup tooling for old cache entries.
- Revisit the app data-loading shape so day, month, and year views can reuse
  already-loaded cycle/month/year data when moving between adjacent days instead
  of recalculating or refetching every layer from scratch.
- Consider persistent derived maramataka year/month caches if generation cost
  becomes a production issue.
- Revisit SQLite, Postgres, or object storage only when the app needs shared
  cache state, user data, saved locations, or generated calendar persistence.
- Expose lightweight cache/rule-set status for operational review.

## Language And Content

- Make UI strings language-switchable, with te reo Maori as a first supported
  language option.
- Keep calculated names, source terms, and translated interface copy separated
  so rule-set data remains traceable while the product UI can be localised.

## API And Documentation

- Add Swagger/OpenAPI docs when the API shape settles.
- Make diagnostic endpoints and scripts easier to discover.
- Keep source-material notes separate from implemented rules so research
  hypotheses do not accidentally become product behavior.
- Maintain an "active rules" summary that explains the current year, month,
  Ruhanui, dawn, and Matariki calculations.

## Developer Experience

- Keep `npm run verify:fast` as the quick local confidence check.
- Keep `npm run verify` as the broader pre-push confidence check.
- Expand the rule-set registry only when a new reviewed calendar source is
  ready to be added.
- Add new diagnostics to `docs/diagnostics.md` as soon as they become useful.
- Keep the architecture doc current when calculation boundaries move.

## Sharing And Output

- Explore exportable year/month views for research review.
- Generate calendar events from maramataka dates and timeline layers.
- Consider calendar exports for generated events.
- Add shareable links that preserve date, location, and rule-set selection.
