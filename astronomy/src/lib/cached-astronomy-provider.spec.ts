import { AstronomyProvider } from './astronomy-provider';
import { CachedAstronomyProvider } from './cached-astronomy-provider';

describe('CachedAstronomyProvider', () => {
  const location = {
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

  it('caches moon phase results by year', async () => {
    const provider = createProvider({
      getMoonPhases: jest.fn().mockResolvedValue([]),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getMoonPhases(2026);
    await cached.getMoonPhases(2026);

    expect(provider.getMoonPhases).toHaveBeenCalledTimes(1);
  });

  it('caches New Moon results by year', async () => {
    const provider = createProvider({
      getNewMoons: jest.fn().mockResolvedValue([]),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getNewMoons(2026);
    await cached.getNewMoons(2026);

    expect(provider.getNewMoons).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent New Moon requests by year', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = createProvider({
      getNewMoons: jest.fn().mockReturnValue(deferred),
    });

    const cached = new CachedAstronomyProvider(provider);

    void cached.getNewMoons(2026);
    void cached.getNewMoons(2026);

    expect(provider.getNewMoons).toHaveBeenCalledTimes(1);
  });

  it('caches Full Moon results by year', async () => {
    const provider = createProvider({
      getFullMoons: jest.fn().mockResolvedValue([]),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getFullMoons(2026);
    await cached.getFullMoons(2026);

    expect(provider.getFullMoons).toHaveBeenCalledTimes(1);
  });

  it('caches moonrise results by date and location', async () => {
    const provider = createProvider({
      getMoonRise: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:31:00+13:00'),
        source: 'usno',
      }),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getMoonRise('2026-01-01', location);
    await cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent moonrise requests by date and location', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = createProvider({
      getMoonRise: jest.fn().mockReturnValue(deferred),
    });

    const cached = new CachedAstronomyProvider(provider);

    void cached.getMoonRise('2026-01-01', location);
    void cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
  });

  it('caches moonrise/moonset results by date and location', async () => {
    const provider = createProvider({
      getMoonRiseSet: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:31:00+13:00'),
        setsAt: new Date('2026-01-02T09:14:00+13:00'),
        source: 'usno',
      }),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getMoonRiseSet('2026-01-01', location);
    await cached.getMoonRiseSet('2026-01-01', location);

    expect(provider.getMoonRiseSet).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent moonrise/moonset requests by date and location', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = createProvider({
      getMoonRiseSet: jest.fn().mockReturnValue(deferred),
    });

    const cached = new CachedAstronomyProvider(provider);

    void cached.getMoonRiseSet('2026-01-01', location);
    void cached.getMoonRiseSet('2026-01-01', location);

    expect(provider.getMoonRiseSet).toHaveBeenCalledTimes(1);
  });

  it('caches moon transit results by date and location', async () => {
    const provider = createProvider({
      getMoonTransit: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        transitsAt: new Date('2026-01-01T10:21:00.000Z'),
        source: 'usno',
      }),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getMoonTransit('2026-01-01', location);
    await cached.getMoonTransit('2026-01-01', location);

    expect(provider.getMoonTransit).toHaveBeenCalledTimes(1);
  });

  it('caches moon details by date and location', async () => {
    const provider = createProvider({
      getMoonDetails: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        phase: 'Waxing Gibbous',
        fractionIlluminated: 0.91,
        source: 'usno',
      }),
    });

    const cached = new CachedAstronomyProvider(provider);

    await cached.getMoonDetails('2026-01-01', location);
    await cached.getMoonDetails('2026-01-01', location);

    expect(provider.getMoonDetails).toHaveBeenCalledTimes(1);
  });
});
