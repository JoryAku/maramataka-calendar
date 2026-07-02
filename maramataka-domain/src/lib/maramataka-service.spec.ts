import {
  AstronomyProviderError,
  Location,
  MoonRise,
} from '@maramataka-calendar/astronomy';
import { MaramatakaService } from './maramataka-service';
import { MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET } from './mita-te-tai-best';
import { summarizeRuleSet } from './maramataka-rule-set';

describe('MaramatakaService', () => {
  const location: Location = {
    latitude: -41.2865,
    longitude: 174.7762,
    timezone: 'Pacific/Auckland',
  };

  const createMoonRise = (date: string): MoonRise => ({
    date,
    risesAt: new Date(`${date}T05:00:00Z`),
    source: 'astronomy-engine',
  });
  const createMoonRiseAtOffset = (startDate: string, offset: number): MoonRise => {
    const start = new Date(`${startDate}T05:00:00Z`);
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);

    return createMoonRise(date.toISOString().slice(0, 10));
  };

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
        { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-29T06:00:00Z'), source: 'astronomy-engine' },
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
    expect(getMoonRise).toHaveBeenCalledTimes(7);
    expect(getMoonRise.mock.calls).toEqual([
      ['2025-12-29', location],
      ['2025-12-30', location],
      ['2025-12-31', location],
      ['2026-01-01', location],
      ['2026-01-02', location],
      ['2026-01-03', location],
      ['2026-01-04', location],
    ]);
    expect(calculateWhiroStartFn).toHaveBeenCalledWith({
      newMoonAt: new Date('2025-12-30T06:00:00Z'),
      newMoonLocalDate: '2025-12-30',
      moonRises,
    });
    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith({
      version: 'mita-te-tai-best',
      ruleSet: expect.objectContaining({
        id: 'mita-te-tai-best-observational-v1',
        mataBoundary: 'moonrise-to-moonrise',
        name: 'Mita Te Tai / Best observational maramataka (custom mata)',
      }),
      whiroStartsAt: moonRises[0].risesAt,
      mata,
      moonRises: moonRises.slice(0, 3),
      overlaps: undefined,
    });
    expect(result).toEqual({
      ...generatedMonth,
      starMonthSequence: 1,
    });
  });

  it('returns current details for star markers mentioned by the active named month', async () => {
    const whiroStartsAt = new Date('2026-06-10T05:00:00Z');
    const generatedMonth = {
      version: 'mita-te-tai-best' as const,
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      nights: [
        {
          mata: MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata[0],
          startsAt: whiroStartsAt,
          endsAt: new Date('2026-06-11T05:00:00Z'),
        },
      ],
    };
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockImplementation((year: number) =>
            Promise.resolve(
              year === 2026
                ? [
                    {
                      occursAt: new Date('2026-06-10T00:00:00Z'),
                      source: 'astronomy-engine',
                    },
                  ]
                : [],
            ),
          ),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest
          .fn()
          .mockImplementation((date: string) => Promise.resolve(createMoonRise(date))),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarMarkers: jest.fn().mockResolvedValue([
          {
            id: 'matariki',
            name: 'Matariki',
            type: 'asterism',
            englishName: 'Pleiades',
            description: 'Year-start marker.',
            seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
            source: 'Elsdon Best, The Maori Division of Time',
            confidence: 'confirmed',
            observedAt: whiroStartsAt,
            altitudeDegrees: -3,
            azimuthDegrees: 310,
            direction: 'NW',
            visibility: 'below-horizon',
            calculation: 'Test marker.',
          },
          {
            id: 'puanga',
            name: 'Puanga',
            type: 'star',
            englishName: 'Rigel',
            description: 'Visible but not the active month ariki.',
            seasonalAssociation: 'Another marker',
            source: 'Elsdon Best, The Maori Division of Time',
            confidence: 'confirmed',
            observedAt: whiroStartsAt,
            altitudeDegrees: 18,
            azimuthDegrees: 82,
            direction: 'E',
            visibility: 'visible',
            calculation: 'Test marker.',
          },
        ]),
      },
      calculateWhiroStartFn: jest.fn().mockReturnValue(whiroStartsAt),
      generateMaramatakaMonthFn: jest.fn().mockReturnValue(generatedMonth),
    });

    const cycle = await service.getCycleDetails(
      location,
      new Date('2026-06-10T06:00:00Z'),
    );

    expect(cycle?.starMonth?.name).toBe('Te Tahi o Pipiri');
    expect(cycle?.starMonth?.marker?.name).toBe('Matariki');
    expect(cycle?.starMonth?.marker?.visibility).toBe('below-horizon');
    expect(cycle?.starMarkers?.map((marker) => marker.name)).toEqual([
      'Matariki',
    ]);
  });

  it('names the star month by Whiro sequence without borrowing unrelated visible markers', async () => {
    const whiroStartsAt = new Date('2026-08-10T05:00:00Z');
    const generatedMonth = {
      version: 'mita-te-tai-best' as const,
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      starMonthSequence: 3,
      nights: [
        {
          mata: MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata[0],
          startsAt: whiroStartsAt,
          endsAt: new Date('2026-08-11T05:00:00Z'),
        },
      ],
    };
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn(),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarMarkers: jest.fn().mockResolvedValue([
          {
            id: 'puanga',
            name: 'Puanga',
            type: 'star',
            englishName: 'Rigel',
            description: 'Visible but not the active month ariki.',
            seasonalAssociation: 'Another marker',
            source: 'Elsdon Best, The Maori Division of Time',
            confidence: 'confirmed',
            observedAt: whiroStartsAt,
            altitudeDegrees: 18,
            azimuthDegrees: 82,
            direction: 'E',
            visibility: 'visible',
            calculation: 'Test marker.',
          },
        ]),
      },
      calculateWhiroStartFn: jest.fn(),
      generateMaramatakaMonthFn: jest.fn().mockReturnValue(generatedMonth),
    });
    jest.spyOn(service, 'getMonth').mockResolvedValue(generatedMonth);

    const cycle = await service.getCycleDetails(
      location,
      new Date('2026-08-10T06:00:00Z'),
    );

    expect(cycle?.starMonth?.name).toBe('Te Toru o Hereturi-koka');
    expect(cycle?.starMonth?.marker).toBeUndefined();
    expect(cycle?.starMarkers).toEqual([]);
  });

  it('generates a proportional year timeline from Whiro cycles', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-06-15T00:00:00Z'), source: 'astronomy-engine' },
        { occursAt: new Date('2026-07-14T00:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([
        { occursAt: new Date('2027-06-04T00:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([]);
    const getFullMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-06-30T05:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons,
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances: jest.fn().mockResolvedValue([
          {
            id: 'matariki',
            name: 'Matariki',
            type: 'asterism',
            englishName: 'Pleiades',
            description: 'Year-start marker.',
            seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
            source: 'test',
            confidence: 'confirmed',
            observedAt: new Date('2026-06-16T18:00:00Z'),
            altitudeDegrees: 1,
            azimuthDegrees: 80,
            direction: 'E',
            visibility: 'low',
            calculation:
              'First dawn sample in this maramataka year where the marker is above the eastern horizon.',
          },
        ]),
      },
    });
    const firstMonth = {
      version: 'mita-te-tai-best' as const,
      ruleSet: {
        id: 'mita-te-tai-best-observational-v1',
        name: 'Mita Te Tai / Best observational maramataka',
        version: '1',
        source: 'test',
        tradition: 'test',
        maramaStart: 'new-moon-observation-window-moonrise',
        mataBoundary: 'moonrise-to-moonrise',
        calibration: 'full-moon-observation-window-ohua',
        balancing: 'duplicate-ohua-drop-final-mata',
      },
      whiroStartsAt: new Date('2026-06-15T05:00:00Z'),
      nights: [
        {
          mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
          startsAt: new Date('2026-06-15T05:00:00Z'),
          endsAt: new Date('2026-06-30T05:00:00Z'),
        },
        {
          mata: { index: 15, name: 'Ohua', version: 'mita-te-tai-best' as const },
          startsAt: new Date('2026-06-30T05:00:00Z'),
          endsAt: new Date('2026-07-14T05:00:00Z'),
        },
      ],
    };
    const secondMonth = {
      ...firstMonth,
      whiroStartsAt: new Date('2026-07-14T05:00:00Z'),
      nights: [
        {
          mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' as const },
          startsAt: new Date('2026-07-14T05:00:00Z'),
          endsAt: new Date('2026-08-12T05:00:00Z'),
        },
      ],
    };
    jest
      .spyOn(service, 'getMonth')
      .mockResolvedValueOnce(firstMonth)
      .mockResolvedValueOnce(secondMonth);

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.year).toBe(2026);
    expect(year.startsAt).toEqual(new Date('2026-06-15T05:00:00.000Z'));
    expect(year.endsAt).toEqual(new Date('2027-06-04T00:00:00.000Z'));
    expect(year.months).toHaveLength(2);
    expect(year.months[0]).toMatchObject({
      sequence: 1,
      name: 'Marama 1',
      durationDays: 29,
      nightsCount: 2,
      repeatedMata: [],
    });
    expect(year.months[0].anchors.fullMoon?.occursAt).toEqual(
      new Date('2026-06-30T05:00:00Z'),
    );
    expect(year.months[1]).toMatchObject({
      sequence: 2,
      name: 'Marama 2',
      durationDays: 29,
      nightsCount: 1,
    });
    expect(year.events.map((event) => event.type)).toEqual([
      'new-moon',
      'month-start',
      'star-marker',
      'full-moon',
      'new-moon',
      'month-start',
      'month-start',
    ]);
    expect(
      year.events.find((event) => event.type === 'star-marker'),
    ).toMatchObject({
      name: 'Matariki',
      occursAt: new Date('2026-06-16T18:00:00Z'),
    });
    expect(year.diagnostics).toEqual([]);
  });

  it('falls back to astronomy anchors when a detailed year marama cannot be generated', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2027-06-04T00:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([]);
    const getFullMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-30T05:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons,
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    jest
      .spyOn(service, 'getMonth')
      .mockRejectedValue(new Error('No moonrise data found for Whiro date'));

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.months).toHaveLength(1);
    expect(year.months[0]).toMatchObject({
      sequence: 1,
      name: 'Marama 1',
      isEstimated: true,
      nightsCount: 0,
      unavailableReason: 'No moonrise data found for Whiro date',
    });
    expect(year.months[0].anchors.whiro.occursAt).toEqual(
      new Date('2026-06-15T00:00:00Z'),
    );
    expect(year.months[0].anchors.fullMoon?.occursAt).toEqual(
      new Date('2026-06-30T05:00:00Z'),
    );
    expect(year.months[0].anchors.nextWhiro.occursAt).toEqual(
      new Date('2027-06-04T00:00:00Z'),
    );
    expect(year.diagnostics).toEqual([
      {
        type: 'estimated-month',
        sequence: 1,
        name: 'Marama 1',
        anchorDate: new Date('2026-06-15T00:00:00Z'),
        reason: 'No moonrise data found for Whiro date',
      },
    ]);
  });

  it('keeps the year timeline available when full moon anchors cannot be loaded', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2027-06-04T00:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest
          .fn()
          .mockRejectedValue(new Error('phase unavailable')),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    jest
      .spyOn(service, 'getMonth')
      .mockRejectedValue(new Error('No moonrise data found for Whiro date'));

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.months).toHaveLength(1);
    expect(year.months[0].anchors.fullMoon).toBeUndefined();
    expect(year.months[0].anchors.whiro.occursAt).toEqual(
      new Date('2026-06-15T00:00:00Z'),
    );
    expect(year.diagnostics).toEqual([
      {
        type: 'phase-provider',
        name: '2025 Full Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2026 Full Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2027 Full Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2028 Full Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'estimated-month',
        sequence: 1,
        name: 'Marama 1',
        anchorDate: new Date('2026-06-15T00:00:00Z'),
        reason: 'No moonrise data found for Whiro date',
      },
    ]);
  });

  it('returns an empty year timeline instead of failing when new moon anchors cannot be loaded', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn().mockRejectedValue(new Error('phase unavailable')),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.year).toBe(2026);
    expect(year.months).toEqual([]);
    expect(year.diagnostics).toEqual([
      {
        type: 'phase-provider',
        name: '2025 New Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2026 New Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2027 New Moon anchors',
        reason: 'phase unavailable',
      },
      {
        type: 'phase-provider',
        name: '2028 New Moon anchors',
        reason: 'phase unavailable',
      },
    ]);
  });

  it('closes the marama at the next Whiro moonrise', async () => {
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
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'astronomy-engine' },
        { occursAt: new Date('2026-01-03T06:00:00Z'), source: 'astronomy-engine' },
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

    expect(generateMaramatakaMonthFn).toHaveBeenCalledWith(
      expect.objectContaining({
        whiroStartsAt: moonRises[0].risesAt,
        mata: mata.slice(0, 2),
        moonRises: moonRises.slice(0, 3),
      }),
    );
  });

  it('resolves current night immediately before, at, and after moonrise boundaries', async () => {
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
    ];
    const createService = () =>
      new MaramatakaService({
        astronomyProvider: {
          getNewMoons: jest
            .fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([
              { occursAt: new Date('2026-01-01T01:00:00Z'), source: 'astronomy-engine' },
              { occursAt: new Date('2026-01-04T01:00:00Z'), source: 'astronomy-engine' },
            ])
            .mockResolvedValueOnce([]),
          getMoonPhases: jest.fn(),
          getFullMoons: jest.fn(),
          getMoonRise: jest
            .fn()
            .mockImplementation((date: string) =>
              Promise.resolve(
                moonRises.find((moonRise) => moonRise.date === date),
              ),
            ),
          getMoonRiseSet: jest.fn(),
          getMoonTransit: jest.fn(),
          getMoonDetails: jest.fn(),
        },
        calculateWhiroStartFn: jest.fn().mockReturnValue(moonRises[0].risesAt),
        mata,
      });

    await expect(
      createService().getCurrentNight(
        location,
        new Date('2026-01-02T04:59:59.999Z'),
      ),
    ).resolves.toMatchObject({
      night: {
        mata: { name: 'Whiro' },
      },
    });
    await expect(
      createService().getCurrentNight(location, new Date('2026-01-02T05:00:00Z')),
    ).resolves.toMatchObject({
      night: {
        mata: { name: 'Tirea' },
      },
    });
    await expect(
      createService().getCurrentNight(
        location,
        new Date('2026-01-02T05:00:00.001Z'),
      ),
    ).resolves.toMatchObject({
      night: {
        mata: { name: 'Tirea' },
      },
    });
  });

  it('keeps the normal sequence when Full Moon occurs on the 15th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'astronomy-engine' },
        { occursAt: new Date('2026-01-31T06:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([]);

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { occursAt: new Date('2026-01-15T12:00:00Z'), source: 'astronomy-engine' },
          ])
          .mockResolvedValueOnce([]),
        getMoonRise: jest
          .fn()
          .mockImplementation((date: string) =>
            Promise.resolve(
              moonRises.find((moonRise) => moonRise.date === date),
            ),
          ),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    const month = await service.getMonth(
      location,
      new Date('2026-01-02T12:00:00Z'),
    );

    expect(month.nights).toHaveLength(30);
    expect(month.nights[14].mata.name).toBe('Ohua');
    expect(
      month.nights.filter((night) => night.mata.name === 'Ohua'),
    ).toHaveLength(1);
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Mutu');
  });

  it('duplicates Ohua twice and drops the final mata when Full Moon occurs on the 16th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'astronomy-engine' },
        { occursAt: new Date('2026-01-31T06:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([]);

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { occursAt: new Date('2026-01-16T12:00:00Z'), source: 'astronomy-engine' },
          ])
          .mockResolvedValueOnce([]),
        getMoonRise: jest
          .fn()
          .mockImplementation((date: string) =>
            Promise.resolve(
              moonRises.find((moonRise) => moonRise.date === date),
            ),
          ),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    const month = await service.getMonth(
      location,
      new Date('2026-01-02T12:00:00Z'),
    );

    expect(month.nights).toHaveLength(30);
    expect(month.nights.slice(14, 16).map((night) => night.mata.name)).toEqual([
      'Ohua',
      'Ohua',
    ]);
    expect(month.nights.map((night) => night.mata.name)).not.toContain('Mutu');
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Maurea');
  });

  it('duplicates Ohua across the 15th, 16th, and 17th intervals and drops final mata when Full Moon occurs on the 17th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'astronomy-engine' },
        { occursAt: new Date('2026-01-31T06:00:00Z'), source: 'astronomy-engine' },
      ])
      .mockResolvedValueOnce([]);

    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            { occursAt: new Date('2026-01-17T12:00:00Z'), source: 'astronomy-engine' },
          ])
          .mockResolvedValueOnce([]),
        getMoonRise: jest
          .fn()
          .mockImplementation((date: string) =>
            Promise.resolve(
              moonRises.find((moonRise) => moonRise.date === date),
            ),
          ),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    const month = await service.getMonth(
      location,
      new Date('2026-01-02T12:00:00Z'),
    );

    expect(month.nights).toHaveLength(30);
    expect(month.nights.slice(14, 17).map((night) => night.mata.name)).toEqual([
      'Ohua',
      'Ohua',
      'Ohua',
    ]);
    expect(month.nights.map((night) => night.mata.name)).not.toContain('Maurea');
    expect(month.nights.map((night) => night.mata.name)).not.toContain('Mutu');
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Orongonui');
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
        { occursAt: new Date('2026-01-01T06:00:00Z'), source: 'astronomy-engine' },
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
        { occursAt: new Date('2025-12-31T23:30:00Z'), source: 'astronomy-engine' },
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
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'astronomy-engine' },
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

  it('preserves astronomy provider errors when moonrise retrieval fails', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockResolvedValueOnce([
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'astronomy-engine' },
          ])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest
          .fn()
          .mockRejectedValue(
            new AstronomyProviderError(
              'astronomy-engine',
              'request-timeout',
              'Astronomy Engine moonrise request timed out after 10000ms',
            ),
          ),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });

    await expect(
      service.getMonth(location, new Date('2026-01-15T12:00:00Z')),
    ).rejects.toMatchObject({
      provider: 'astronomy-engine',
      code: 'request-timeout',
      message:
        'Failed to retrieve moonrise data: Astronomy Engine moonrise request timed out after 10000ms',
    });
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
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'astronomy-engine' },
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
            { occursAt: new Date('2025-12-30T06:00:00Z'), source: 'astronomy-engine' },
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
