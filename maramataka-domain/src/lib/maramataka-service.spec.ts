import { Location, MoonRiseSet } from '@maramataka-calendar/astronomy';
import { MaramatakaService } from './maramataka-service';

describe('MaramatakaService', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezoneOffset: 13,
  };

  const createMoonRiseSet = (date: string): MoonRiseSet => ({
    date,
    risesAt: new Date(`${date}T05:00:00Z`),
    setsAt: new Date(`${date}T18:00:00Z`),
    source: 'usno',
  });

  it('orchestrates astronomy, Whiro calculation, and month generation', async () => {
    const mata = [
      { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
      { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
    ];

    const whiroInterval = createMoonRiseSet('2025-12-30');
    const tireaInterval = createMoonRiseSet('2025-12-31');
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([
        { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-29T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([]);

    const getMoonRiseSet = jest
      .fn()
      .mockResolvedValueOnce(whiroInterval)
      .mockResolvedValueOnce(tireaInterval);

    const calculateWhiroStartFn = jest
      .fn()
      .mockReturnValue(whiroInterval.risesAt);

    const generatedMonth = {
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: whiroInterval.risesAt,
      nights: [],
    };
    const generateMaramatakaMonthFn = jest.fn().mockReturnValue(generatedMonth);

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getSunset: jest.fn(),
        getMoonRiseSet,
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
    expect(getMoonRiseSet).toHaveBeenCalledTimes(2);
    expect(getMoonRiseSet.mock.calls).toEqual([
      ['2025-12-30', location],
      ['2025-12-31', location],
    ]);
    expect(calculateWhiroStartFn).toHaveBeenCalledWith({
      newMoonAt: new Date('2025-12-30T06:00:00Z'),
      newMoonLocalDate: '2025-12-30',
      moonRiseSets: [whiroInterval, tireaInterval],
    });
    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith({
      version: 'mita-te-tai-best',
      whiroStartsAt: whiroInterval.risesAt,
      mata,
      moonRiseSets: [whiroInterval, tireaInterval],
      overlaps: undefined,
    });
    expect(result).toBe(generatedMonth);
  });

  it('marks the next New Moon date interval as overlapping Whiro when cycles overlap', async () => {
    const mata = [
      { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
      { index: 2, name: 'Tirea', version: 'mita-te-tai-best' as const },
      { index: 3, name: 'Ohoata', version: 'mita-te-tai-best' as const },
    ];

    const whiroInterval = createMoonRiseSet('2026-01-01');
    const tireaInterval = createMoonRiseSet('2026-01-02');
    const ohoataInterval = createMoonRiseSet('2026-01-03');
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'usno' },
        { occursAt: new Date('2026-01-03T06:00:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([]);

    const getMoonRiseSet = jest
      .fn()
      .mockResolvedValueOnce(whiroInterval)
      .mockResolvedValueOnce(tireaInterval)
      .mockResolvedValueOnce(ohoataInterval);

    const generateMaramatakaMonthFn = jest.fn().mockReturnValue({
      version: 'mita-te-tai-best' as const,
      whiroStartsAt: whiroInterval.risesAt,
      nights: [],
    });

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getSunset: jest.fn(),
        getMoonRiseSet,
      },
      calculateWhiroStartFn: jest.fn().mockReturnValue(whiroInterval.risesAt),
      generateMaramatakaMonthFn,
      mata,
    });

    await service.getMonth(location, new Date('2026-01-02T12:00:00Z'));

    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith({
      version: 'mita-te-tai-best',
      whiroStartsAt: whiroInterval.risesAt,
      mata,
      moonRiseSets: [whiroInterval, tireaInterval, ohoataInterval],
      overlaps: [
        {
          intervalDate: '2026-01-03',
          overlap: {
            mata: mata[0],
            cycleStartsAt: ohoataInterval.risesAt,
            reason: 'new-moon-anchor',
          },
        },
      ],
    });
  });

  it('requests moonrise/moonset using the New Moon local calendar day across UTC boundaries', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([
        { occursAt: new Date('2025-12-31T23:30:00Z'), source: 'usno' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const getMoonRiseSet = jest
      .fn()
      .mockResolvedValue(createMoonRiseSet('2026-01-01'));

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getSunset: jest.fn(),
        getMoonRiseSet,
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
        timezoneOffset: 13,
      },
      new Date('2026-01-01T12:00:00Z'),
    );

    expect(getMoonRiseSet).toHaveBeenCalledWith(
      '2026-01-01',
      expect.objectContaining({ timezoneOffset: 13 }),
    );
  });

  it('throws when no New Moon exists for requested period', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn().mockResolvedValue([]),
        getSunset: jest.fn(),
        getMoonRiseSet: jest.fn(),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow('No New Moon found for requested period');
  });

  it('throws meaningful error when moonrise/moonset retrieval fails', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'usno' },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        getSunset: jest.fn(),
        getMoonRiseSet: jest
          .fn()
          .mockRejectedValue(new Error('moon data unavailable')),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toThrow(
      'Failed to retrieve moonrise/moonset data: moon data unavailable',
    );
  });

  it('throws meaningful error when Whiro calculation fails', async () => {
    const getMoonRiseSet = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(createMoonRiseSet(date)),
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
        getSunset: jest.fn(),
        getMoonRiseSet,
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
    const getMoonRiseSet = jest
      .fn()
      .mockImplementation((date: string) =>
        Promise.resolve(createMoonRiseSet(date)),
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
        getSunset: jest.fn(),
        getMoonRiseSet,
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
