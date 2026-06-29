import { Injectable } from '@nestjs/common';
import { findAstronomyProviderError } from '@maramataka-calendar/astronomy';
import { findLocationById } from '@maramataka-calendar/location';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';

export interface AppHealthResponse {
  status: 'ok';
  service: 'maramataka-api';
}

export interface AppReadinessResponse {
  status: 'ok' | 'unavailable';
  service: 'maramataka-api';
  checks: {
    app: 'ok';
    astronomyProvider: 'ok' | 'unavailable';
  };
  provider?: string;
  code?: string;
}

@Injectable()
export class AppService {
  constructor(private readonly maramatakaService: MaramatakaService) {}

  getData(): { message: string } {
    return { message: 'Hello API' };
  }

  getLiveness(): AppHealthResponse {
    return {
      status: 'ok',
      service: 'maramataka-api',
    };
  }

  async getReadiness(): Promise<AppReadinessResponse> {
    const wellington = findLocationById('wellington');
    if (!wellington) {
      return this.unavailableReadiness('location-registry', 'missing-wellington');
    }

    try {
      await this.maramatakaService.getMoonDetails(
        {
          latitude: wellington.latitude,
          longitude: wellington.longitude,
          timezone: wellington.timezone,
        },
        new Date(),
      );

      return {
        status: 'ok',
        service: 'maramataka-api',
        checks: {
          app: 'ok',
          astronomyProvider: 'ok',
        },
      };
    } catch (error) {
      const providerError = findAstronomyProviderError(error);

      return this.unavailableReadiness(
        providerError?.provider ?? 'astronomy-provider',
        providerError?.code ?? 'unknown',
      );
    }
  }

  private unavailableReadiness(
    provider: string,
    code: string,
  ): AppReadinessResponse {
    return {
      status: 'unavailable',
      service: 'maramataka-api',
      checks: {
        app: 'ok',
        astronomyProvider: 'unavailable',
      },
      provider,
      code,
    };
  }
}
