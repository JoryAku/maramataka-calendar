import { Mata, MaramatakaVersion } from './mata';
import { MaramatakaMonth, MaramatakaNightOverlap } from './maramataka';
import { MoonRiseSet } from '@maramataka-calendar/astronomy';

interface GenerateMaramatakaOverlapInput {
  intervalDate: string;
  overlap: MaramatakaNightOverlap;
}

interface GenerateMaramatakaMonthInput {
  version: MaramatakaVersion;
  whiroStartsAt: Date;
  mata: Mata[];
  moonRiseSets: MoonRiseSet[];
  overlaps?: GenerateMaramatakaOverlapInput[];
}

export function generateMaramatakaMonth(
  input: GenerateMaramatakaMonthInput,
): MaramatakaMonth {
  if (input.moonRiseSets.length < input.mata.length) {
    throw new Error(
      'Not enough moonrise/moonset intervals to generate Maramataka month',
    );
  }

  if (input.mata.some((mata) => mata.version !== input.version)) {
    throw new Error('All mata entries must match month version');
  }

  for (let i = 0; i < input.moonRiseSets.length; i += 1) {
    const interval = input.moonRiseSets[i];
    if (interval.setsAt.getTime() <= interval.risesAt.getTime()) {
      throw new Error('Moonset must be after moonrise');
    }

    if (
      i > 0 &&
      interval.risesAt.getTime() <= input.moonRiseSets[i - 1].risesAt.getTime()
    ) {
      throw new Error('Moonrise intervals must be strictly increasing');
    }
  }

  if (
    input.moonRiseSets[0].risesAt.getTime() !== input.whiroStartsAt.getTime()
  ) {
    throw new Error('Whiro start must match first moonrise');
  }
  return {
    version: input.version,
    whiroStartsAt: input.whiroStartsAt,
    nights: input.mata.map((mata, index) => {
      const interval = input.moonRiseSets[index];
      const overlappingMata = input.overlaps
        ?.filter((overlap) => overlap.intervalDate === interval.date)
        .map((overlap) => overlap.overlap);

      return {
        mata,
        ...(overlappingMata?.length ? { overlappingMata } : {}),
        startsAt: interval.risesAt,
        endsAt: interval.setsAt,
      };
    }),
  };
}
