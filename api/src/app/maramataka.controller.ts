import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { findAstronomyProviderError } from '@maramataka-calendar/astronomy';
import {
  MaramatakaCycleDetails,
  MaramatakaService,
  MaramatakaYear,
} from '@maramataka-calendar/maramataka-domain';
import {
  DateLocationQueryDto,
  DateTimeLocationQueryDto,
} from './api-query.dto';
import {
  MaramatakaPageResponseDto,
  MoonDetailsResponseDto,
  StarMarkerResponseDto,
  TodayMaramatakaNightResponseDto,
  toMoonDetailsResponse,
  toStarMarkersResponse,
  toTodayMaramatakaNightResponse,
} from './maramataka-response.dto';

@Controller('maramataka')
export class MaramatakaController {
  private readonly logger = new Logger(MaramatakaController.name);

  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('page')
  async getPage(
    @Query() query: DateLocationQueryDto,
  ): Promise<MaramatakaPageResponseDto> {
    const { date, location } = this.validateDateLocationQuery(query);

    return this.handleAstronomyErrors(
      'maramataka.page',
      async () => {
        const [cycle, moonDetails] = await Promise.all([
          this.maramatakaService.getCycleDetails(location, date),
          this.maramatakaService.getMoonDetails(location, date),
        ]);

        if (!cycle) {
          throw new BadRequestException(
            'No Maramataka cycle found for supplied date and location',
          );
        }

        return {
          cycle,
          moonDetails: toMoonDetailsResponse(moonDetails),
        };
      },
      this.profileContext(query, date),
    );
  }

  @Get('cycle')
  async getCycle(
    @Query() query: DateLocationQueryDto,
  ): Promise<MaramatakaCycleDetails> {
    const { date, location } = this.validateDateLocationQuery(query);
    const cycle = await this.handleAstronomyErrors(
      'maramataka.cycle',
      () => this.maramatakaService.getCycleDetails(location, date),
      this.profileContext(query, date),
    );

    if (!cycle) {
      throw new BadRequestException(
        'No Maramataka cycle found for supplied date and location',
      );
    }

    return cycle;
  }

  @Get('year')
  async getYear(@Query() query: DateLocationQueryDto): Promise<MaramatakaYear> {
    const { date, location } = this.validateDateLocationQuery(query);

    return this.handleAstronomyErrors(
      'maramataka.year',
      () => this.maramatakaService.getYear(location, date),
      this.profileContext(query, date),
    );
  }

  @Get('today')
  async getToday(
    @Query() query: DateTimeLocationQueryDto,
  ): Promise<TodayMaramatakaNightResponseDto> {
    const { date, location } = this.validateDateTimeLocationQuery(query);
    const currentNight = await this.handleAstronomyErrors(
      'maramataka.today',
      () => this.maramatakaService.getCurrentNight(location, date),
      this.profileContext(query, date),
    );

    if (!currentNight) {
      throw new BadRequestException(
        'No Maramataka night found for supplied date and location',
      );
    }

    return toTodayMaramatakaNightResponse(currentNight);
  }

  @Get('moon-details')
  async getMoonDetails(
    @Query() query: DateLocationQueryDto,
  ): Promise<MoonDetailsResponseDto> {
    const { date, location } = this.validateDateLocationQuery(query);
    const details = await this.handleAstronomyErrors(
      'maramataka.moon-details',
      () => this.maramatakaService.getMoonDetails(location, date),
      this.profileContext(query, date),
    );

    return toMoonDetailsResponse(details);
  }

  @Get('star-markers')
  async getStarMarkers(
    @Query() query: DateLocationQueryDto,
  ): Promise<StarMarkerResponseDto[]> {
    const { date, location } = this.validateDateLocationQuery(query);
    const markers = await this.handleAstronomyErrors(
      'maramataka.star-markers',
      () => this.maramatakaService.getStarMarkers(location, date),
      this.profileContext(query, date),
    );

    return toStarMarkersResponse(markers);
  }

  private validateDateLocationQuery(
    query: DateLocationQueryDto,
  ): ReturnType<DateLocationQueryDto['validate']> {
    return Object.assign(new DateLocationQueryDto(), query).validate();
  }

  private validateDateTimeLocationQuery(
    query: DateTimeLocationQueryDto,
  ): ReturnType<DateTimeLocationQueryDto['validate']> {
    return Object.assign(new DateTimeLocationQueryDto(), query).validate();
  }

  private async handleAstronomyErrors<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: Record<string, string>,
  ): Promise<T> {
    const startedAt = performance.now();

    try {
      const result = await operation();
      this.logProfile(operationName, 'completed', startedAt, context);

      return result;
    } catch (error) {
      this.logProfile(operationName, 'failed', startedAt, context);

      const astronomyError = findAstronomyProviderError(error);
      if (astronomyError) {
        this.logger.error(
          JSON.stringify({
            event: 'astronomy_provider_failure',
            operation: operationName,
            provider: astronomyError.provider,
            code: astronomyError.code,
            message: astronomyError.message,
          }),
          astronomyError.stack,
        );

        throw new ServiceUnavailableException({
          message: 'Astronomy data is currently unavailable',
          provider: astronomyError.provider,
          code: astronomyError.code,
        });
      }

      throw error;
    }
  }

  private profileContext(
    query: DateLocationQueryDto | DateTimeLocationQueryDto,
    requestedAt: Date,
  ): Record<string, string> {
    return {
      location: query.location ?? 'coordinates',
      latitude: query.lat ?? '',
      longitude: query.lon ?? '',
      timezone: query.timezone ?? '',
      requestedAt: requestedAt.toISOString(),
    };
  }

  private logProfile(
    operation: string,
    status: 'completed' | 'failed',
    startedAt: number,
    context: Record<string, string>,
  ): void {
    if (process.env.MARAMATAKA_PROFILE !== '1') {
      return;
    }

    this.logger.log(
      JSON.stringify({
        event: 'maramataka_profile',
        operation,
        status,
        durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
        ...context,
      }),
    );
  }
}
