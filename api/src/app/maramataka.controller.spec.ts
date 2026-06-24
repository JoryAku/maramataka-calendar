import axios from 'axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'node:net';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';
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
});
