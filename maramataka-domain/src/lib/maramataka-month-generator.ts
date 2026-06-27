import { MoonRise } from '@maramataka-calendar/astronomy';
import { MaramatakaMonth, MaramatakaNightOverlap } from './maramataka';
import { Mata, MaramatakaVersion } from './mata';

interface GenerateMaramatakaOverlapInput {
  intervalDate: string;
  overlap: MaramatakaNightOverlap;
}

interface GenerateMaramatakaMonthInput {
  version: MaramatakaVersion;
  whiroStartsAt: Date;
  mata: Mata[];
  moonRises: MoonRise[];
  overlaps?: GenerateMaramatakaOverlapInput[];
}

export function generateMaramatakaMonth(
  input: GenerateMaramatakaMonthInput,
): MaramatakaMonth {
  if (input.moonRises.length < input.mata.length + 1) {
    throw new Error('Not enough moonrises to generate Maramataka month');
  }

  if (input.mata.some((mata) => mata.version !== input.version)) {
    throw new Error('All mata entries must match month version');
  }

  for (let i = 1; i < input.moonRises.length; i += 1) {
    if (
      input.moonRises[i].risesAt.getTime() <=
      input.moonRises[i - 1].risesAt.getTime()
    ) {
      throw new Error('Moonrises must be strictly increasing');
    }
  }

  if (input.moonRises[0].risesAt.getTime() !== input.whiroStartsAt.getTime()) {
    throw new Error('Whiro start must match first moonrise');
  }
  return {
    version: input.version,
    whiroStartsAt: input.whiroStartsAt,
    nights: input.mata.map((mata, index) => {
      const moonRise = input.moonRises[index];
      const nextMoonRise = input.moonRises[index + 1];
      const overlappingMata = input.overlaps
        ?.filter((overlap) => overlap.intervalDate === moonRise.date)
        .map((overlap) => overlap.overlap);

      return {
        mata,
        ...(overlappingMata?.length ? { overlappingMata } : {}),
        startsAt: moonRise.risesAt,
        endsAt: nextMoonRise.risesAt,
      };
    }),
  };
}
