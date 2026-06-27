import { MoonRiseSet } from '@maramataka-calendar/astronomy';

export interface WhiroInput {
  newMoonAt: Date;
  newMoonLocalDate: string;
  moonRiseSets: MoonRiseSet[];
}

export function calculateWhiroStart(input: WhiroInput): Date {
  const whiro = input.moonRiseSets.find(
    (moonRiseSet) => moonRiseSet.date === input.newMoonLocalDate,
  );

  if (!whiro) {
    throw new Error(
      `No moonrise/moonset interval found for Whiro date ${input.newMoonLocalDate}`,
    );
  }

  return whiro.risesAt;
}
