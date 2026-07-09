# API Contract Notes

## Query Validation

Maramataka endpoints validate query strings through explicit DTO classes:

- `DateLocationQueryDto` for date plus location/coordinates requests.

Validation keeps the current public behaviour:

- `date` must be `YYYY-MM-DD`.
- Requests must provide either `location` or all of `lat`, `lon`, and
  `timezone`.
- Latitude, longitude, and IANA timezone values are validated before reaching
  domain services.

## Response Mapping

Controller responses that need shaping are mapped through explicit response DTO
functions instead of inline object literals. This keeps nullable/unavailable
fields, such as `distanceKm`, stable even when provider data changes.

The app shell uses `GET /maramataka/page` for the fast part of the normal page
load. It composes the cycle and moon details into one payload so the
selected-day and month views can render quickly when the location or date
changes. Dawn sky markers load separately from `GET /maramataka/star-markers`,
and the heavier `GET /maramataka/year` timeline also loads separately.

Generated maramataka responses include an API-safe `ruleSet` summary. The
summary carries the source id/name/version, `mataVersion`, metadata schema
version, and stable rule-set fingerprint so clients can explain which rule
inputs produced a date without needing the full registered rule set.

## Error Shape

The API uses a global exception filter. Error responses use this shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "date must be in YYYY-MM-DD format",
  "path": "/maramataka/page?date=bad",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## OpenAPI

The API exposes generated OpenAPI JSON at `/api/openapi.json`. This is kept
JSON-only for now so the docs remain reviewable without relaxing the strict
security headers for an embedded Swagger UI page.

Controller annotations describe the stable endpoint purpose, query parameters,
cache behavior, common error responses, and the main response body shapes.
Those response schemas are maintained as reusable OpenAPI schema constants so
the generated docs can stay readable while the domain objects remain shared
TypeScript interfaces.
