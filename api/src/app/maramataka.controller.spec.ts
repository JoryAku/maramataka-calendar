import axios from 'axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import {
  MaramatakaMonth,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';
import { MaramatakaController } from './maramataka.controller';

describe('MaramatakaController', () => {
  let app: INestApplication;
  let baseUrl: string;
  let getMonthMock: jest.Mock;

  beforeAll(async () => {
    getMonthMock = jest.fn();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MaramatakaController],
      providers: [
        {
          provide: MaramatakaService,
          useValue: {
            getMonth: getMonthMock,
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
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const createMonthFixture = (): MaramatakaMonth => ({
    version: 'mita-te-tai-best',
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
      whiroStartsAt: new Date('2026-01-10T06:45:00Z'),
      nights: [],
    });

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        tz: '13',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      version: 'mita-te-tai-best',
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
        tz: '13',
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
        tz: '13',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('date must be in YYYY-MM-DD format');
    expect(getMonthMock).not.toHaveBeenCalled();
  });

  it('returns HTTP 400 when tz is not a whole hour', async () => {
    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        tz: '5.5',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('tz must be a whole-hour offset');
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
        tz: '13',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(200);
    expect(getMonthMock).toHaveBeenCalledTimes(1);

    const [locationArg, dateArg] = getMonthMock.mock.calls[0] as [
      { latitude: number; longitude: number; timezoneOffset: number },
      Date,
    ];

    expect(locationArg).toEqual({
      latitude: -41.2865,
      longitude: 174.7762,
      timezoneOffset: 13,
    });
    expect(dateArg).toBeInstanceOf(Date);
    expect(dateArg.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('propagates service failures as HTTP 500', async () => {
    getMonthMock.mockRejectedValue(new Error('upstream failure'));

    const response = await axios.get(`${baseUrl}/maramataka/month`, {
      params: {
        date: '2026-01-01',
        lat: '-41.2865',
        lon: '174.7762',
        tz: '13',
      },
      validateStatus: () => true,
    });

    expect(response.status).toBe(500);
    expect(response.data.message).toBe('Internal server error');
  });

  describe('GET /maramataka/today', () => {
    it('returns HTTP 200 for a valid request', async () => {
      getMonthMock.mockResolvedValue(createMonthFixture());

      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: '2026-01-01T21:00:00',
          lat: '-41.2865',
          lon: '174.7762',
          tz: '13',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        mata: {
          index: 1,
          name: 'Whiro',
        },
        startsAt: '2026-01-01T07:47:00.000Z',
        endsAt: '2026-01-02T07:46:00.000Z',
      });
    });

    it('returns HTTP 400 for invalid query parameters', async () => {
      const response = await axios.get(`${baseUrl}/maramataka/today`, {
        params: {
          dateTime: 'bad-date',
          lat: '-41.2865',
          lon: '174.7762',
          tz: '13',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'dateTime must be in YYYY-MM-DDTHH:mm:ss format'
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
          tz: '13',
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
          tz: '13',
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
          tz: '13',
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
          tz: '13',
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
          tz: '13',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(400);
      expect(response.data.message).toBe(
        'No Maramataka night found for supplied date and location'
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
          tz: '13',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg, dateArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezoneOffset: 13,
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
          tz: '13',
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
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezoneOffset: 13,
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
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -37.0082,
        longitude: 174.6645,
        timezoneOffset: 13,
      });
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
        'Either location parameter or all of lat, lon, and tz parameters are required'
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
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -41.2865,
        longitude: 174.7762,
        timezoneOffset: 13,
      });
      expect(dateArg.toISOString()).toBe('2026-01-01T00:00:00.000Z');
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
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -43.5321,
        longitude: 172.6362,
        timezoneOffset: 13,
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
        'Either location parameter or all of lat, lon, and tz parameters are required'
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
          tz: '13',
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(getMonthMock).toHaveBeenCalledTimes(1);

      const [locationArg] = getMonthMock.mock.calls[0] as [
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -37.0082,
        longitude: 174.6645,
        timezoneOffset: 13,
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
        { latitude: number; longitude: number; timezoneOffset: number },
        Date,
      ];

      expect(locationArg).toEqual({
        latitude: -38.6624,
        longitude: 178.0097,
        timezoneOffset: 13,
      });
    });
  });
});
