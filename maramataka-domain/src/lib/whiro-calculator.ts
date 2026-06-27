import { MoonRise } from '@maramataka-calendar/astronomy';

export interface WhiroInput {
  newMoonAt: Date;
  newMoonLocalDate: string;
  moonRises: MoonRise[];
}

export function calculateWhiroStart(input: WhiroInput): Date {
  const whiroOnNewMoonDate = input.moonRises.find(
    (moonRise) => moonRise.date === input.newMoonLocalDate,
  );

  if (whiroOnNewMoonDate) {
    return whiroOnNewMoonDate.risesAt;
  }

  const firstMoonriseAfterNewMoon = input.moonRises
    .filter(
      (moonRise) => moonRise.risesAt.getTime() > input.newMoonAt.getTime(),
    )
    .sort((a, b) => a.risesAt.getTime() - b.risesAt.getTime())[0];

  if (!firstMoonriseAfterNewMoon) {
    throw new Error(
      `Cannot anchor Whiro: no moonrise was found on the New Moon local date ${input.newMoonLocalDate} or after the New Moon instant`,
    );
  }

  return firstMoonriseAfterNewMoon.risesAt;
}
