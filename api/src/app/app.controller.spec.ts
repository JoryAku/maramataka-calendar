import { Test, TestingModule } from '@nestjs/testing';
import { AstronomyProviderError } from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  const maramatakaService = {
    getMoonDetails: jest.fn(),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: MaramatakaService,
          useValue: maramatakaService,
        },
      ],
    }).compile();
  });

  beforeEach(() => {
    maramatakaService.getMoonDetails.mockReset();
    maramatakaService.getMoonDetails.mockResolvedValue({
      date: '2026-06-25',
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.25,
      lunarAgeDays: 2.5,
      distanceKm: null,
      unavailable: ['distanceKm'],
      source: 'stub',
    });
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toEqual({ message: 'Hello API' });
    });
  });

  describe('getHealth', () => {
    it('should return the legacy liveness health status', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'maramataka-api',
      });
    });
  });

  describe('getLiveness', () => {
    it('returns app liveness without checking providers', () => {
      const appController = app.get<AppController>(AppController);

      expect(appController.getLiveness()).toEqual({
        status: 'ok',
        service: 'maramataka-api',
      });
      expect(maramatakaService.getMoonDetails).not.toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('returns readiness when astronomy is available', async () => {
      const appController = app.get<AppController>(AppController);

      await expect(appController.getReadiness()).resolves.toEqual({
        status: 'ok',
        service: 'maramataka-api',
        checks: {
          app: 'ok',
          astronomyProvider: 'ok',
        },
      });
    });

    it('returns 503 when astronomy is unavailable', async () => {
      const appController = app.get<AppController>(AppController);
      maramatakaService.getMoonDetails.mockRejectedValue(
        new AstronomyProviderError('usno', 'request-failed', 'USNO unavailable'),
      );

      await expect(appController.getReadiness()).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 'unavailable',
          provider: 'usno',
          code: 'request-failed',
        }),
      });
    });
  });
});
