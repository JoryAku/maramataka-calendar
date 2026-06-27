import { Provider } from '@nestjs/common';
import {
  AstronomyProvider,
  CachedAstronomyProvider,
  Location,
  MoonRise,
  MoonRiseSet,
  NewMoon,
  Sunset,
  UsnoAstronomyProvider,
} from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';

class StubAstronomyProvider implements AstronomyProvider {
  async getNewMoons(year: number): Promise<NewMoon[]> {
    return Array.from({ length: 12 }, (_, monthIndex) => ({
      occursAt: new Date(Date.UTC(year, monthIndex, 1, 6, 0, 0)),
      source: 'stub',
    }));
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid sunset date format: ${date}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const occursAt = new Date(
      Date.UTC(year, month - 1, day, 18 - location.timezoneOffset, 0, 0),
    );

    return {
      date,
      occursAt,
      source: 'stub',
    };
  }

  async getMoonRise(date: string, location: Location): Promise<MoonRise> {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid moonrise date format: ${date}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return {
      date,
      risesAt: new Date(
        Date.UTC(year, month - 1, day, 18 - location.timezoneOffset, 0, 0),
      ),
      source: 'stub',
    };
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid moonrise/moonset date format: ${date}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const moonrise = await this.getMoonRise(date, location);
    const setsAt = new Date(
      Date.UTC(year, month - 1, day + 1, 6 - location.timezoneOffset, 0, 0),
    );

    return {
      date,
      risesAt: moonrise.risesAt,
      setsAt,
      source: 'stub',
    };
  }
}

const createAstronomyProvider = (): AstronomyProvider => {
  const astronomyMode = process.env.MARAMATAKA_ASTRONOMY_MODE?.toLowerCase();
  if (astronomyMode === 'stub') {
    return new StubAstronomyProvider();
  }

  return new UsnoAstronomyProvider();
};

export const maramatakaServiceProvider: Provider = {
  provide: MaramatakaService,
  useFactory: () =>
    new MaramatakaService({
      astronomyProvider: new CachedAstronomyProvider(createAstronomyProvider()),
    }),
};
