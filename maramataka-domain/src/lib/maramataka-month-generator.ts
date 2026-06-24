import { Mata, MaramatakaVersion } from './mata';
import { MaramatakaMonth } from './maramataka';

interface GenerateMaramatakaMonthInput {
  version: MaramatakaVersion;
  whiroStartsAt: Date;
  mata: Mata[];
  sunsets: Date[];
}

export function generateMaramatakaMonth(
  input: GenerateMaramatakaMonthInput
): MaramatakaMonth {
  if (input.sunsets.length < input.mata.length + 1) {
    throw new Error('Not enough sunsets to generate Maramataka month');
  }

  if (input.mata.some((mata) => mata.version !== input.version)) {
    throw new Error('All mata entries must match month version');
  }

  for (let i = 1; i < input.sunsets.length; i += 1) {
    if (input.sunsets[i].getTime() <= input.sunsets[i - 1].getTime()) {
      throw new Error('Sunsets must be strictly increasing');
    }
  }

  if (input.sunsets[0].getTime() !== input.whiroStartsAt.getTime()) {
    throw new Error('Whiro start must match first sunset');
  }
  return {
    version: input.version,
    whiroStartsAt: input.whiroStartsAt,
    nights: input.mata.map((mata, index) => ({
      mata,
      startsAt: input.sunsets[index],
      endsAt: input.sunsets[index + 1],
    })),
  };
}