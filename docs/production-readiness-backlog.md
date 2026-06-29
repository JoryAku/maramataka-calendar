# Production Readiness Backlog

This backlog reflects the current MVP shape of the app: an accurate Maramataka
moon tracker with current mata, moon details, a cycle wheel, observational
balancing, location support, API hardening, persistent astronomy cache,
observability, and deployable frontend/API configuration.

## Go-Live Essentials

These are the items that should be completed before public production launch.

### G0.1 Choose The Production Hosting Shape

The code supports deployment, but the actual hosting platform and routing shape
still need to be chosen.

Acceptance:

- Frontend host is selected.
- API host is selected.
- Public production domain is selected.
- `/api/*` routing/proxy behaviour is confirmed.
- Production CORS origin is known.
- Production smoke-test URL is documented.

### G0.2 Replace Placeholder Staging Configuration

The frontend has local, staging, and production API configuration, but the
staging API URL is still a placeholder.

Acceptance:

- Real staging frontend URL is known.
- Real staging API URL is known.
- `environment.staging.ts` uses the real staging API base URL, or staging uses
  runtime config with documented host-level injection.
- Staging API CORS allows the staging frontend origin.

### G0.3 Provision Production Astronomy Cache Storage

The persistent astronomy cache is implemented, but production must decide where
the file lives.

Acceptance:

- `MARAMATAKA_ASTRONOMY_CACHE_PATH` points to writable production storage.
- Hosting platform confirms whether storage is persistent or ephemeral.
- Cache directory permissions are verified.
- A manual cache reset process is documented for production operators.

### G0.4 Run Full CI In A Clean Environment

Local desktop constraints have blocked some browser/API e2e checks at times.
The authoritative pre-launch signal should be GitHub Actions or an equivalent
clean CI environment.

Acceptance:

- `npm run ci` passes in GitHub Actions on `main`.
- Frontend e2e launches browsers successfully in CI.
- API e2e runs with stub astronomy mode in CI.
- No skipped or flaky checks are required for launch.

### G0.5 Production Smoke Test With Live Astronomy

CI uses stub astronomy mode, so production also needs a live-provider smoke
test before launch.

Acceptance:

- `/api/health/live` returns `200`.
- `/api/health/ready` returns `200` with live astronomy mode.
- `/api/locations` returns supported locations.
- `/api/maramataka/today` returns current mata for at least Wellington.
- `/api/maramataka/month` returns a cycle with Whiro, Full Moon, and next
  Whiro anchors.
- Frontend renders the Today view and cycle wheel against the deployed API.

### G0.6 Confirm Cultural And Source Wording

The rule set and fishing layer now expose source material to users. Before
public launch, wording should be reviewed for clarity and care.

Acceptance:

- Rule-set name is acceptable for public display.
- Source label and source link are acceptable.
- Fishing guidance phrases are displayed as source phrases, not over-translated
  or over-claimed.
- Any needed cultural disclaimer or context note is added.

### G0.7 Production Error Reporting Decision

The frontend currently reports uncaught errors to the browser console. That is
acceptable for MVP if intentional, but the launch decision should be explicit.

Acceptance:

- Decide whether console-only frontend error reporting is enough for launch.
- If not, choose an external error sink and wire it through the existing
  frontend error-handler boundary.
- Document who receives production error reports.

## Future Roadmap

These are valuable, but they should not block the first public launch unless the
product scope changes.

### F1.1 Named Maramataka Months From Dawn Star Risings

Add named maramataka months. A maramataka month begins at Whiro, and the named
month is determined by the associated star or asterism rising in the eastern
dawn sky around that Whiro.

Acceptance:

- Define a `MaramatakaMonthNameRuleSet` or equivalent domain model.
- Record the source/tradition for month names and associated stars/asterisms.
- Determine how many dawn observations around Whiro are considered.
- Add astronomy support for heliacal/dawn rising or a documented approximation.
- Return the named month from the API with source metadata.
- Display the month name in the Today and cycle views.
- Support future regional/traditional variants without hard-coding one universal
  month-name rule.

### F1.2 Year View With Maori Calendar Year Elements

Build a year timeline once month naming and seasonal anchors are modelled.

Acceptance:

- Timeline shows Whiro anchors across the year.
- Timeline shows named maramataka months.
- Seasonal or calendar-year markers are source-backed.
- Users can move from year to month/cycle to Today.

### F1.3 Three-Year View And Intercalation

Visualise multi-year patterns, including years where an extra month is required.

Acceptance:

- Three-year timeline shows every Whiro.
- Month names and repeated/extra month behaviour are visible.
- The third-year extra-month pattern is clearly explained and source-backed.
- The model supports differing traditions or intercalation rules.

### F1.4 Additional Content Layers

The content-layer model can now carry fishing guidance. Extend it cautiously.

Candidate layers:

- Gardening guidance.
- Cultural notes.
- Activity recommendations.
- Source notes and translations.
- Regional/traditional variants shown side by side.

Acceptance:

- Each layer has source, source URL where available, version, status, and
  recommendations or notes.
- Unavailable layers are explicit rather than empty.
- Users can distinguish source phrases from modern interpretation.

### F1.5 Tide, Weather, And Wind Indicators

These were intentionally kept out of MVP.

Acceptance:

- Providers are selected.
- Provider terms and usage limits are understood.
- Data is clearly separated from Maramataka guidance.
- Unavailable external data does not block the moon tracker.

### F1.6 Notifications, Widgets, And Offline Support

Useful once the core tracker is trusted.

Acceptance:

- Sunset/moonrise transition notifications are configurable.
- Widget data comes from the same API/domain model as the app.
- Offline mode defines how stale astronomy/cache data is labelled.

### F1.7 OpenAPI And Third-Party API

Swagger/OpenAPI was deferred while the API contract was still moving.

Acceptance:

- DTOs are decorated or schema-generated.
- Public API docs are generated in CI.
- Versioning strategy is documented.
- Third-party consumers can identify rule set, source, and content-layer
  versions.

### F1.8 Production Cache Migration Tooling

The current astronomy cache is versioned and recoverable, but migration tooling
is still manual.

Acceptance:

- Cache inspection command exists.
- Cache reset command exists.
- Cache schema migration policy is documented.
- Future database/object-storage cache can replace file storage behind the same
  domain/provider contract.
