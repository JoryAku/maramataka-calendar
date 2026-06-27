import { Location, MoonRise } from '@maramataka-calendar/astronomy';
import { MaramatakaService } from './maramataka-service';

describe('MaramatakaService', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
  };

  const createMoonRise = (date: string): MoonRise => ({
    date,
    risesAt: new Date(`${date}T05:00:00Z`),
    source: 'usno',
  });

  it('orchestrates astronomy, Whiro calculation, and month generation', async () => {
    const mata = [
      { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
      { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
    ];

    const moonRises = [
      createMoonRise('2025-12-30'),
      createMoonRise('2025-12-31'),
      createMoonRise('2026-01-01'),
      createMoonRise('2026-01-02'),
      createMoonRise('2026-01-03'),
    ];
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([
        { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-29T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([]);

    const getMoonRise = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(moonRises.find((moonRise) => moonRise.date === date)),
      );

    const calculateWhiroStartFn = jest
      .fn()
      .mockReturnValue(moonRises[0].risesAt);

    const generatedMonth = {
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: moonRises[0].risesAt,
      nights: [],
    };
    const generateMaramatakaMonthFn = jest.fn().mockReturnValue(generatedMonth);

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      calculateWhiroStartFn,
      generateMaramatakaMonthFn,
      mata,
    });

    const result = await service.getMonth(
      location,
      new Date('2026-01-15T12:00:00Z'),
    );

    expect(getNewMoons).toHaveBeenCalledWith(2025);
    expect(getNewMoons).toHaveBeenCalledWith(2026);
    expect(getNewMoons).toHaveBeenCalledWith(2027);
    expect(getMoonRise).toHaveBeenCalledTimes(5);
    expect(getMoonRise.mock.calls).toEqual([
      ['2025-12-30', location],
      ['2025-12-31', location],
      ['2026-01-01', location],
      ['2026-01-02', location],
      ['2026-01-03', location],
    ]);
    expect(calculateWhiroStartFn).toHaveBeenCalledWith({
      newMoonAt: new Date('2025-12-30T06:00:00Z'),
      newMoonLocalDate: '2025-12-30',
      moonRises,
    });
    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith({
      version: 'mita-te-tai-best',
      whiroStartsAt: moonRises[0].risesAt,
      mata,
      moonRises: moonRises.slice(0, 3),
      overlaps: undefined,
    });
    expect(result).toBe(generatedMonth);
  });

  it('marks the next New Moon date moonrise as overlapping Whiro when cycles overlap', async () => {
    const mata = [
      { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
      { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
      { index: 3, name: 'Ohoata', version: 'mita-te-tai-best' as const },
    ];

    const moonRises = [
      createMoonRise('2026-01-01'),
      createMoonRise('2026-01-02'),
      createMoonRise('2026-01-03'),
      createMoonRise('2026-01-04'),
      createMoonRise('2026-01-05'),
      createMoonRise('2026-01-06'),
    ];
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'usno' },
        { occursAt: new Date('2026-01-03T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([]);

    const getMoonRise = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(moonRises.find((moonRise) => moonRise.date === date)),
      );

    const generateMaramatakaMonthFn = jest.fn().mockReturnValue({
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: moonRises[0].risesAt,
      nights: [],
    });

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      calculateWhiroStartFn: jest.fn().mockReturnValue(moonRises[0].risesAt),
      generateMaramatakaMonthFn,
      mata,
    });

    await service.getMonth(location, new Date('2026-01-02T12:00:00Z'));

    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith({
      version: 'mita-te-tai-best',
      whiroStartsAt: moonRises[0].risesAt,
      mata,
      moonRises: moonRises.slice(0, 4),
      overlaps: [
        {
          intervalDate: '2026-01-03',
          overlap: {
            mata: mata[0],
            cycleStartsAt: moonRises[2].risesAt,
            reason: 'new-moon-anchor',
          },
        },
      ],
    });
  });

  it('can fall back when there is no moonrise on the New Moon local date', async () => {
    const moonRises = [
      createMoonRise('2026-01-02'),
      createMoonRise('2026-01-03'),
      createMoonRise('2026-01-04'),
      createMoonRise('2026-01-05'),
    ];
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([]);

    const getMoonRise = jest.fn().mockImplementation((date: string) => {
      if (date === '2026-01-01') {
        return Promise.reject(
          new Error('No moonrise data found for 2026-01-01'),
        );
      }

      return Promise.resolve(
        moonRises.find((moonRise) => moonRise.date === date),
      );
    });

    const generateMaramatakaMonthFn = jest.fn().mockReturnValue({
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: moonRises[0].risesAt,
      nights: [],
    });

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      generateMaramatakaMonthFn,
      mata: [
        { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
        { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
      ],
    });

    await service.getMonth(location, new Date('2026-01-02T12:00:00Z'));

    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith(
      expect.objectContaining({
        whiroStartsAt: moonRises[0].risesAt,
        moonRises: moonRises.slice(0, 3),
      }),
    );
  });

  it('requests moonrises using the New Moon local calendar day across UTC boundaries', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([
        { occursAt: new Date('2025-12-31T23:30:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const getMoonRise = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(createMoonRise(date)),
      );

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      calculateWhiroStartFn: jest
        .fn()
        .mockReturnValue(new Date('2026-01-01T05:00:00Z')),
      generateMaramatakaMonthFn: jest.fn().mockReturnValue({
        version: 'mita-te-tai-best' as const,
        whiroStartsAt: new Date('2026-01-01T05:00:00Z'),
        nights: [],
      }),
    });

    await service.getMonth(
      {
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      },
      new Date('2026-01-01T12:00:00Z'),
    );

    expect(getMoonRise).toHaveBeenCalledWith(
      '2026-01-01',
      expect.objectContaining({ timezone: 'Pacific/Auckland' }),
    );
  });

  it('throws when no New Moon exists for requested period', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn().mockResolvedValue([]),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow('No New Moon found for requested period');
  });

  it('throws meaningful error when moonrise retrieval fails', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest
          .fn()
          .mockRejectedValue(new Error('moon data unavailable')),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow(
      'Failed to retrieve moonrise data: moon data unavailable',
    );
  });

  it('throws meaningful error when Whiro calculation fails', async () => {
    const getMoonRise = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(createMoonRise(date)),
      );

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      calculateWhiroStartFn: jest.fn().mockImplementation(() => {
        throw new Error('cannot calculate whiro');
      }),
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow(
      'Failed to calculate Whiro start: cannot calculate whiro',
    );
  });

  it('throws meaningful error when month generation fails', async () => {
    const getMoonRise = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(createMoonRise(date)),
      );

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise,
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
      calculateWhiroStartFn: jest
        .fn()
        .mockReturnValue(new Date('2025-12-30T05:00:00Z')),
      generateMaramatakaMonthFn: jest.fn().mockImplementation(() => {
        throw new Error('generator failed');
      }),
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow('Failed to generate Maramataka month: generator failed');
  });
});
