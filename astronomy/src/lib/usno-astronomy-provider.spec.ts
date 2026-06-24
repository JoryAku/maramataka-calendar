import { UsnoAstronomyProvider } from './usno-astronomy-provider';

describe('UsnoAstronomyProvider', () => {
  it('can be created', () => {
    expect(new UsnoAstronomyProvider()).toBeTruthy();
  });

  it('accepts a custom fetch function', async () => {
    const fetchFn = jest.fn();

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    expect(provider).toBeTruthy();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('requests moon phases for a year from USNO', async () => {
    const json = jest.fn().mockResolvedValue({ phasedata: [] });

    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json,
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    await provider.getNewMoons(2026);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/moon/phases/year?year=2026')
    );
  });

  it('returns New Moon events as dates', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        phasedata: [{
          phase: 'New Moon',
          year: 2026,
          month: 1,
          day: 19,
          time: '19:52',
        }],
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);
    const result = await provider.getNewMoons(2026);

    expect(result[0].source).toBe('usno');
    expect(result[0].occursAt).toBeInstanceOf(Date);
  });

  it('throws when USNO request fails', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    await expect(provider.getNewMoons(2026)).rejects.toThrow(
      'USNO moon phases request failed'
    );
  });

  it('requests sunset for a date and location from USNO', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        properties: {
          data: {
            sundata: [{ phen: 'Set', time: '20:47' }],
          },
        },
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const sunset = await provider.getSunset('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/rstt/oneday')
    );    
    expect(sunset.occursAt).toEqual(
      new Date('2026-01-01T20:47:00+13:00')
    );
  });

  it('throws when sunset data is missing', async () => {
    const provider = new UsnoAstronomyProvider(
      jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          properties: {
            data: {
              sundata: [],
            },
          },
        }),
      }) as typeof fetch
    );

    await expect(
      provider.getSunset('2026-01-01', {
        latitude: -41.2865,
        longitude: 174.7762,
        timezoneOffset: 13,
      })
    ).rejects.toThrow('No sunset data found');
  });
});