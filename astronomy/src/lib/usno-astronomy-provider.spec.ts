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
      expect.stringContaining('/moon/phases/year?year=2026'),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
  });

  it('returns New Moon events as dates', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        phasedata: [
          {
            phase: 'New Moon',
            year: 2026,
            month: 1,
            day: 9,
            time: '04:05',
          },
        ],
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);
    const result = await provider.getNewMoons(2026);

    expect(result[0].source).toBe('usno');
    expect(result[0].occursAt).toBeInstanceOf(Date);
    expect(result[0].occursAt.getTime()).not.toBeNaN();
    expect(result[0].occursAt.toISOString()).toBe('2026-01-09T04:05:00.000Z');
  });

  it('returns Full Moon events as dates', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        phasedata: [
          {
            phase: 'Full Moon',
            year: 2026,
            month: 1,
            day: 3,
            time: '10:03',
          },
          {
            phase: 'New Moon',
            year: 2026,
            month: 1,
            day: 18,
            time: '19:52',
          },
        ],
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);
    const result = await provider.getFullMoons(2026);

    expect(result).toEqual([
      {
        occursAt: new Date('2026-01-03T10:03:00.000Z'),
        source: 'usno',
      },
    ]);
  });

  it('throws a provider error when USNO request fails', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    await expect(provider.getNewMoons(2026)).rejects.toMatchObject({
      provider: 'usno',
      code: 'request-failed',
      message: 'USNO moon phases request failed: 500',
    });
  });

  it('throws a provider timeout error when USNO request is aborted', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    const fetchFn = jest.fn().mockRejectedValue(abortError);

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch, {
      timeoutMs: 1,
    });

    await expect(provider.getNewMoons(2026)).rejects.toMatchObject({
      provider: 'usno',
      code: 'request-timeout',
      message: 'USNO moon phases request timed out after 1ms',
    });
  });

  it('throws a provider error when moon phase response shape changes', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ phases: [] }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    await expect(provider.getNewMoons(2026)).rejects.toMatchObject({
      provider: 'usno',
      code: 'invalid-response',
      message: 'USNO moon phases response did not match the expected shape',
    });
  });

  it('returns moonrise from USNO moon data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        properties: {
          data: {
            moondata: [{ phen: 'Rise', time: '18:31' }],
          },
        },
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const moonRise = await provider.getMoonRise('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/rstt/oneday'),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
    expect(moonRise).toEqual({
      date: '2026-01-01',
      risesAt: new Date('2026-01-01T05:31:00.000Z'),
      source: 'usno',
    });
  });

  it('returns moon transit from USNO moon data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        properties: {
          data: {
            moondata: [{ phen: 'Upper Transit', time: '23:21' }],
          },
        },
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const transit = await provider.getMoonTransit('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });

    expect(transit).toEqual({
      date: '2026-01-01',
      transitsAt: new Date('2026-01-01T10:21:00.000Z'),
      source: 'usno',
    });
  });

  it('returns daily moon details from USNO moon data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        properties: {
          data: {
            closestphase: {
              phase: 'Full Moon',
              year: 2026,
              month: 1,
              day: 3,
              time: '23:03',
            },
            curphase: 'Waxing Gibbous',
            fracillum: '91%',
            moondata: [
              { phen: 'Set', time: '02:50' },
              { phen: 'Rise', time: '18:57' },
              { phen: 'Upper Transit', time: '23:21' },
            ],
          },
        },
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const details = await provider.getMoonDetails('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });

    expect(details).toEqual({
      date: '2026-01-01',
      phase: 'Waxing Gibbous',
      fractionIlluminated: 0.91,
      closestPhase: {
        phase: 'Full Moon',
        occursAt: new Date('2026-01-03T10:03:00.000Z'),
        source: 'usno',
      },
      moonrise: {
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T05:57:00.000Z'),
        source: 'usno',
      },
      moonset: {
        date: '2026-01-01',
        setsAt: new Date('2025-12-31T13:50:00.000Z'),
        source: 'usno',
      },
      transit: {
        date: '2026-01-01',
        transitsAt: new Date('2026-01-01T10:21:00.000Z'),
        source: 'usno',
      },
      source: 'usno',
    });
  });

  it('returns moonrise and same-day moonset from USNO moon data', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        properties: {
          data: {
            moondata: [
              { phen: 'Rise', time: '06:31' },
              { phen: 'Set', time: '19:14' },
            ],
          },
        },
      }),
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const moonRiseSet = await provider.getMoonRiseSet('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/rstt/oneday'),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
    expect(moonRiseSet).toEqual({
      date: '2026-01-01',
      risesAt: new Date('2025-12-31T17:31:00.000Z'),
      setsAt: new Date('2026-01-01T06:14:00.000Z'),
      source: 'usno',
    });
  });

  it('uses the next day moonset when same-day moonset is before moonrise', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          properties: {
            data: {
              moondata: [
                { phen: 'Set', time: '09:14' },
                { phen: 'Rise', time: '18:31' },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          properties: {
            data: {
              moondata: [{ phen: 'Set', time: '09:45' }],
            },
          },
        }),
      });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    const moonRiseSet = await provider.getMoonRiseSet('2026-01-01', {
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });

    expect(fetchFn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('date=2026-01-02'),
      expect.objectContaining({ signal: expect.any(Object) }),
    );
    expect(moonRiseSet.risesAt.toISOString()).toBe('2026-01-01T05:31:00.000Z');
    expect(moonRiseSet.setsAt.toISOString()).toBe('2026-01-01T20:45:00.000Z');
  });

  it('throws when moonrise data is missing', async () => {
    const provider = new UsnoAstronomyProvider(
      jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          properties: {
            data: {
              moondata: [{ phen: 'Set', time: '09:14' }],
            },
          },
        }),
      }) as typeof fetch,
    );

    await expect(
      provider.getMoonRiseSet('2026-01-01', {
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      }),
    ).rejects.toMatchObject({
      provider: 'usno',
      code: 'data-unavailable',
      message: 'No moonrise data found for 2026-01-01',
    });
  });

  it('throws a provider error when rise/set response shape changes', async () => {
    const provider = new UsnoAstronomyProvider(
      jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          properties: {
            data: {
              moondata: [{ phen: 'Rise' }],
            },
          },
        }),
      }) as typeof fetch,
    );

    await expect(
      provider.getMoonRise('2026-01-01', {
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      }),
    ).rejects.toMatchObject({
      provider: 'usno',
      code: 'invalid-response',
      message: 'USNO moonrise response did not match the expected shape',
    });
  });
});
