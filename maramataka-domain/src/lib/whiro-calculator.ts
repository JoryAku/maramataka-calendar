import { MoonRise } from '@maramataka-calendar/astronomy';

const DEFAULT_OBSERVATION_WINDOW_HOURS = 36;

export interface WhiroInput {
  newMoonAt: Date;
  newMoonLocalDate: string;
  moonRises: MoonRise[];
  observationWindowHours?: number;
}

export function calculateWhiroStart(input: WhiroInput): Date {
  const anchor = findWhiroMoonrise({
    newMoonAt: input.newMoonAt,
    newMoonLocalDate: input.newMoonLocalDate,
    moonRises: input.moonRises,
  });

  if (!anchor) {
    throw new Error(
      `Cannot anchor Whiro: no moonrise was found in the New Moon observation window for ${input.newMoonLocalDate}`,
    );
  }

  return anchor.risesAt;
}

export interface WhiroMoonriseInput {
  newMoonAt: Date;
  newMoonLocalDate: string;
  moonRises: MoonRise[];
}

export function findWhiroMoonrise(
  input: WhiroMoonriseInput,
): MoonRise | undefined {
  const sortedMoonRises = [...input.moonRises].sort(
    (a, b) => a.risesAt.getTime() - b.risesAt.getTime(),
  );

  return (
    sortedMoonRises.find(
      (moonRise) => moonRise.date === input.newMoonLocalDate,
    ) ??
    sortedMoonRises.find(
      (moonRise) => moonRise.risesAt.getTime() > input.newMoonAt.getTime(),
    )
  );
}

export interface ObservationWindowInput {
  phaseAt: Date;
  moonRises: MoonRise[];
  observationWindowHours?: number;
}

export function findMoonriseForObservationWindow(
  input: ObservationWindowInput,
): MoonRise | undefined {
  const phaseTime = input.phaseAt.getTime();
  const sortedMoonRises = [...input.moonRises].sort(
    (a, b) => a.risesAt.getTime() - b.risesAt.getTime(),
  );

  const intervalAnchor = sortedMoonRises.find((moonRise, index) => {
    const nextMoonRise = sortedMoonRises[index + 1];

    return (
      Boolean(nextMoonRise) &&
      phaseTime >= moonRise.risesAt.getTime() &&
      phaseTime < nextMoonRise.risesAt.getTime()
    );
  });
  if (intervalAnchor) {
    return intervalAnchor;
  }

  const windowMs =
    (input.observationWindowHours ?? DEFAULT_OBSERVATION_WINDOW_HOURS) *
    60 *
    60 *
    1000;

  return sortedMoonRises
    .map((moonRise) => ({
      moonRise,
      distanceMs: Math.abs(moonRise.risesAt.getTime() - phaseTime),
    }))
    .filter(({ distanceMs }) => distanceMs <= windowMs)
    .sort((a, b) => a.distanceMs - b.distanceMs)[0]?.moonRise;
}
