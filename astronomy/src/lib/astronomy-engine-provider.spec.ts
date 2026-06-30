import { AstronomyProviderError } from './astronomy-provider-error';
import { AstronomyEngineProvider } from './astronomy-engine-provider';

type FakeAstroTime = { date: Date };
type FakeMoonQuarter = { quarter: number; time: FakeAstroTime };

class FakeObserver {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
    readonly height: number,
  ) {}
}

function createEngine(overrides: Record<string, unknown> = {}) {
  const quarters: FakeMoonQuarter[] = [
    { quarter: 0, time: { date: new Date('2025-12-20T01:00:00.000Z') } },
    { quarter: 0, time: { date: new Date('2026-01-09T04:05:00.000Z') } },
    { quarter: 1, time: { date: new Date('2026-01-16T03:26:00.000Z') } },
    { quarter: 2, time: { date: new Date('2026-01-24T02:11:00.000Z') } },
    { quarter: 3, time: { date: new Date('2026-02-01T10:01:00.000Z') } },
    { quarter: 0, time: { date: new Date('2027-01-01T01:00:00.000Z') } },
  ];

  const engine = {
    Body: {
      Moon: 'Moon',
      Venus: 'Venus',
    },
    Observer: FakeObserver,
    SearchMoonQuarter: jest.fn(() => quarters[0]),
    NextMoonQuarter: jest.fn((quarter: FakeMoonQuarter) => {
      const index = quarters.indexOf(quarter);
      return quarters[index + 1] ?? quarters[quarters.length - 1];
    }),
    SearchMoonPhase: jest.fn(),
    SearchRiseSet: jest.fn(
      (
        _body: string,
        _observer: FakeObserver,
        direction: number,
        dateStart: Date,
      ) => {
        if (direction === 1) {
          return { date: new Date('2026-01-01T05:30:00.000Z') };
        }

        return {
          date:
            dateStart.getTime() >= Date.parse('2026-01-01T05:30:00.000Z')
              ? new Date('2026-01-01T18:10:00.000Z')
              : new Date('2026-01-01T04:10:00.000Z'),
        };
      },
    ),
    SearchHourAngle: jest.fn(() => ({
      time: { date: new Date('2026-01-01T11:42:00.000Z') },
    })),
    MoonPhase: jest.fn(() => 45),
    Illumination: jest.fn(() => ({
      phase_fraction: 0.17,
      geo_dist: 0.00243,
    })),
    Equator: jest.fn(() => ({
      ra: 4.2,
      dec: -14.4,
    })),
    Horizon: jest.fn(
      (
        _date: Date,
        _observer: FakeObserver,
        ra: number,
        dec: number,
        _refraction: string,
      ) => ({
        altitude: ra === 4.2 ? 12.345 : dec + 30,
        azimuth: ra === 4.2 ? 81.234 : ra * 15,
      }),
    ),
    ...overrides,
  };

  return engine as unknown as ConstructorParameters<
    typeof AstronomyEngineProvider
  >[0];
}

const wellington = {
  latitude: -41.2865,
  longitude: 174.7762,
  timezone: 'Pacific/Auckland',
};

describe('AstronomyEngineProvider', () => {
  it('returns lunar quarter phases for a year', async () => {
    const provider = new AstronomyEngineProvider(createEngine());

    const phases = await provider.getMoonPhases(2026);

    expect(phases).toEqual([
      {
        phase: 'New Moon',
        occursAt: new Date('2026-01-09T04:05:00.000Z'),
        source: 'astronomy-engine',
      },
      {
        phase: 'First Quarter',
        occursAt: new Date('2026-01-16T03:26:00.000Z'),
        source: 'astronomy-engine',
      },
      {
        phase: 'Full Moon',
        occursAt: new Date('2026-01-24T02:11:00.000Z'),
        source: 'astronomy-engine',
      },
      {
        phase: 'Last Quarter',
        occursAt: new Date('2026-02-01T10:01:00.000Z'),
        source: 'astronomy-engine',
      },
    ]);
  });

  it('returns moonrise, moonset, and transit for a local date', async () => {
    const provider = new AstronomyEngineProvider(createEngine());

    await expect(
      provider.getMoonRise('2026-01-01', wellington),
    ).resolves.toEqual({
      date: '2026-01-01',
      risesAt: new Date('2026-01-01T05:30:00.000Z'),
      source: 'astronomy-engine',
    });
    await expect(
      provider.getMoonRiseSet('2026-01-01', wellington),
    ).resolves.toEqual({
      date: '2026-01-01',
      risesAt: new Date('2026-01-01T05:30:00.000Z'),
      setsAt: new Date('2026-01-01T18:10:00.000Z'),
      source: 'astronomy-engine',
    });
    await expect(
      provider.getMoonTransit('2026-01-01', wellington),
    ).resolves.toEqual({
      date: '2026-01-01',
      transitsAt: new Date('2026-01-01T11:42:00.000Z'),
      source: 'astronomy-engine',
    });
  });

  it('returns moon details from Astronomy Engine calculations', async () => {
    const provider = new AstronomyEngineProvider(createEngine());

    await expect(
      provider.getMoonDetails('2026-01-01', wellington),
    ).resolves.toMatchObject({
      date: '2026-01-01',
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.17,
      lunarAgeSource: 'astronomy-engine moon phases',
      source: 'astronomy-engine',
      moonrise: {
        risesAt: new Date('2026-01-01T05:30:00.000Z'),
        source: 'astronomy-engine',
      },
      moonset: {
        setsAt: new Date('2026-01-01T18:10:00.000Z'),
        source: 'astronomy-engine',
      },
      transit: {
        transitsAt: new Date('2026-01-01T11:42:00.000Z'),
        source: 'astronomy-engine',
      },
    });
  });

  it('returns dawn sky markers from fixed stars and planets', async () => {
    const provider = new AstronomyEngineProvider(createEngine());

    const markers = await provider.getStarMarkers('2026-06-25', wellington);

    expect(markers.find((marker) => marker.id === 'puanga')).toMatchObject({
      id: 'puanga',
      name: 'Puanga',
      englishName: 'Rigel',
      type: 'star',
      altitudeDegrees: 21.8,
      direction: 'E',
      visibility: 'prominent',
      source: 'Elsdon Best, The Maori Division of Time',
    });
    expect(markers.find((marker) => marker.id === 'kopu')).toMatchObject({
      name: 'Kōpū',
      type: 'planet',
      altitudeDegrees: 12.3,
      direction: 'E',
      visibility: 'visible',
    });
    expect(markers.every((marker) => marker.observedAt instanceof Date)).toBe(
      true,
    );
  });

  it('throws a typed provider error when moonrise is unavailable', async () => {
    const provider = new AstronomyEngineProvider(
      createEngine({
        SearchRiseSet: jest.fn(() => null),
      }),
    );

    await expect(
      provider.getMoonRise('2026-01-01', wellington),
    ).rejects.toMatchObject({
      provider: 'astronomy-engine',
      code: 'data-unavailable',
      message: 'No moonrise data found for 2026-01-01',
    } satisfies Partial<AstronomyProviderError>);
  });
});
