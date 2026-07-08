# API Contract Notes

## Query Validation

Maramataka endpoints validate query strings through explicit DTO classes:

- `DateLocationQueryDto` for date plus location/coordinates requests.
- `DateTimeLocationQueryDto` for local date-time plus location/coordinates requests.

Validation keeps the current public behaviour:

- `date` must be `YYYY-MM-DD`.
- `dateTime` must be `YYYY-MM-DDTHH:mm:ss`.
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
and the heavier `GET /maramataka/year` timeline also loads separately. The
focused endpoints remain available for diagnostics and smaller integrations.

## Error Shape

The API uses a global exception filter. Error responses use this shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "date must be in YYYY-MM-DD format",
  "path": "/maramataka/cycle?date=bad",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## OpenAPI

OpenAPI/Swagger generation is intentionally deferred while the API contract is
still changing with the Matariki calendar rule-set model. The project does not
currently include `@nestjs/swagger`. The next API documentation step should add
Swagger decorators and generated docs once DTOs are stable enough that generated
schema churn is low.
