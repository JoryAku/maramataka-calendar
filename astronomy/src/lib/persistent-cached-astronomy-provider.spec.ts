import { AstronomyProvider, Location } from './astronomy-provider';
import { AstronomyCacheStore } from './persistent-astronomy-cache';
import { PersistentCachedAstronomyProvider } from './persistent-cached-astronomy-provider';

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

  it('returns cached moon phases without calling the wrapped provider', async () => {
    const provider = createProvider({
      getMoonPhases: jest.fn().mockRejectedValue(new Error('should not call')),
    });
    const store = createStore({
      'moon-phases:2026': [
        {
          phase: 'New Moon',
          occursAt: '2026-01-09T04:05:00.000Z',
          source: 'usno',
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
        source: 'usno',
      }),
    });
    const store = createStore();

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const moonrise = await cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
    expect(moonrise.risesAt).toBeInstanceOf(Date);
    expect(store.setMock).toHaveBeenCalledWith(
      'moonrise:2026-01-01:-41.2865:174.7762:Pacific/Auckland',
      expect.objectContaining({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T05:31:00.000Z'),
      }),
    );
  });

  it('falls back to the wrapped provider when cache reads fail', async () => {
    const provider = createProvider({
      getFullMoons: jest.fn().mockResolvedValue([
        {
          occursAt: new Date('2026-01-03T10:03:00.000Z'),
          source: 'usno',
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
      getNewMoons: jest.fn().mockRejectedValue(new Error('USNO unavailable')),
    });
    const store = createStore({
      'new-moons:2026': [
        {
          occursAt: '2026-01-18T19:52:00.000Z',
          source: 'usno',
        },
      ],
    });

    const cached = new PersistentCachedAstronomyProvider(provider, store);
    const newMoons = await cached.getNewMoons(2026);

    expect(provider.getNewMoons).not.toHaveBeenCalled();
    expect(newMoons).toEqual([
      {
        occursAt: new Date('2026-01-18T19:52:00.000Z'),
        source: 'usno',
      },
    ]);
  });

  it('surfaces provider errors when the provider is unavailable on a cache miss', async () => {
    const provider = createProvider({
      getNewMoons: jest.fn().mockRejectedValue(new Error('USNO unavailable')),
    });
    const store = createStore();

    const cached = new PersistentCachedAstronomyProvider(provider, store);

    await expect(cached.getNewMoons(2026)).rejects.toThrow('USNO unavailable');
  });

  it('does not fail provider reads when cache writes fail', async () => {
    const provider = createProvider({
      getNewMoons: jest.fn().mockResolvedValue([
        {
          occursAt: new Date('2026-01-09T04:05:00.000Z'),
          source: 'usno',
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
        source: 'usno',
      },
    ]);
  });

  it('revives nested moon details date fields from the cache', async () => {
    const provider = createProvider();
    const store = createStore({
      'moon-details:2026-01-01:-41.2865:174.7762:Pacific/Auckland': {
        date: '2026-01-01',
        phase: 'Waxing Gibbous',
        fractionIlluminated: 0.91,
        closestPhase: {
          phase: 'Full Moon',
          occursAt: '2026-01-03T10:03:00.000Z',
          source: 'usno',
        },
        moonrise: {
          date: '2026-01-01',
          risesAt: '2026-01-01T05:57:00.000Z',
          source: 'usno',
        },
        moonset: {
          date: '2026-01-01',
          setsAt: '2025-12-31T13:50:00.000Z',
          source: 'usno',
        },
        transit: {
          date: '2026-01-01',
          transitsAt: '2026-01-01T10:21:00.000Z',
          source: 'usno',
        },
        source: 'usno',
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
});
