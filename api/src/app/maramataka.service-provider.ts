import { Provider } from '@nestjs/common';
import {
  AstronomyEngineProvider,
  AstronomyProvider,
  CachedAstronomyProvider,
  FileAstronomyCacheStore,
  FullMoon,
  Location,
  MoonDetails,
  MoonPhase,
  MoonRise,
  MoonRiseSet,
  MoonTransit,
  NewMoon,
  PersistentCachedAstronomyProvider,
  parseLocalDateTimeInTimezone,
  StarMarker,
  StarMarkerDefinition,
} from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';
import { join } from 'node:path';

export class StubAstronomyProvider implements AstronomyProvider {
  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    return Array.from({ length: 12 }, (_, monthIndex) => [
      {
        phase: 'New Moon' as const,
        occursAt: new Date(Date.UTC(year, monthIndex, 1, 6, 0, 0)),
        source: 'stub',
      },
      {
        phase: 'Full Moon' as const,
        occursAt: new Date(Date.UTC(year, monthIndex, 15, 18, 0, 0)),
        source: 'stub',
      },
    ]).flat();
  }

  async getNewMoons(year: number): Promise<NewMoon[]> {
    return (await this.getMoonPhases(year))
      .filter((phase) => phase.phase === 'New Moon')
      .map((phase) => ({
        occursAt: phase.occursAt,
        source: phase.source,
      }));
  }

  async getFullMoons(year: number): Promise<FullMoon[]> {
    return (await this.getMoonPhases(year))
      .filter((phase) => phase.phase === 'Full Moon')
      .map((phase) => ({
        occursAt: phase.occursAt,
        source: phase.source,
      }));
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
      risesAt: this.localDateTimeToUtc(year, month, day, 18, location),
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
    const setsAt = this.localDateTimeToUtc(year, month, day + 1, 6, location);

    return {
      date,
      risesAt: moonrise.risesAt,
      setsAt,
      source: 'stub',
    };
  }

  async getMoonTransit(date: string, location: Location): Promise<MoonTransit> {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid moon transit date format: ${date}`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return {
      date,
      transitsAt: this.localDateTimeToUtc(year, month, day, 0, location),
      source: 'stub',
    };
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    const moonRiseSet = await this.getMoonRiseSet(date, location);
    const transit = await this.getMoonTransit(date, location);

    return {
      date,
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.25,
      lunarAgeDays: 2.5,
      lunarAgeSource: 'stub',
      closestPhase: {
        phase: 'Full Moon',
        occursAt: new Date(`${date}T12:00:00.000Z`),
        source: 'stub',
      },
      moonrise: {
        date,
        risesAt: moonRiseSet.risesAt,
        source: 'stub',
      },
      moonset: {
        date,
        setsAt: moonRiseSet.setsAt,
        source: 'stub',
      },
      transit,
      source: 'stub',
    };
  }

  async getStarMarkers(
    date: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    const observedAt = this.stubDawnObservationTime(date, location);

    const markerDefinitions: StarMarkerDefinition[] =
      markers?.length
        ? markers
        : [
            {
              id: 'matariki',
              name: 'Matariki',
              type: 'asterism' as const,
              englishName: 'Pleiades',
              description:
                'Pleiades; year-start marker in the dawn sky.',
              seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
              source: 'stub',
              confidence: 'confirmed' as const,
              representative: {
                kind: 'fixed-equatorial' as const,
                rightAscensionHours: 3.7914,
                declinationDegrees: 24.1051,
              },
            },
          ];

    return markerDefinitions.map((marker, index) => ({
      id: marker.id,
      name: marker.name,
      type: marker.type,
      englishName: marker.englishName,
      description: marker.description,
      seasonalAssociation: marker.seasonalAssociation,
      source: marker.source,
      sourceUrl: marker.sourceUrl,
      confidence: marker.confidence,
      observedAt,
      altitudeDegrees: Math.max(6, 24 - index * 2),
      azimuthDegrees: 74 + index,
      direction: 'E',
      visibility: index === 0 ? 'prominent' : 'visible',
      calculation:
        'Stub dawn sky marker sampled inside the 18° to 12° pre-sunrise dawn band.',
    }));
  }

  async getStarFirstAppearances(
    startDate: string,
    endDate: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    const markerDefinitions = markers ?? [];
    if (!markerDefinitions.length) {
      return [];
    }

    const appearances = await Promise.all(
      markerDefinitions.map(async (marker, index) => {
        const candidateDate = this.addIsoDateDays(
          startDate,
          Math.min(index * 30, 364),
        );
        if (candidateDate >= endDate) {
          return undefined;
        }

        const [starMarker] = await this.getStarMarkers(
          candidateDate,
          location,
          [marker],
        );

        return starMarker;
      }),
    );

    return appearances.filter((marker): marker is StarMarker => Boolean(marker));
  }

  private stubDawnObservationTime(date: string, location: Location): Date {
    return this.localDateTimeToUtc(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)),
      Number(date.slice(8, 10)),
      5,
      location,
    );
  }

  private localDateTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    location: Location,
  ): Date {
    return parseLocalDateTimeInTimezone(
      {
        year,
        month,
        day,
        hour,
        minute: 0,
      },
      location.timezone,
    );
  }

  private addIsoDateDays(date: string, days: number): string {
    const result = new Date(`${date}T00:00:00.000Z`);
    result.setUTCDate(result.getUTCDate() + days);

    return result.toISOString().slice(0, 10);
  }
}

const createAstronomyProvider = (): AstronomyProvider => {
  const astronomyMode = process.env.MARAMATAKA_ASTRONOMY_MODE?.toLowerCase();
  if (astronomyMode === 'stub') {
    return new StubAstronomyProvider();
  }

  return new PersistentCachedAstronomyProvider(
    new AstronomyEngineProvider(),
    new FileAstronomyCacheStore(getAstronomyCachePath()),
  );
};

const getAstronomyCachePath = (): string =>
  process.env.MARAMATAKA_ASTRONOMY_CACHE_PATH ??
  join(process.cwd(), '.cache', 'astronomy.json');

export const maramatakaServiceProvider: Provider = {
  provide: MaramatakaService,
  useFactory: () =>
    new MaramatakaService({
      astronomyProvider: new CachedAstronomyProvider(createAstronomyProvider()),
    }),
};
