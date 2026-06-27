import { CachedAstronomyProvider } from './cached-astronomy-provider';

describe('CachedAstronomyProvider', () => {
  it('caches New Moon results by year', async () => {
    const provider = {
      getNewMoons: jest.fn().mockResolvedValue([]),
      getSunset: jest.fn(),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);

    await cached.getNewMoons(2026);
    await cached.getNewMoons(2026);

    expect(provider.getNewMoons).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent New Moon requests by year', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = {
      getNewMoons: jest.fn().mockReturnValue(deferred),
      getSunset: jest.fn(),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);

    void cached.getNewMoons(2026);
    void cached.getNewMoons(2026);

    expect(provider.getNewMoons).toHaveBeenCalledTimes(1);
  });

  it('caches sunset results by date and location', async () => {
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        occursAt: new Date('2026-01-01T20:47:00+13:00'),
        source: 'usno',
      }),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);

    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    await cached.getSunset('2026-01-01', location);
    await cached.getSunset('2026-01-01', location);

    expect(provider.getSunset).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent sunset requests by date and location', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn().mockReturnValue(deferred),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);
    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    void cached.getSunset('2026-01-01', location);
    void cached.getSunset('2026-01-01', location);

    expect(provider.getSunset).toHaveBeenCalledTimes(1);
  });

  it('caches moonrise results by date and location', async () => {
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn(),
      getMoonRise: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:31:00+13:00'),
        source: 'usno',
      }),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);

    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    await cached.getMoonRise('2026-01-01', location);
    await cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent moonrise requests by date and location', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn(),
      getMoonRise: jest.fn().mockReturnValue(deferred),
      getMoonRiseSet: jest.fn(),
    };

    const cached = new CachedAstronomyProvider(provider);
    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    void cached.getMoonRise('2026-01-01', location);
    void cached.getMoonRise('2026-01-01', location);

    expect(provider.getMoonRise).toHaveBeenCalledTimes(1);
  });

  it('caches moonrise/moonset results by date and location', async () => {
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn(),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn().mockResolvedValue({
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:31:00+13:00'),
        setsAt: new Date('2026-01-02T09:14:00+13:00'),
        source: 'usno',
      }),
    };

    const cached = new CachedAstronomyProvider(provider);

    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    await cached.getMoonRiseSet('2026-01-01', location);
    await cached.getMoonRiseSet('2026-01-01', location);

    expect(provider.getMoonRiseSet).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent moonrise/moonset requests by date and location', async () => {
    const deferred = new Promise<never>(() => undefined);
    const provider = {
      getNewMoons: jest.fn(),
      getSunset: jest.fn(),
      getMoonRise: jest.fn(),
      getMoonRiseSet: jest.fn().mockReturnValue(deferred),
    };

    const cached = new CachedAstronomyProvider(provider);
    const location = {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    };

    void cached.getMoonRiseSet('2026-01-01', location);
    void cached.getMoonRiseSet('2026-01-01', location);

    expect(provider.getMoonRiseSet).toHaveBeenCalledTimes(1);
  });
});
