import axios from 'axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { AstronomyProviderError } from '@maramataka-calendar/astronomy';
import {
  CurrentMaramatakaNight,
  MaramatakaMonth,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
  MaramatakaService,
  summarizeRuleSet,
} from '@maramataka-calendar/maramataka-domain';
import { MaramatakaController } from './maramataka.controller';

describe('MaramatakaController', () => {
  let app: INestApplication;
  let baseUrl: string;
  let getMonthMock: jest.Mock;
  let getCurrentNightMock: jest.Mock;
  let getMoonDetailsMock: jest.Mock;

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
    getMoonDetailsMock = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MaramatakaController],
      providers: [
        {
          provide: MaramatakaService,
          useValue: {
            getMonth: getMonthMock,
            getCurrentNight: getCurrentNightMock,
            getMoonDetails: getMoonDetailsMock,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    getMonthMock.mockReset();
    getCurrentNightMock.mockReset();
    getMoonDetailsMock.mockReset();
    useMonthBackedCurrentNightMock();
  });

  afterAll(async () => {
    await app.close();
  });

  const ruleSet = summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET);

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
          name: 'Ohoata',
          version: 'mita-te-tai-best',
        },
        startsAt: new Date('2026-01-03T07:45:00.000Z'),
        endsAt: new Date('2026-01-04T07:44:00.000Z'),
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
        'usno',
        'request-timeout',
        'USNO moonrise request timed out after 10000ms',
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
    expect(response.data).toEqual({
      message: 'Astronomy data is currently unavailable',
      provider: 'usno',
      code: 'request-timeout',
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
        name: 'Ohoata',
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
        lunarAgeDays: null,
        distanceKm: null,
        closestPhase: {
          phase: 'Full Moon',
          occursAt: '2026-01-03T10:03:00.000Z',
          source: 'usno',
        },
        moonrise: {
          occursAt: '2026-01-01T05:57:00.000Z',
          source: 'usno',
        },
        moonset: {
          occursAt: '2025-12-31T13:50:00.000Z',
          source: 'usno',
        },
        transit: {
          occursAt: '2026-01-01T10:21:00.000Z',
          source: 'usno',
        },
        unavailable: ['lunarAgeDays', 'distanceKm'],
        source: 'usno',
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
});
