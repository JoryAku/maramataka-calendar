import { AstronomyProvider, Location } from './astronomy-provider';
import { createFingerprintNamespace } from './cache-fingerprint';
import { AstronomyCacheStore } from './persistent-astronomy-cache';
import {
  OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
  PersistentCachedAstronomyProvider,
  RAW_ASTRONOMY_CACHE_METADATA,
} from './persistent-cached-astronomy-provider';

describe('PersistentCachedAstronomyProvider', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
  };

  const createProvider = (
    overrides: Partial<jest.Mocked<AstronomyProvider>> = {},
  ): jest.Mocked<AstronomyProvider> => ({
    getMoonPhases: jest.fn(),
    getNewMoons: jest.fn(),
    getFullMoons: jest.fn(),
    getMoonRise: jest.fn(),
    getMoonRiseSet: jest.fn(),
    getMoonTransit: jest.fn(),
    getMoonDetails: jest.fn(),
    ...overrides,
  });

  class MemoryAstronomyCacheStore implements AstronomyCacheStore {
    readonly getMock = jest.fn();
    readonly setMock = jest.fn();
    readonly entries: Record<string, unknown>;

    constructor(initialEntries: Record<string, unknown> = {}) {
      this.entries = { ...initialEntries };
    }

    async get<T>(key: string): Promise<T | undefined> {
      this.getMock(key);
      return this.entries[key] as T | undefined;
    }

    async set<T>(key: string, value: T): Promise<void> {
      this.setMock(key, value);
      this.entries[key] = JSON.parse(JSON.stringify(value)) as unknown;
    }
  }

  const createStore = (
    initialEntries: Record<string, unknown> = {},
  ): MemoryAstronomyCacheStore => new MemoryAstronomyCacheStore(initialEntries);
  const rawKey = (key: string): string =>
    `${createFingerprintNamespace('raw', RAW_ASTRONOMY_CACHE_METADATA)}:${key}`;
  const observationalKey = (key: string): string =>
    `${createFingerprintNamespace(
      'observational',
      OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
    )}:${key}`;

  it('returns cached moon phases without calling the wrapped provider', async () => {
    const provider = createProvider({
      getMoonPhases: jest.fn().mockRejectedValue(new Error('should not call')),
    });
    const store = createStore({
      [rawKey('moon-phases:2026')]: [
        {
          phase: 'New Moon',
          occursAt: '2026-01-09T04:05:00.000Z',
          source: 'astronomy-engine',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const phases = await cached.getMoonPhases(2026);

    expect(provider.getMoonPhases).not.toHaveBeenCalled();
    expect(phases[0]?.occursAt).toBeInstanceOf(Date);
    expect(phases[0]?.occursAt.toISOString()).toBe('2026-01-09T04:05:00.000Z');
  });

  it('stores moonrise results after a cache miss', async () => {
    const provider = createProvider({
      getMoonRise: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T05:31:00.000Z'),
        source: 'astronomy-engine',
      }),
    });
    const store = createStore();

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const moonrise = await cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
    expect(moonrise.risesAt).toBeInstanceOf(Date);
    expect(store.setMock).toHaveBeenCalledWith(
      rawKey('moonrise:2026-01-01:-41.2865:174.7762:Pacific/Auckland'),
      expect.objectContaining({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T05:31:00.000Z'),
      }),
    );
  });

  it('revives solar season dates from the cache', async () => {
    const provider = createProvider({
      getSolarSeasons: jest
        .fn()
        .mockRejectedValue(new Error('should not call')),
    });
    const store = createStore({
      [rawKey('solar-seasons:2026')]: [
        {
          name: 'June solstice',
          occursAt: '2026-06-21T08:24:00.000Z',
          source: 'astronomy-engine',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const seasons = await cached.getSolarSeasons(2026);

    expect(provider.getSolarSeasons).not.toHaveBeenCalled();
    expect(seasons).toEqual([
      {
        name: 'June solstice',
        occursAt: new Date('2026-06-21T08:24:00.000Z'),
        source: 'astronomy-engine',
      },
    ]);
  });

  it('falls back to the wrapped provider when cache reads fail', async () => {
    const provider = createProvider({
      getFullMoons: jest.fn().mockResolvedValue([
        {
          occursAt: new Date('2026-01-03T10:03:00.000Z'),
          source: 'astronomy-engine',
        },
      ]),
    });
    const store = createStore();
    store.getMock.mockImplementation(() => {
      throw new Error('cache unreadable');
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const fullMoons = await cached.getFullMoons(2026);

    expect(provider.getFullMoons).toHaveBeenCalledTimes(1);
    expect(fullMoons[0]?.occursAt).toEqual(
      new Date('2026-01-03T10:03:00.000Z'),
    );
  });

  it('uses cached values when the wrapped provider is unavailable', async () => {
    const provider = createProvider({
      getNewMoons: jest
        .fn()
        .mockRejectedValue(new Error('Astronomy Engine unavailable')),
    });
    const store = createStore({
      [rawKey('new-moons:2026')]: [
        {
          occursAt: '2026-01-18T19:52:00.000Z',
          source: 'astronomy-engine',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const newMoons = await cached.getNewMoons(2026);

    expect(provider.getNewMoons).not.toHaveBeenCalled();
    expect(newMoons).toEqual([
      {
        occursAt: new Date('2026-01-18T19:52:00.000Z'),
        source: 'astronomy-engine',
      },
    ]);
  });

  it('surfaces provider errors when the provider is unavailable on a cache miss', async () => {
    const provider = createProvider({
      getNewMoons: jest
        .fn()
        .mockRejectedValue(new Error('Astronomy Engine unavailable')),
    });
    const store = createStore();

    const cached = new PersistentCachedAstronomyProvider(provider, store);

    await expect(cached.getNewMoons(2026)).rejects.toThrow(
      'Astronomy Engine unavailable',
    );
  });

  it('does not fail provider reads when cache writes fail', async () => {
    const provider = createProvider({
      getNewMoons: jest.fn().mockResolvedValue([
        {
          occursAt: new Date('2026-01-09T04:05:00.000Z'),
          source: 'astronomy-engine',
        },
      ]),
    });
    const store = createStore();
    store.setMock.mockImplementation(() => {
      throw new Error('cache unwritable');
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const newMoons = await cached.getNewMoons(2026);

    expect(newMoons).toEqual([
      {
        occursAt: new Date('2026-01-09T04:05:00.000Z'),
        source: 'astronomy-engine',
      },
    ]);
  });

  it('revives nested moon details date fields from the cache', async () => {
    const provider = createProvider();
    const store = createStore({
      [rawKey('moon-details:2026-01-01:-41.2865:174.7762:Pacific/Auckland')]: {
        date: '2026-01-01',
        phase: 'Waxing Gibbous',
        fractionIlluminated: 0.91,
        closestPhase: {
          phase: 'Full Moon',
          occursAt: '2026-01-03T10:03:00.000Z',
          source: 'astronomy-engine',
        },
        moonrise: {
          date: '2026-01-01',
          risesAt: '2026-01-01T05:57:00.000Z',
          source: 'astronomy-engine',
        },
        moonset: {
          date: '2026-01-01',
          setsAt: '2025-12-31T13:50:00.000Z',
          source: 'astronomy-engine',
        },
        transit: {
          date: '2026-01-01',
          transitsAt: '2026-01-01T10:21:00.000Z',
          source: 'astronomy-engine',
        },
        source: 'astronomy-engine',
      },
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const details = await cached.getMoonDetails('2026-01-01', location);

    expect(provider.getMoonDetails).not.toHaveBeenCalled();
    expect(details.closestPhase?.occursAt).toBeInstanceOf(Date);
    expect(details.moonrise?.risesAt).toBeInstanceOf(Date);
    expect(details.moonset?.setsAt).toBeInstanceOf(Date);
    expect(details.transit?.transitsAt).toBeInstanceOf(Date);
  });

  it('keys persisted star first appearances by marker dawn-rising config', async () => {
    const provider = createProvider({
      getStarFirstAppearances: jest.fn().mockResolvedValue([]),
    });
    const store = createStore();
    const baseMarker = {
      id: 'te-toru-here-o-pipiri',
      name: 'Te Toru Here o Pipiri',
      type: 'star' as const,
      description: 'Zeta Persei.',
      seasonalAssociation: 'Third named month marker',
      source: 'test',
      confidence: 'confirmed' as const,
      representative: {
        kind: 'fixed-equatorial' as const,
        rightAscensionHours: 3.9022,
        declinationDegrees: 31.8836,
      },
    };

    const cached = new PersistentCachedAstronomyProvider(provider, store);

    await cached.getStarFirstAppearances('2026-08-13', '2026-09-11', location, [
      {
        ...baseMarker,
        dawnRising: {
          startSunAltitudeDegrees: -18,
          endSunAltitudeDegrees: 0,
          minimumMarkerAltitudeDegrees: 0,
          minimumAzimuthDegrees: 45,
          maximumAzimuthDegrees: 135,
          sampleMinutes: 5,
        },
      },
    ]);
    await cached.getStarFirstAppearances('2026-08-13', '2026-09-11', location, [
      {
        ...baseMarker,
        dawnRising: {
          startSunAltitudeDegrees: -18,
          endSunAltitudeDegrees: 0,
          minimumMarkerAltitudeDegrees: 0,
          minimumAzimuthDegrees: 0,
          maximumAzimuthDegrees: 135,
          sampleMinutes: 5,
        },
      },
    ]);

    expect(provider.getStarFirstAppearances).toHaveBeenCalledTimes(2);
  });

  it('persists star first appearance windows by marker dawn-rising config', async () => {
    const provider = createProvider({
      getStarFirstAppearancesForWindows: jest.fn().mockResolvedValue([
        {
          id: 'month:1:pipiri',
          marker: {
            id: 'pipiri',
            name: 'Pipiri',
            type: 'star',
            description: 'Hamal.',
            seasonalAssociation: 'First named month marker',
            source: 'test',
            confidence: 'confirmed',
            observedAt: new Date('2026-05-26T17:54:00.000Z'),
            altitudeDegrees: 4,
            azimuthDegrees: 50,
            direction: 'NE',
            visibility: 'low',
            calculation: 'test',
          },
        },
      ]),
    });
    const store = createStore();
    const marker = {
      id: 'pipiri',
      name: 'Pipiri',
      type: 'star' as const,
      description: 'Hamal.',
      seasonalAssociation: 'First named month marker',
      source: 'test',
      confidence: 'confirmed' as const,
      representative: {
        kind: 'fixed-equatorial' as const,
        rightAscensionHours: 2.1195,
        declinationDegrees: 23.4624,
      },
      dawnRising: {
        startSunAltitudeDegrees: -18,
        endSunAltitudeDegrees: 0,
        minimumMarkerAltitudeDegrees: 0,
        minimumAzimuthDegrees: 0,
        maximumAzimuthDegrees: 180,
        sampleMinutes: 5,
      },
    };
    const cached = new PersistentCachedAstronomyProvider(provider, store);

    const first = await cached.getStarFirstAppearancesForWindows(
      [
        {
          id: 'month:1:pipiri',
          startDate: '2026-05-26',
          endDate: '2026-06-24',
          marker,
        },
      ],
      location,
    );
    const second = await cached.getStarFirstAppearancesForWindows(
      [
        {
          id: 'month:1:pipiri',
          startDate: '2026-05-26',
          endDate: '2026-06-24',
          marker,
        },
      ],
      location,
    );

    expect(provider.getStarFirstAppearancesForWindows).toHaveBeenCalledTimes(1);
    expect(first[0]?.marker?.observedAt).toBeInstanceOf(Date);
    expect(second[0]?.marker?.observedAt).toBeInstanceOf(Date);
  });

  it('ignores raw astronomy cache entries from a different fingerprint namespace', async () => {
    const provider = createProvider({
      getNewMoons: jest.fn().mockResolvedValue([
        {
          occursAt: new Date('2026-01-18T19:52:00.000Z'),
          source: 'astronomy-engine',
        },
      ]),
    });
    const store = createStore({
      'new-moons:2026': [
        {
          occursAt: '1999-01-01T00:00:00.000Z',
          source: 'stale-cache',
        },
      ],
      [`${createFingerprintNamespace('raw', {
        ...RAW_ASTRONOMY_CACHE_METADATA,
        version: 0,
      })}:new-moons:2026`]: [
        {
          occursAt: '2000-01-01T00:00:00.000Z',
          source: 'stale-fingerprint',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const newMoons = await cached.getNewMoons(2026);

    expect(provider.getNewMoons).toHaveBeenCalledTimes(1);
    expect(newMoons).toEqual([
      {
        occursAt: new Date('2026-01-18T19:52:00.000Z'),
        source: 'astronomy-engine',
      },
    ]);
    expect(store.setMock).toHaveBeenCalledWith(
      rawKey('new-moons:2026'),
      expect.any(Array),
    );
  });

  it('changes observational cache namespaces when dawn metadata changes', async () => {
    const provider = createProvider({
      getStarMarkers: jest.fn().mockResolvedValue([]),
    });
    const store = createStore({
      [observationalKey(
        'star-markers:2026-07-01:-41.2865:174.7762:Pacific/Auckland:default',
      )]: [
        {
          id: 'stale',
          name: 'Stale',
          type: 'star',
          description: 'Old cache entry',
          seasonalAssociation: 'test',
          source: 'test',
          confidence: 'working',
          observedAt: '2026-07-01T18:00:00.000Z',
          altitudeDegrees: 10,
          azimuthDegrees: 90,
          direction: 'E',
          visibility: 'visible',
          calculation: 'old',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store, {
      observationalAstronomyMetadata: {
        ...OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
        dawnMarkerSampling: {
          dailyMarkerSample: 'start-of-astronomical-dawn',
        },
      },
    });

    await cached.getStarMarkers('2026-07-01', location);

    expect(provider.getStarMarkers).toHaveBeenCalledTimes(1);
    expect(store.setMock.mock.calls[0]?.[0]).toContain(
      'star-markers:2026-07-01:-41.2865:174.7762:Pacific/Auckland:default',
    );
    expect(store.setMock.mock.calls[0]?.[0]).not.toBe(
      observationalKey(
        'star-markers:2026-07-01:-41.2865:174.7762:Pacific/Auckland:default',
      ),
    );
  });
});
