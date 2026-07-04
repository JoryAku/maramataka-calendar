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
  const createMoonRiseAtOffset = (
    startDate: string,
    offset: number,
  ): MoonRise => {
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
        {
          occursAt: new Date('2025-12-30T06:00:00Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-01-29T06:00:00Z'),
          source: 'astronomy-engine',
        },
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
        getNewMoons: jest.fn().mockImplementation((year: number) =>
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
          .mockImplementation((date: string) =>
            Promise.resolve(createMoonRise(date)),
          ),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarMarkers: jest.fn().mockResolvedValue([
          {
            id: 'pipiri',
            name: 'Pipiri',
            type: 'star',
            englishName: 'Hamal',
            description: 'Te Tahi o Pipiri named-month marker.',
            seasonalAssociation: 'First named month marker',
            source: 'Living by the Stars',
            confidence: 'confirmed',
            observedAt: whiroStartsAt,
            altitudeDegrees: -3,
            azimuthDegrees: 310,
            direction: 'NW',
            visibility: 'below-horizon',
            calculation: 'Test marker.',
          },
          {
            id: 'whakaahu',
            name: 'Whakaahu',
            type: 'star',
            englishName: 'Castor',
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
    expect(cycle?.starMonth?.marker?.name).toBe('Pipiri');
    expect(cycle?.starMonth?.marker?.visibility).toBe('below-horizon');
    expect(cycle?.starMarkers?.map((marker) => marker.name)).toEqual([
      'Pipiri',
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
            id: 'whakaahu',
            name: 'Whakaahu',
            type: 'star',
            englishName: 'Castor',
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

    expect(cycle?.starMonth?.name).toBe('Te Toru Here o Pipiri');
    expect(cycle?.starMonth?.marker).toBeUndefined();
    expect(cycle?.starMarkers).toEqual([]);
  });

  it('generates a proportional year timeline from Whiro cycles', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
    const getStarFirstAppearances = jest
      .fn()
      .mockImplementation(
        async (
          startDate: string,
          _endDate: string,
          _location: Location,
          markers: { id: string; name: string }[] = [],
        ) =>
          markers.map((marker) => ({
            id: marker.id,
            name: marker.name,
            type: 'asterism',
            englishName: marker.id === 'matariki' ? 'Pleiades' : undefined,
            description: 'Month-scoped marker.',
            seasonalAssociation: `Marker for ${marker.name}`,
            source: 'test',
            confidence: 'confirmed',
            observedAt: new Date(`${startDate}T18:00:00Z`),
            altitudeDegrees: 1,
            azimuthDegrees: 80,
            direction: 'E',
            visibility: 'low',
            calculation:
              'First dawn sample in this maramataka month where the marker is above the eastern horizon.',
          })),
      );
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons,
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances,
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
        calibration: 'full-moon-observation-window',
        balancing: 'fixed-sequence-drop-final-mata',
      },
      whiroStartsAt: new Date('2026-06-15T05:00:00Z'),
      starMonthSequence: 1,
      nights: [
        {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best' as const,
          },
          startsAt: new Date('2026-06-15T05:00:00Z'),
          endsAt: new Date('2026-06-30T05:00:00Z'),
        },
        {
          mata: {
            index: 15,
            name: 'Turu',
            version: 'mita-te-tai-best' as const,
          },
          startsAt: new Date('2026-06-30T05:00:00Z'),
          endsAt: new Date('2026-07-14T05:00:00Z'),
        },
      ],
    };
    const secondMonth = {
      ...firstMonth,
      whiroStartsAt: new Date('2026-07-14T05:00:00Z'),
      starMonthSequence: 2,
      nights: [
        {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best' as const,
          },
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
      name: 'Te Tahi o Pipiri',
      durationDays: 29,
      nightsCount: 2,
      repeatedMata: [],
    });
    expect(year.months[0].anchors.fullMoon?.occursAt).toEqual(
      new Date('2026-06-30T05:00:00Z'),
    );
    expect(year.months[1]).toMatchObject({
      sequence: 2,
      name: 'Te Rua o Takurua',
      durationDays: 29,
      nightsCount: 1,
    });
    expect(getStarFirstAppearances).toHaveBeenCalledWith(
      '2026-06-15',
      '2026-07-14',
      location,
      [expect.objectContaining({ id: 'pipiri' })],
    );
    expect(getStarFirstAppearances).toHaveBeenCalledWith(
      '2026-07-14',
      '2026-08-12',
      location,
      [expect.objectContaining({ id: 'takurua' })],
    );
    expect(getStarFirstAppearances).toHaveBeenCalledWith(
      '2026-06-15',
      '2027-06-04',
      location,
      expect.arrayContaining([
        expect.objectContaining({ id: 'kopu' }),
        expect.objectContaining({ id: 'mahuru' }),
        expect.objectContaining({ id: 'rehua' }),
      ]),
    );
    expect(year.events.filter((event) => event.type === 'star-marker')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Pipiri',
          occursAt: new Date('2026-06-15T18:00:00Z'),
          monthName: 'Te Tahi o Pipiri',
          starMarkerScope: 'month',
        }),
        expect.objectContaining({
          name: 'Takurua',
          occursAt: new Date('2026-07-14T18:00:00Z'),
          monthName: 'Te Rua o Takurua',
          starMarkerScope: 'month',
        }),
        expect.objectContaining({
          name: 'Kōpū',
          occursAt: new Date('2026-06-15T18:00:00Z'),
          starMarkerScope: 'seasonal',
        }),
      ]),
    );
    expect(year.diagnostics).toEqual([]);
  });

  it('does not duplicate the year-start month boundary when generated months are available', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    jest.spyOn(service, 'getMonth').mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet: {
        id: 'test-rule-set',
        name: 'Test rule set',
        version: 'test',
        source: 'test',
        tradition: 'test',
        maramaStart: 'new-moon-observation-window-moonrise',
        mataBoundary: 'moonrise-to-moonrise',
        calibration: 'full-moon-observation-window',
        balancing: 'fixed-sequence-drop-final-mata',
      },
      whiroStartsAt: new Date('2026-06-15T05:00:00Z'),
      nights: [
        {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best' as const,
          },
          startsAt: new Date('2026-06-15T05:00:00Z'),
          endsAt: new Date('2026-07-14T05:00:00Z'),
        },
      ],
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    const yearStartMonthEvents = year.events.filter(
      (event) =>
        event.type === 'month-start' &&
        event.monthSequence === 1 &&
        event.occursAt.getTime() <= new Date('2026-06-15T05:00:00Z').getTime(),
    );
    expect(yearStartMonthEvents).toHaveLength(1);
    expect(yearStartMonthEvents[0]).toMatchObject({
      occursAt: new Date('2026-06-15T05:00:00Z'),
    });
    expect(
      year.events.some(
        (event) =>
          event.type === 'month-start' &&
          event.occursAt.getTime() ===
            new Date('2026-06-15T00:00:00Z').getTime(),
      ),
    ).toBe(false);
  });

  it('starts the star year at the first New Moon after the Pipiri marker reappears', async () => {
    const getStarFirstAppearances = jest.fn().mockResolvedValue([
      {
        id: 'pipiri',
        name: 'Pipiri',
        type: 'star',
        englishName: 'Hamal',
        description: 'Pipiri marker.',
        seasonalAssociation: 'First named month marker',
        source: 'test',
        confidence: 'confirmed',
        observedAt: new Date('2026-06-20T18:00:00Z'),
        altitudeDegrees: 1,
        azimuthDegrees: 80,
        direction: 'E',
        visibility: 'low',
        calculation: 'test marker appearance',
      },
    ]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn(),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances,
      },
    });

    const yearStart = await (
      service as unknown as {
        findStarYearStartNewMoon(
          newMoons: { occursAt: Date; source: string }[],
          year: number,
          location: Location,
        ): Promise<{ occursAt: Date; source: string } | undefined>;
      }
    ).findStarYearStartNewMoon(
      [
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
          source: 'astronomy-engine',
        },
      ],
      2026,
      location,
    );

    expect(getStarFirstAppearances).toHaveBeenCalledWith(
      '2026-01-01',
      '2027-01-01',
      location,
      [expect.objectContaining({ id: 'pipiri' })],
    );
    expect(yearStart?.occursAt).toEqual(new Date('2026-07-14T00:00:00Z'));
  });

  it('labels the month after Te Tahi o Pipiri as Ruhanui when Matariki has not appeared by Whiro', async () => {
    const getStarFirstAppearances = jest
      .fn()
      .mockImplementation((startDate, _endDate, _location, markers) =>
        Promise.resolve([
          {
            id: markers[0].id,
            name: markers[0].name,
            type: markers[0].type,
            englishName: markers[0].englishName,
            description: markers[0].description,
            seasonalAssociation: markers[0].seasonalAssociation,
            source: 'test',
            confidence: 'confirmed',
            observedAt:
              markers[0].id === 'pipiri'
                ? new Date(`${startDate.slice(0, 4)}-05-04T18:00:00Z`)
                : new Date(`${startDate.slice(0, 4)}-06-01T18:00:00Z`),
            altitudeDegrees: 1,
            azimuthDegrees: 80,
            direction: 'E',
            visibility: 'low',
            calculation: 'test marker appearance',
          },
        ]),
      );
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn(),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances,
      },
      calculateWhiroStartFn: jest
        .fn()
        .mockReturnValue(new Date('2027-05-27T18:00:00Z')),
    });
    const newMoons = [
      '2027-05-27T00:00:00Z',
      '2027-06-25T00:00:00Z',
      '2027-07-24T00:00:00Z',
      '2027-08-23T00:00:00Z',
      '2027-09-21T00:00:00Z',
      '2027-10-21T00:00:00Z',
      '2027-11-19T00:00:00Z',
      '2027-12-19T00:00:00Z',
      '2028-01-17T00:00:00Z',
      '2028-02-16T00:00:00Z',
      '2028-03-16T00:00:00Z',
      '2028-04-15T00:00:00Z',
      '2028-05-24T00:00:00Z',
      '2028-06-23T00:00:00Z',
      '2028-07-22T00:00:00Z',
      '2028-08-20T00:00:00Z',
      '2028-09-19T00:00:00Z',
      '2028-10-18T00:00:00Z',
      '2028-11-17T00:00:00Z',
      '2028-12-16T00:00:00Z',
      '2029-01-15T00:00:00Z',
      '2029-02-13T00:00:00Z',
      '2029-03-15T00:00:00Z',
      '2029-04-14T00:00:00Z',
      '2029-05-14T00:00:00Z',
      '2029-06-12T00:00:00Z',
    ].map((occursAt) => ({
      occursAt: new Date(occursAt),
      source: 'astronomy-engine',
    }));
    const calculateStarMonthSequence = (
      service as unknown as {
        calculateStarMonthSequence(
          newMoons: { occursAt: Date; source: string }[],
          relevantNewMoon: { occursAt: Date; source: string },
          location: Location,
        ): Promise<number | undefined>;
      }
    ).calculateStarMonthSequence.bind(service);
    const pipiriNewMoon = newMoons.find(
      (newMoon) =>
        newMoon.occursAt.toISOString() === '2027-05-27T00:00:00.000Z',
    )!;
    const ruhanuiNewMoon = newMoons.find(
      (newMoon) =>
        newMoon.occursAt.toISOString() === '2027-06-25T00:00:00.000Z',
    )!;
    const takuruaNewMoon = newMoons.find(
      (newMoon) =>
        newMoon.occursAt.toISOString() === '2027-07-24T00:00:00.000Z',
    )!;

    await expect(
      calculateStarMonthSequence(newMoons, pipiriNewMoon, location),
    ).resolves.toBe(1);
    await expect(
      calculateStarMonthSequence(newMoons, ruhanuiNewMoon, location),
    ).resolves.toBe(0);
    await expect(
      calculateStarMonthSequence(newMoons, takuruaNewMoon, location),
    ).resolves.toBe(2);
  });

  it('moves Te Tahi o Pipiri to the next Whiro when Matariki returns late in the candidate marama', async () => {
    const getStarFirstAppearances = jest
      .fn()
      .mockImplementation((startDate, _endDate, _location, markers) =>
        Promise.resolve([
          {
            id: markers[0].id,
            name: markers[0].name,
            type: markers[0].type,
            englishName: markers[0].englishName,
            description: markers[0].description,
            seasonalAssociation: markers[0].seasonalAssociation,
            source: 'test',
            confidence: 'confirmed',
            observedAt:
              markers[0].id === 'pipiri'
                ? new Date(`${startDate.slice(0, 4)}-05-04T18:00:00Z`)
                : new Date(`${startDate.slice(0, 4)}-06-10T18:00:00Z`),
            altitudeDegrees: 1,
            azimuthDegrees: 80,
            direction: 'E',
            visibility: 'low',
            calculation: 'test marker appearance',
          },
        ]),
      );
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn(),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances,
      },
      calculateWhiroStartFn: jest.fn(({ newMoonAt }) => newMoonAt),
    });
    const newMoons = [
      '2027-05-27T00:00:00Z',
      '2027-06-25T00:00:00Z',
      '2027-07-24T00:00:00Z',
      '2027-08-23T00:00:00Z',
      '2027-09-21T00:00:00Z',
      '2027-10-21T00:00:00Z',
      '2027-11-19T00:00:00Z',
      '2027-12-19T00:00:00Z',
      '2028-01-17T00:00:00Z',
      '2028-02-16T00:00:00Z',
      '2028-03-16T00:00:00Z',
      '2028-04-15T00:00:00Z',
      '2028-05-24T00:00:00Z',
      '2028-06-23T00:00:00Z',
    ].map((occursAt) => ({
      occursAt: new Date(occursAt),
      source: 'astronomy-engine',
    }));
    const calculateStarMonthSequence = (
      service as unknown as {
        calculateStarMonthSequence(
          newMoons: { occursAt: Date; source: string }[],
          relevantNewMoon: { occursAt: Date; source: string },
          location: Location,
        ): Promise<number | undefined>;
      }
    ).calculateStarMonthSequence.bind(service);
    const pipiriNewMoon = newMoons.find(
      (newMoon) =>
        newMoon.occursAt.toISOString() === '2027-06-25T00:00:00.000Z',
    )!;
    const takuruaNewMoon = newMoons.find(
      (newMoon) =>
        newMoon.occursAt.toISOString() === '2027-07-24T00:00:00.000Z',
    )!;

    await expect(
      calculateStarMonthSequence(newMoons, pipiriNewMoon, location),
    ).resolves.toBe(1);
    await expect(
      calculateStarMonthSequence(newMoons, takuruaNewMoon, location),
    ).resolves.toBe(2);
  });

  it('places Ruhanui immediately after Te Tahi o Pipiri when Matariki appears after Whiro', async () => {
    const newMoons = [
      '2027-05-27T00:00:00Z',
      '2027-06-25T00:00:00Z',
      '2027-07-24T00:00:00Z',
      '2027-08-23T00:00:00Z',
      '2027-09-21T00:00:00Z',
      '2027-10-21T00:00:00Z',
      '2027-11-19T00:00:00Z',
      '2027-12-19T00:00:00Z',
      '2028-01-17T00:00:00Z',
      '2028-02-16T00:00:00Z',
      '2028-03-16T00:00:00Z',
      '2028-04-15T00:00:00Z',
      '2028-05-24T00:00:00Z',
      '2028-06-23T00:00:00Z',
      '2028-07-22T00:00:00Z',
      '2029-06-12T00:00:00Z',
    ].map((occursAt) => ({
      occursAt: new Date(occursAt),
      source: 'astronomy-engine',
    }));
    const getNewMoons = jest
      .fn()
      .mockImplementation((year: number) =>
        Promise.resolve(
          newMoons.filter(
            (newMoon) => newMoon.occursAt.getUTCFullYear() === year,
          ),
        ),
      );
    const getStarFirstAppearances = jest
      .fn()
      .mockImplementation((startDate, _endDate, _location, markers) =>
        Promise.resolve([
          {
            id: markers[0].id,
            name: markers[0].name,
            type: markers[0].type,
            englishName: markers[0].englishName,
            description: markers[0].description,
            seasonalAssociation: markers[0].seasonalAssociation,
            source: 'test',
            confidence: 'confirmed',
            observedAt:
              markers[0].id === 'pipiri'
                ? new Date(`${startDate.slice(0, 4)}-05-04T18:00:00Z`)
                : new Date(`${startDate.slice(0, 4)}-06-01T18:00:00Z`),
            altitudeDegrees: 1,
            azimuthDegrees: 80,
            direction: 'E',
            visibility: 'low',
            calculation: 'test marker appearance',
          },
        ]),
      );
    const getStarMarkers = jest.fn().mockResolvedValue([
      {
        id: 'matariki',
        name: 'Matariki',
        type: 'asterism',
        englishName: 'Pleiades',
        description: 'Year-start marker.',
        seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
        source: 'test',
        confidence: 'confirmed',
        observedAt: new Date('2028-05-23T18:09:00Z'),
        altitudeDegrees: -13.5,
        azimuthDegrees: 70,
        direction: 'E',
        visibility: 'below-horizon',
        calculation: 'test dawn sample',
      },
    ]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarFirstAppearances,
        getStarMarkers,
      },
      calculateWhiroStartFn: jest.fn(({ newMoonAt }) => newMoonAt),
    });
    jest
      .spyOn(service, 'getMonth')
      .mockImplementation(async (_location, date) => {
        const index = newMoons.findIndex(
          (newMoon) => newMoon.occursAt.getTime() === date.getTime(),
        );
        const nextNewMoon = newMoons[index + 1];
        const whiroStartsAt = newMoons[index].occursAt;
        const nextWhiroStartsAt = nextNewMoon?.occursAt ?? whiroStartsAt;

        return {
          version: 'mita-te-tai-best' as const,
          ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
          whiroStartsAt,
          starMonthSequence: index + 1,
          nights: [
            {
              mata: {
                index: 1,
                name: 'Whiro',
                version: 'mita-te-tai-best' as const,
              },
              startsAt: whiroStartsAt,
              endsAt: nextWhiroStartsAt,
            },
          ],
        };
      });

    const year = await service.getYear(
      location,
      new Date('2027-07-01T12:00:00Z'),
    );

    expect(year.year).toBe(2027);
    expect(year.startsAt).toEqual(new Date('2027-05-27T00:00:00.000Z'));
    expect(year.endsAt).toEqual(new Date('2028-05-24T00:00:00.000Z'));
    expect(year.months[1]).toMatchObject({
      sequence: 2,
      name: 'Ruhanui',
      startsAt: new Date('2027-06-25T00:00:00.000Z'),
    });
  });

  it('adds the Matariki public holiday on the closest Friday within Pipiri', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    const whiroStartsAt = new Date('2026-06-15T06:00:00Z');
    const nights = MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata
      .slice(0, 29)
      .map((mata, index) => ({
        mata,
        startsAt: new Date(whiroStartsAt.getTime() + index * 86_400_000),
        endsAt: new Date(whiroStartsAt.getTime() + (index + 1) * 86_400_000),
      }));
    jest.spyOn(service, 'getMonth').mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      starMonthSequence: 1,
      nights,
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'public-holiday',
          name: 'Matariki public holiday',
          occursAt: new Date('2026-07-09T12:00:00.000Z'),
          monthSequence: 1,
        }),
      ]),
    );
  });

  it('selects the closest Friday using exact Tangaroa interval instants', () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest.fn(),
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn(),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    const helper = service as unknown as {
      closestFridayInDateRangeToInterval(
        candidateStartsOn: string,
        candidateEndsOn: string,
        startsAt: Date,
        endsAt: Date,
        location: Location,
      ): string;
    };

    expect(
      helper.closestFridayInDateRangeToInterval(
        '2044-06-01',
        '2044-07-01',
        new Date('2044-06-18T13:00:00.000Z'),
        new Date('2044-06-21T13:00:00.000Z'),
        location,
      ),
    ).toBe('2044-06-17');
    expect(
      helper.closestFridayInDateRangeToInterval(
        '2044-06-01',
        '2044-07-01',
        new Date('2044-06-19T11:00:00.000Z'),
        new Date('2044-06-22T11:30:00.000Z'),
        location,
      ),
    ).toBe('2044-06-24');
  });

  it('adds Matariki disappearance as a year timeline event', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
    const getStarNightInvisibilityPeriods = jest.fn().mockResolvedValue([
      {
        markerId: 'matariki',
        markerName: 'Matariki',
        startsOn: '2027-04-07',
        endsOn: '2027-06-15',
        days: 70,
        sunAltitudeThresholdDegrees: -18,
        calculation: 'test night invisibility period',
      },
    ]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
        getStarNightInvisibilityPeriods,
      },
    });
    const whiroStartsAt = new Date('2026-06-15T06:00:00Z');
    const nights = MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata
      .slice(0, 29)
      .map((mata, index) => ({
        mata,
        startsAt: new Date(whiroStartsAt.getTime() + index * 86_400_000),
        endsAt: new Date(whiroStartsAt.getTime() + (index + 1) * 86_400_000),
      }));
    jest.spyOn(service, 'getMonth').mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      starMonthSequence: 1,
      nights,
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'star-invisibility',
          name: 'Matariki disappears',
          occursAt: new Date('2027-04-06T12:00:00.000Z'),
          description: expect.stringContaining('70 days'),
          source: 'test night invisibility period',
        }),
      ]),
    );
  });

  it('adds equinox and solstice events within the maramataka year', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
    const getSolarSeasons = jest
      .fn()
      .mockResolvedValueOnce([
        {
          name: 'March equinox',
          occursAt: new Date('2026-03-20T14:46:00.000Z'),
          source: 'astronomy-engine',
        },
        {
          name: 'June solstice',
          occursAt: new Date('2026-06-21T08:24:00.000Z'),
          source: 'astronomy-engine',
        },
        {
          name: 'December solstice',
          occursAt: new Date('2026-12-21T20:50:00.000Z'),
          source: 'astronomy-engine',
        },
      ])
      .mockResolvedValueOnce([
        {
          name: 'June solstice',
          occursAt: new Date('2027-06-21T14:10:00.000Z'),
          source: 'astronomy-engine',
        },
      ]);
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons,
        getMoonPhases: jest.fn(),
        getFullMoons: jest.fn().mockResolvedValue([]),
        getSolarSeasons,
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    const whiroStartsAt = new Date('2026-06-15T06:00:00Z');
    const nights = MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata
      .slice(0, 29)
      .map((mata, index) => ({
        mata,
        startsAt: new Date(whiroStartsAt.getTime() + index * 86_400_000),
        endsAt: new Date(whiroStartsAt.getTime() + (index + 1) * 86_400_000),
      }));
    jest.spyOn(service, 'getMonth').mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      starMonthSequence: 1,
      nights,
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(getSolarSeasons).toHaveBeenCalledWith(2026);
    expect(getSolarSeasons).toHaveBeenCalledWith(2027);
    expect(
      year.events.filter((event) => event.type === 'solar-season'),
    ).toEqual([
      expect.objectContaining({
        type: 'solar-season',
        name: 'June solstice',
        occursAt: new Date('2026-06-21T08:24:00.000Z'),
      }),
      expect.objectContaining({
        type: 'solar-season',
        name: 'December solstice',
        occursAt: new Date('2026-12-21T20:50:00.000Z'),
      }),
    ]);
  });

  it('derives the holiday window from target mata names even when phase groups are changed', async () => {
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-06-15T00:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-07-14T00:00:00Z'),
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
        getFullMoons: jest.fn().mockResolvedValue([]),
        getMoonRise: jest.fn(),
        getMoonRiseSet: jest.fn(),
        getMoonTransit: jest.fn(),
        getMoonDetails: jest.fn(),
      },
    });
    const whiroStartsAt = new Date('2026-06-15T06:00:00Z');
    const nights = MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.mata
      .slice(0, 29)
      .map((mata, index) => {
        const mataWithChangedPhaseGroup =
          mata.phaseGroup?.name === 'Korekore' ||
          mata.phaseGroup?.name === 'Tangaroa'
            ? { ...mata, phaseGroup: { name: 'Te Hua' as const } }
            : mata;

        return {
          mata: mataWithChangedPhaseGroup,
          startsAt: new Date(whiroStartsAt.getTime() + index * 86_400_000),
          endsAt: new Date(whiroStartsAt.getTime() + (index + 1) * 86_400_000),
        };
      });
    jest.spyOn(service, 'getMonth').mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt,
      starMonthSequence: 1,
      nights,
    });

    const year = await service.getYear(
      location,
      new Date('2026-07-10T12:00:00Z'),
    );

    expect(year.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'public-holiday',
          name: 'Matariki public holiday',
          occursAt: new Date('2026-07-09T12:00:00.000Z'),
          monthSequence: 1,
        }),
      ]),
    );
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
      name: 'Te Tahi o Pipiri',
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
        name: 'Te Tahi o Pipiri',
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
        name: 'Te Tahi o Pipiri',
        anchorDate: new Date('2026-06-15T00:00:00Z'),
        reason: 'No moonrise data found for Whiro date',
      },
    ]);
  });

  it('returns an empty year timeline instead of failing when new moon anchors cannot be loaded', async () => {
    const service = new MaramatakaService({
      astronomyProvider: {
        getNewMoons: jest
          .fn()
          .mockRejectedValue(new Error('phase unavailable')),
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
      { index: 3, name: 'Hoata', version: 'mita-te-tai-best' as const },
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
        {
          occursAt: new Date('2026-01-01T06:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-01-03T06:00:00Z'),
          source: 'astronomy-engine',
        },
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
      { index: 3, name: 'Hoata', version: 'mita-te-tai-best' as const },
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
              {
                occursAt: new Date('2026-01-01T01:00:00Z'),
                source: 'astronomy-engine',
              },
              {
                occursAt: new Date('2026-01-04T01:00:00Z'),
                source: 'astronomy-engine',
              },
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
      createService().getCurrentNight(
        location,
        new Date('2026-01-02T05:00:00Z'),
      ),
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

  it('keeps the fixed sequence when Full Moon occurs on the 15th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-01-01T06:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-01-31T06:00:00Z'),
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
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              occursAt: new Date('2026-01-15T12:00:00Z'),
              source: 'astronomy-engine',
            },
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
    expect(month.nights[14].mata.name).toBe('Turu');
    expect(
      month.nights.filter((night) => night.mata.name === 'Ōhua'),
    ).toHaveLength(1);
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Mutuwhenua');
  });

  it('keeps the fixed sequence when Full Moon occurs on the 16th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-01-01T06:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-01-31T06:00:00Z'),
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
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              occursAt: new Date('2026-01-16T12:00:00Z'),
              source: 'astronomy-engine',
            },
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
      'Turu',
      'Rākaunui',
    ]);
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Mutuwhenua');
  });

  it('keeps the fixed sequence when Full Moon occurs on the 17th interval', async () => {
    const moonRises = Array.from({ length: 34 }, (_, index) =>
      createMoonRiseAtOffset('2026-01-01', index),
    );
    const getNewMoons = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          occursAt: new Date('2026-01-01T06:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          occursAt: new Date('2026-01-31T06:00:00Z'),
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
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              occursAt: new Date('2026-01-17T12:00:00Z'),
              source: 'astronomy-engine',
            },
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
      'Turu',
      'Rākaunui',
      'Rākaumatohi',
    ]);
    expect(month.nights[month.nights.length - 1].mata.name).toBe('Mutuwhenua');
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
        {
          occursAt: new Date('2026-01-01T06:00:00Z'),
          source: 'astronomy-engine',
        },
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
        {
          occursAt: new Date('2025-12-31T23:30:00Z'),
          source: 'astronomy-engine',
        },
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
            {
              occursAt: new Date('2025-12-30T06:00:00Z'),
              source: 'astronomy-engine',
            },
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
            {
              occursAt: new Date('2025-12-30T06:00:00Z'),
              source: 'astronomy-engine',
            },
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
            {
              occursAt: new Date('2025-12-30T06:00:00Z'),
              source: 'astronomy-engine',
            },
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
            {
              occursAt: new Date('2025-12-30T06:00:00Z'),
              source: 'astronomy-engine',
            },
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
