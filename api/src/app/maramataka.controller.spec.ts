import { Test, TestingModule } from '@nestjs/testing';
import { StarMarker } from '@maramataka-calendar/astronomy';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaYear,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
  MaramatakaService,
  summarizeRuleSet,
} from '@maramataka-calendar/maramataka-domain';
import { MaramatakaController } from './maramataka.controller';
import { DateLocationQueryDto, YearQueryDto } from './api-query.dto';

describe('MaramatakaController', () => {
  let controller: MaramatakaController;
  let getCycleDetailsMock: jest.Mock;
  let getYearMock: jest.Mock;
  let getMoonDetailsMock: jest.Mock;
  let getStarMarkersMock: jest.Mock;

  beforeAll(async () => {
    getCycleDetailsMock = jest.fn();
    getYearMock = jest.fn();
    getMoonDetailsMock = jest.fn();
    getStarMarkersMock = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MaramatakaController],
      providers: [
        {
          provide: MaramatakaService,
          useValue: {
            getCycleDetails: getCycleDetailsMock,
            getYear: getYearMock,
            getMoonDetails: getMoonDetailsMock,
            getStarMarkers: getStarMarkersMock,
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(MaramatakaController);
  });

  afterEach(() => {
    getCycleDetailsMock.mockReset();
    getYearMock.mockReset();
    getMoonDetailsMock.mockReset();
    getStarMarkersMock.mockReset();
  });

  const ruleSet = JSON.parse(
    JSON.stringify(summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET)),
  ) as ReturnType<typeof summarizeRuleSet>;
  const dateLocationQuery = (
    query: Partial<DateLocationQueryDto>,
  ): DateLocationQueryDto => Object.assign(new DateLocationQueryDto(), query);
  const yearQuery = (query: Partial<YearQueryDto>): YearQueryDto =>
    Object.assign(new YearQueryDto(), query);

  const createMonthFixture = (): MaramatakaMonth => ({
    version: 'mita-te-tai-best',
    ruleSet,
    whiroStartsAt: new Date('2026-01-01T07:47:00.000Z'),
    nights: [
      {
        mata: {
          index: 1,
          name: 'Whiro',
          version: 'mita-te-tai-best',
        },
        startsAt: new Date('2026-01-01T07:47:00.000Z'),
        endsAt: new Date('2026-01-02T07:46:00.000Z'),
      },
      {
        mata: {
          index: 2,
          name: 'Tirea',
          version: 'mita-te-tai-best',
        },
        startsAt: new Date('2026-01-02T07:46:00.000Z'),
        endsAt: new Date('2026-01-03T07:45:00.000Z'),
      },
      {
        mata: {
          index: 3,
          name: 'Hoata',
          version: 'mita-te-tai-best',
        },
        startsAt: new Date('2026-01-03T07:45:00.000Z'),
        endsAt: new Date('2026-01-04T07:44:00.000Z'),
      },
    ],
  });

  const createCycleFixture = (): MaramatakaCycleDetails => {
    const month = createMonthFixture();

    return {
      version: month.version,
      ruleSet,
      timezone: 'Pacific/Auckland',
      currentMataIndex: 2,
      currentNight: month.nights[1],
      anchors: {
        whiro: {
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: month.whiroStartsAt,
          localDate: '2026-01-01',
          localTime: '20:47:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
        },
        fullMoon: {
          type: 'full-moon',
          label: 'Rākaunui / Full Moon',
          occursAt: new Date('2026-01-02T08:00:00.000Z'),
          localDate: '2026-01-02',
          localTime: '21:00:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine',
          mata: {
            index: 2,
            name: 'Tirea',
            version: 'mita-te-tai-best',
          },
        },
        nextWhiro: {
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: new Date('2026-01-04T07:44:00.000Z'),
          localDate: '2026-01-04',
          localTime: '20:44:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
        },
      },
      nights: month.nights,
    };
  };

  const createYearFixture = (): MaramatakaYear => ({
    version: 'mita-te-tai-best',
    ruleSet,
    year: 2026,
    timezone: 'Pacific/Auckland',
    startsAt: new Date('2025-12-31T11:00:00.000Z'),
    endsAt: new Date('2026-12-31T11:00:00.000Z'),
    diagnostics: [],
    events: [],
    months: [
      {
        sequence: 1,
        name: 'Marama 1',
        startsAt: new Date('2026-01-01T07:47:00.000Z'),
        endsAt: new Date('2026-01-30T07:47:00.000Z'),
        durationDays: 29,
        nightsCount: 29,
        repeatedMata: [],
        anchors: createCycleFixture().anchors,
      },
    ],
  });

  const createMoonDetailsFixture = () => ({
    date: '2026-01-02',
    phase: 'Waxing Crescent',
    fractionIlluminated: 0.17,
    lunarAgeDays: 2.5,
    lunarAgeSource: 'astronomy-engine moon phases',
    closestPhase: {
      phase: 'New Moon',
      occursAt: new Date('2026-01-01T18:03:00.000Z'),
      source: 'astronomy-engine',
    },
    moonrise: {
      date: '2026-01-02',
      risesAt: new Date('2026-01-02T07:46:00.000Z'),
      source: 'astronomy-engine',
    },
    moonset: {
      date: '2026-01-02',
      setsAt: new Date('2026-01-01T19:12:00.000Z'),
      source: 'astronomy-engine',
    },
    transit: {
      date: '2026-01-02',
      transitsAt: new Date('2026-01-02T12:41:00.000Z'),
      source: 'astronomy-engine',
    },
    source: 'astronomy-engine',
  });

  const createStarMarkersFixture = (): StarMarker[] => [
    {
      id: 'matariki',
      name: 'Matariki',
      type: 'asterism',
      englishName: 'Pleiades',
      description: 'Pleiades; year-start marker.',
      seasonalAssociation: 'Year-start marker',
      source: 'Living by the Stars',
      confidence: 'confirmed',
      observedAt: new Date('2026-01-02T17:00:00.000Z'),
      altitudeDegrees: 18,
      azimuthDegrees: 72,
      direction: 'ENE',
      visibility: 'visible',
      calculation: 'Dawn visibility window.',
    },
  ];

  describe('GET /maramataka/page', () => {
    it('returns the page payload for the selected date', async () => {
      getCycleDetailsMock.mockResolvedValue(createCycleFixture());
      getMoonDetailsMock.mockResolvedValue(createMoonDetailsFixture());
      getStarMarkersMock.mockResolvedValue(createStarMarkersFixture());

      const response = await controller.getPage(dateLocationQuery({
        date: '2026-01-02',
        location: 'wellington',
      }));

      expect(response).toMatchObject({
        cycle: {
          version: 'mita-te-tai-best',
          currentMataIndex: 2,
          currentNight: {
            mata: {
              index: 2,
              name: 'Tirea',
              version: 'mita-te-tai-best',
            },
          },
        },
        moonDetails: {
          date: '2026-01-02',
          phase: 'Waxing Crescent',
          lunarAgeDays: 2.5,
          distanceKm: null,
          moonrise: {
            occursAt: new Date('2026-01-02T07:46:00.000Z'),
          },
        },
      });
      expect(getCycleDetailsMock).toHaveBeenCalledTimes(1);
      expect(getMoonDetailsMock).toHaveBeenCalledTimes(1);
      expect(getYearMock).not.toHaveBeenCalled();
      expect(getStarMarkersMock).not.toHaveBeenCalled();
    });

    it('returns HTTP 400 when no cycle is available', async () => {
      getCycleDetailsMock.mockResolvedValue(undefined);
      getMoonDetailsMock.mockResolvedValue(createMoonDetailsFixture());
      getStarMarkersMock.mockResolvedValue(createStarMarkersFixture());

      await expect(
        controller.getPage(dateLocationQuery({
          date: '2026-01-02',
          location: 'wellington',
        })),
      ).rejects.toThrow(
        'No Maramataka cycle found for supplied date and location',
      );
    });
  });

  describe('GET /maramataka/year', () => {
    it('returns year timeline months for the selected date', async () => {
      getYearMock.mockResolvedValue(createYearFixture());

      const response = await controller.getYear(yearQuery({
        date: '2026-01-02',
        location: 'wellington',
      }));

      expect(response).toMatchObject({
        version: 'mita-te-tai-best',
        ruleSet,
        year: 2026,
        timezone: 'Pacific/Auckland',
        startsAt: new Date('2025-12-31T11:00:00.000Z'),
        endsAt: new Date('2026-12-31T11:00:00.000Z'),
        months: [
          {
            sequence: 1,
            name: 'Marama 1',
            startsAt: new Date('2026-01-01T07:47:00.000Z'),
            endsAt: new Date('2026-01-30T07:47:00.000Z'),
            durationDays: 29,
            nightsCount: 29,
            repeatedMata: [],
          },
        ],
      });
      expect(getYearMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getYearMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
        { includeTimelineEvents: boolean },
      ];
      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2026-01-01T23:00:00.000Z');
      expect(getYearMock.mock.calls[0]?.[2]).toEqual({
        includeTimelineEvents: true,
      });
    });

    it('can omit expensive timeline events for progressive loading', async () => {
      getYearMock.mockResolvedValue(createYearFixture());

      await controller.getYear(yearQuery({
        date: '2026-01-02',
        location: 'wellington',
        includeTimelineEvents: 'false',
      }));

      expect(getYearMock.mock.calls[0]?.[2]).toEqual({
        includeTimelineEvents: false,
      });
    });
  });

  describe('GET /maramataka/star-markers', () => {
    it('returns dawn sky star markers for a valid request', async () => {
      const starMarkers: StarMarker[] = [
        {
          id: 'whakaahu',
          name: 'Whakaahu',
          type: 'star',
          englishName: 'Castor',
          description: 'A dawn marker associated with late winter.',
          seasonalAssociation: 'Late winter / early spring marker.',
          source: 'Elsdon Best, The Maori Division of Time',
          sourceUrl:
            'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html',
          confidence: 'confirmed',
          observedAt: new Date('2026-06-24T18:00:00.000Z'),
          altitudeDegrees: 24,
          azimuthDegrees: 74,
          direction: 'E',
          visibility: 'prominent',
          calculation:
            'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
        },
      ];
      getStarMarkersMock.mockResolvedValue(starMarkers);

      const response = await controller.getStarMarkers(dateLocationQuery({
        date: '2026-06-25',
        location: 'wellington',
      }));

      expect(response).toEqual([
        {
          ...starMarkers[0],
        },
      ]);
      expect(getStarMarkersMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getStarMarkersMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2026-06-25T00:00:00.000Z');
    });

    it('returns HTTP 400 for invalid star marker date', async () => {
      await expect(
        controller.getStarMarkers(dateLocationQuery({
          date: 'bad-date',
          location: 'wellington',
        })),
      ).rejects.toThrow('date must be in YYYY-MM-DD format');
      expect(getStarMarkersMock).not.toHaveBeenCalled();
    });
  });
});
