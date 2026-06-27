# maramataka-domain

Domain logic for the Maramataka Calendar application.

The MVP mata rule is documented in
[docs/maramataka-rules.md](../docs/maramataka-rules.md). In short, the MVP
anchors Whiro to the moonrise and moonset on the USNO New Moon date, then maps
the remaining 29 mata to the next 29 moonrise-to-moonset intervals.

## Building

Run `nx build maramataka-domain` to build the library.

## Running unit tests

Run `nx test maramataka-domain` to execute the unit tests via [Jest](https://jestjs.io).
