import axios from 'axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import {
  AstronomyProviderError,
  StarMarker,
} from '@maramataka-calendar/astronomy';
import {
  CurrentMaramatakaNight,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaYear,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
  MaramatakaService,
  summarizeRuleSet,
} from '@maramataka-calendar/maramataka-domain';
import { MaramatakaController } from './maramataka.controller';
import { ApiExceptionFilter } from './api-exception.filter';

describe('MaramatakaController', () => {
  let app: INestApplication;
  let baseUrl: string;
  let getMonthMock: jest.Mock;
  let getCurrentNightMock: jest.Mock;
  let getCycleDetailsMock: jest.Mock;
  let getYearMock: jest.Mock;
  let getMoonDetailsMock: jest.Mock;
  let getStarMarkersMock: jest.Mock;

  const useMonthBackedCurrentNightMock = () => {
    getCurrentNightMock.mockImplementation(async (location, date: Date) => {
      const month = (await getMonthMock(location, date)) as MaramatakaMonth;
      const night = month.nights.find(
        (candidate) =>
          candidate.startsAt.getTime() <= date.getTime() &&
          date.getTime() < candidate.endsAt.getTime(),
      );

      return night
        ? ({
            version: month.version,
            ruleSet: month.ruleSet,
            night,
          } satisfies CurrentMaramatakaNight)
        : undefined;
    });
  };

  beforeAll(async () => {
    getMonthMock = jest.fn();
    getCurrentNightMock = jest.fn();
    useMonthBackedCurrentNightMock();
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
            getMonth: getMonthMock,
            getCurrentNight: getCurrentNightMock,
            getCycleDetails: getCycleDetailsMock,
            getYear: getYearMock,
            getMoonDetails: getMoonDetailsMock,
            getStarMarkers: getStarMarkersMock,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    getMonthMock.mockReset();
    getCurrentNightMock.mockReset();
    getCycleDetailsMock.mockReset();
    getYearMock.mockReset();
    getMoonDetailsMock.mockReset();
    getStarMarkersMock.mockReset();
    useMonthBackedCurrentNightMock();
  });

  afterAll(async () => {
    await app.close();
  });

  const ruleSet = JSON.parse(
    JSON.stringify(summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET)),
  ) as ReturnType<typeof summarizeRuleSet>;

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

  it('returns HTTP 200 for a valid request', async () => {
    getMonthMock.mockResolvedValue({
      version: 'mita-te-tai-best',
      ruleSet,
      whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
      nights: [],
    });

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
      expect(response.data).toEqual({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: '2026-01-10T06:45:00.000Z',
        nights: [],
    });
  });

  it('returns HTTP 400 for invalid query parameters', async () => {
    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: 'not-a-date',
        lat: 'oops',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    expect(response.data).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'date must be in YYYY-MM-DD format',
        path: expect.stringContaining('/maramataka/month'),
        timestamp: expect.any(String),
      }),
    );
    expect(response.data.message).toBe('date must be in YYYY-MM-DD format');
    expect(getMonthMock).not.toHaveBeenCalled();
  });

  it('returns HTTP 400 when date includes time or timezone', async () => {
    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01T12:00:00+13:00',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('date must be in YYYY-MM-DD format');
    expect(getMonthMock).not.toHaveBeenCalled();
  });

  it('returns HTTP 400 when timezone is not an IANA timezone', async () => {
    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Not/AZone',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'timezone must be a valid IANA timezone',
    );
    expect(getMonthMock).not.toHaveBeenCalled();
  });

  it('calls service with expected date and location', async () => {
    getMonthMock.mockResolvedValue({
      version: 'mita-te-tai-best',
      whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
      nights: [],
    });

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
    expect(getMonthMock).toHaveBeenCalledTimes(1);

    const [locationArg, dateArg] = getMonthMock.mock.calls[0] as [
      { latitude: number; longitude: number; timezone: string },
      Date,
    ];

    expect(locationArg).toEqual({
      latitude: -41.2865,
      longitude: 174.7762,
      timezone: 'Pacific/Auckland',
    });
    expect(dateArg).toBeInstanceOf(Date);
    expect(dateArg.toISOString()).toBe('2025-12-31T23:00:00.000Z');
  });

  it('propagates service failures as HTTP 500', async () => {
    getMonthMock.mockRejectedValue(new Error('upstream failure'));

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(500);
    expect(response.data.message).toBe('Internal server error');
  });

  it('returns HTTP 503 for astronomy provider failures', async () => {
    getMonthMock.mockRejectedValue(
      new AstronomyProviderError(
        'astronomy-engine',
        'request-timeout',
        'Astronomy Engine moonrise request timed out after 10000ms',
      ),
    );

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        timezone: 'Pacific/Auckland',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(503);
    expect(response.data).toEqual(
      expect.objectContaining({
        statusCode: 503,
        message: 'Astronomy data is currently unavailable',
        provider: 'astronomy-engine',
        code: 'request-timeout',
      }),
    );
  });

  describe('GET /maramataka/cycle', () => {
    it('returns cycle metadata and anchor points for the selected date', async () => {
      getCycleDetailsMock.mockResolvedValue(createCycleFixture());

      const response = await axios.get(`${baseUrl}/maramataka/cycle`, {
        params: {
          date: '2026-01-02',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        version: 'mita-te-tai-best',
        ruleSet,
        timezone: 'Pacific/Auckland',
        currentMataIndex: 2,
        currentNight: {
          mata: {
            index: 2,
            name: 'Tirea',
            version: 'mita-te-tai-best',
          },
          startsAt: '2026-01-02T07:46:00.000Z',
          endsAt: '2026-01-03T07:45:00.000Z',
        },
        anchors: {
          whiro: {
            type: 'whiro',
            label: 'Whiro / Kohititanga',
            occursAt: '2026-01-01T07:47:00.000Z',
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
            occursAt: '2026-01-02T08:00:00.000Z',
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
            occursAt: '2026-01-04T07:44:00.000Z',
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
      });
      expect(getCycleDetailsMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getCycleDetailsMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];
      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2026-01-01T23:00:00.000Z');
    });

    it('returns HTTP 400 when no cycle is available', async () => {
      getCycleDetailsMock.mockResolvedValue(undefined);

      const response = await axios.get(`${baseUrl}/maramataka/cycle`, {
        params: {
          date: '2026-01-02',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'No Maramataka cycle found for supplied date and location',
      );
    });
  });

  describe('GET /maramataka/year', () => {
    it('returns year timeline months for the selected date', async () => {
      getYearMock.mockResolvedValue(createYearFixture());

      const response = await axios.get(`${baseUrl}/maramataka/year`, {
        params: {
          date: '2026-01-02',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        version: 'mita-te-tai-best',
        ruleSet,
        year: 2026,
        timezone: 'Pacific/Auckland',
        startsAt: '2025-12-31T11:00:00.000Z',
        endsAt: '2026-12-31T11:00:00.000Z',
        months: [
          {
            sequence: 1,
            name: 'Marama 1',
            startsAt: '2026-01-01T07:47:00.000Z',
            endsAt: '2026-01-30T07:47:00.000Z',
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
      ];
      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2026-01-01T23:00:00.000Z');
    });
  });

  describe('GET /maramataka/today', () => {
    it('returns HTTP 200 for a valid request', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T21:00:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        ruleSet,
        mata: {
          index: 1,
          name: 'Whiro',
        },
        startsAt: '2026-01-01T07:47:00.000Z',
        endsAt: '2026-01-02T07:46:00.000Z',
      });
    });

    it('returns Whiro without overlap at the next Whiro boundary', async () => {
      getCurrentNightMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        ruleSet,
        night: {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
          startsAt: new Date('2026-01-02T07:46:00.000Z'),
          endsAt: new Date('2026-01-03T07:45:00.000Z'),
        },
      });

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-02T20:46:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        ruleSet,
        mata: {
          index: 1,
          name: 'Whiro',
        },
        startsAt: '2026-01-02T07:46:00.000Z',
        endsAt: '2026-01-03T07:45:00.000Z',
      });
    });

    it('returns HTTP 400 for invalid query parameters', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: 'bad-date',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'dateTime must be in YYYY-MM-DDTHH:mm:ss format',
      );
      expect(getMonthMock).not.toHaveBeenCalled();
    });

    it('returns the correct Maramataka night for the supplied date-time', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-03T21:00:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.mata).toEqual({
        index: 3,
        name: 'Hoata',
      });
    });

    it('returns the current night exactly at startsAt', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.mata).toEqual({
        index: 1,
        name: 'Whiro',
      });
    });

    it('returns the current night exactly before endsAt', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-02T20:45:59',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.mata).toEqual({
        index: 1,
        name: 'Whiro',
      });
    });

    it('returns the next night exactly at endsAt', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-02T20:46:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.mata).toEqual({
        index: 2,
        name: 'Tirea',
      });
    });

    it('returns HTTP 400 when no Maramataka night matches the supplied date-time', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-04T20:44:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'No Maramataka night found for supplied date and location',
      );
      expect(getMonthMock).toHaveBeenCalledTimes(1);
    });

    it('calls service with expected date-time and location for today endpoint', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getCurrentNightMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getCurrentNightMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg).toBeInstanceOf(Date);
      expect(dateArg.toISOString()).toBe('2026-01-01T07:47:00.000Z');
    });

    it('propagates service failures as HTTP 500', async () => {
      getMonthMock.mockRejectedValue(new Error('upstream failure'));

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T21:00:00',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(500);
      expect(response.data.message).toBe('Internal server error');
    });

    it('resolves named location and returns correct night', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.mata).toEqual({
        index: 1,
        name: 'Whiro',
      });
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
    });

    it('resolves auckland location correctly', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          location: 'auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -37.0082,
        longitude: 174.6645,
        timezone: 'Pacific/Auckland',
      });
    });

    it('parses winter named-location requests using the location timezone', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-06-01T07:00:00.000Z'),
        nights: [
          {
            mata: {
              index: 1,
              name: 'Whiro',
              version: 'mita-te-tai-best',
            },
            startsAt: new Date('2026-06-01T07:00:00.000Z'),
            endsAt: new Date('2026-06-02T06:59:00.000Z'),
          },
        ],
      });

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-06-01T20:00:00',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2026-06-01T08:00:00.000Z');
    });

    it('returns HTTP 400 for invalid local datetime in DST spring-forward gap', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-09-27T02:30:00',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'date must be a valid local date-time',
      );
      expect(getMonthMock).not.toHaveBeenCalled();
    });

    it('returns HTTP 404 for unknown location', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          location: 'unknown-place',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
      expect(response.data.message).toBe('Unknown location: unknown-place');
      expect(getMonthMock).not.toHaveBeenCalled();
    });

    it('requires either location or all coordinates', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T20:47:00',
          lat: '-41.2865',
          lon: '174.7762',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'Either location parameter or all of lat, lon, and timezone parameters are required',
      );
      expect(getMonthMock).not.toHaveBeenCalled();
    });
  });

  describe('GET /maramataka/month with location parameter', () => {
    it('resolves named location and returns month data', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
        nights: [],
      });

      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2025-12-31T23:00:00.000Z');
    });

    it('resolves christchurch location correctly', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
        nights: [],
      });

      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          location: 'christchurch',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -43.5321,
        longitude: 172.6362,
        timezone: 'Pacific/Auckland',
      });
    });

    it('returns HTTP 404 for unknown location in month endpoint', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          location: 'atlantis',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(404);
      expect(response.data.message).toBe('Unknown location: atlantis');
      expect(getMonthMock).not.toHaveBeenCalled();
    });

    it('requires either location or all coordinates in month endpoint', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          lat: '-41.2865',
          lon: '174.7762',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'Either location parameter or all of lat, lon, and timezone parameters are required',
      );
      expect(getMonthMock).not.toHaveBeenCalled();
    });

    it('prefers location parameter over coordinates', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
        nights: [],
      });

      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          location: 'auckland',
          lat: '-41.2865',
          lon: '174.7762',
          timezone: 'Pacific/Auckland',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -37.0082,
        longitude: 174.6645,
        timezone: 'Pacific/Auckland',
      });
    });

    it('resolves gisborne location correctly', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
        nights: [],
      });

      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-01-01',
          location: 'gisborne',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -38.6624,
        longitude: 178.0097,
        timezone: 'Pacific/Auckland',
      });
    });

    it('passes named-location timezone through for winter month requests', async () => {
      getMonthMock.mockResolvedValue({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-06-10T06:45:00Z'),
        nights: [],
      });

      const response = await axios.get(`${baseUrl}/maramataka/month`, {
        params: {
          date: '2026-06-01',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
    });
  });

  describe('GET /maramataka/moon-details', () => {
    it('returns moon tracker details for a valid request', async () => {
      getMoonDetailsMock.mockResolvedValue({
        date: '2026-01-01',
        phase: 'Waxing Gibbous',
        fractionIlluminated: 0.91,
        lunarAgeDays: 11.89,
        lunarAgeSource: 'astronomy-engine moon phases',
        closestPhase: {
          phase: 'Full Moon',
          occursAt: new Date('2026-01-03T10:03:00.000Z'),
          source: 'astronomy-engine',
        },
        moonrise: {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T05:57:00.000Z'),
          source: 'astronomy-engine',
        },
        moonset: {
          date: '2026-01-01',
          setsAt: new Date('2025-12-31T13:50:00.000Z'),
          source: 'astronomy-engine',
        },
        transit: {
          date: '2026-01-01',
          transitsAt: new Date('2026-01-01T10:21:00.000Z'),
          source: 'astronomy-engine',
        },
        source: 'astronomy-engine',
      });

      const response = await axios.get(`${baseUrl}/maramataka/moon-details`, {
        params: {
          date: '2026-01-01',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        date: '2026-01-01',
        phase: 'Waxing Gibbous',
        fractionIlluminated: 0.91,
        lunarAgeDays: 11.89,
        lunarAgeSource: 'astronomy-engine moon phases',
        distanceKm: null,
        closestPhase: {
          phase: 'Full Moon',
          occursAt: '2026-01-03T10:03:00.000Z',
          source: 'astronomy-engine',
        },
        moonrise: {
          occursAt: '2026-01-01T05:57:00.000Z',
          source: 'astronomy-engine',
        },
        moonset: {
          occursAt: '2025-12-31T13:50:00.000Z',
          source: 'astronomy-engine',
        },
        transit: {
          occursAt: '2026-01-01T10:21:00.000Z',
          source: 'astronomy-engine',
        },
        unavailable: ['distanceKm'],
        source: 'astronomy-engine',
      });
      expect(getMoonDetailsMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getMoonDetailsMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezone: string },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezone: 'Pacific/Auckland',
      });
      expect(dateArg.toISOString()).toBe('2025-12-31T23:00:00.000Z');
    });

    it('returns HTTP 400 for invalid moon details date', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/moon-details`, {
        params: {
          date: 'bad-date',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe('date must be in YYYY-MM-DD format');
      expect(getMoonDetailsMock).not.toHaveBeenCalled();
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

      const response = await axios.get(`${baseUrl}/maramataka/star-markers`, {
        params: {
          date: '2026-06-25',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual([
        {
          ...starMarkers[0],
          observedAt: '2026-06-24T18:00:00.000Z',
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
      const response = await axios.get(`${baseUrl}/maramataka/star-markers`, {
        params: {
          date: 'bad-date',
          location: 'wellington',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe('date must be in YYYY-MM-DD format');
      expect(getStarMarkersMock).not.toHaveBeenCalled();
    });
  });
});
