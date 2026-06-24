import { Location } from '@maramataka-calendar/astronomy';
import { MaramatakaService } from './maramataka-service';

describe('MaramatakaService', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezoneOffset: 13,
  };

  it('orchestrates astronomy, Whiro calculation, and month generation', async () => {
    const mata = [
      { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
      { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
    ];

    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([{ occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' }])
      .mockResolvedValueOnce([{ occursAt: new Date('2026-01-29T06:00:00Z'), source: 'usno' }]);

    const getSunset = jest
      .fn()
      .mockImplementation((date: string) => Promise.resolve({
        date,
        occursAt: new Date(`${date}T07:00:00Z`),
        source: 'usno',
      }));

    const calculateWhiroStartFn = jest
      .fn()
      .mockReturnValue(new Date('2025-12-31T07:00:00Z'));

    const generatedMonth = {
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: new Date('2025-12-31T07:00:00Z'),
      nights: [],
    };
    const generateMaramatakaMonthFn = jest.fn().mockReturnValue(generatedMonth);

    const service = new MaramatakaService({
      astronomyProvider: { getNewMoons, getSunset },
      calculateWhiroStartFn,
      generateMaramatakaMonthFn,
      mata,
    });

    const result = await service.getMonth(location, new Date('2026-01-15T12:00:00Z'));

    expect(getNewMoons).toHaveBeenCalledWith(2025);
    expect(getNewMoons).toHaveBeenCalledWith(2026);
    expect(getSunset).toHaveBeenCalledTimes(4);
    expect(getSunset.mock.calls).toEqual([
      ['2025-12-30', location],
      ['2025-12-31', location],
      ['2026-01-01', location],
      ['2026-01-02', location],
    ]);
    expect(calculateWhiroStartFn).toHaveBeenCalled();
    expect(generateMaramatakaMonthFn).toHaveBeenCalled();
    expect(result).toBe(generatedMonth);
  });

  it('requests sunsets using the location calendar day across UTC boundaries', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([{ occursAt: new Date('2025-12-31T23:30:00Z'), source: 'usno' }])
      .mockResolvedValueOnce([]);

    const getSunset = jest.fn().mockResolvedValue({
      date: '2026-01-01',
      occursAt: new Date('2026-01-01T07:00:00Z'),
      source: 'usno',
    });

    const service = new MaramatakaService({
      astronomyProvider: { getNewMoons, getSunset },
      calculateWhiroStartFn: jest.fn().mockReturnValue(new Date('2026-01-01T07:00:00Z')),
      generateMaramatakaMonthFn: jest.fn().mockReturnValue({
        version: 'mita-te-tai-best' as const,
        whiroStartsAt: new Date('2026-01-01T07:00:00Z'),
        nights: [],
      }),
    });

    await service.getMonth(
      {
        latitude: -41.2865,
        longitude: 174.7762,
        timezoneOffset: 13,
      },
      new Date('2026-01-01T12:00:00Z')
    );

    expect(getSunset).toHaveBeenCalledWith(
      '2026-01-01',
      expect.objectContaining({ timezoneOffset: 13 })
    );
  });

  it('throws when no New Moon exists for requested period', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn().mockResolvedValue([]),
        getSunset: jest.fn(),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z'))
    ).rejects.toThrow('No New Moon found for requested period');
  });

  it('throws meaningful error when sunset retrieval fails', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([{ occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' }])
          .mockResolvedValueOnce([]),
        getSunset: jest.fn().mockRejectedValue(new Error('sunset unavailable')),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z'))
    ).rejects.toThrow('Failed to retrieve sunset data: sunset unavailable');
  });

  it('throws meaningful error when Whiro calculation fails', async () => {
    const getSunset = jest
      .fn()
      .mockImplementation((date: string) => Promise.resolve({
        date,
        occursAt: new Date(`${date}T07:00:00Z`),
        source: 'usno',
      }));

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([{ occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' }])
          .mockResolvedValueOnce([]),
        getSunset,
      },
      calculateWhiroStartFn: jest.fn().mockImplementation(() => {
        throw new Error('cannot calculate whiro');
      }),
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z'))
    ).rejects.toThrow('Failed to calculate Whiro start: cannot calculate whiro');
  });

  it('throws meaningful error when month generation fails', async () => {
    const getSunset = jest
      .fn()
      .mockImplementation((date: string) => Promise.resolve({
        date,
        occursAt: new Date(`${date}T07:00:00Z`),
        source: 'usno',
      }));

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([{ occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' }])
          .mockResolvedValueOnce([]),
        getSunset,
      },
      calculateWhiroStartFn: jest.fn().mockReturnValue(new Date('2025-12-31T07:00:00Z')),
      generateMaramatakaMonthFn: jest.fn().mockImplementation(() => {
        throw new Error('generator failed');
      }),
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z'))
    ).rejects.toThrow('Failed to generate Maramataka month: generator failed');
  });
});