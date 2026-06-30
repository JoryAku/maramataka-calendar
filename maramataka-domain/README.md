# maramataka-domain

Domain logic for the Maramataka Calendar application.

The MVP mata rule is documented in
[docs/maramataka-rules.md](../docs/maramataka-rules.md). In short, the MVP
anchors Whiro to the moonrise on the Astronomy Engine New Moon date, then maps
the remaining mata to moonrise-to-next-moonrise intervals.

## Building

Run `nx build maramataka-domain` to build the library.

## Running unit tests

Run `nx test maramataka-domain` to execute the unit tests via [Jest](https://jestjs.io).
