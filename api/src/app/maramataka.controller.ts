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

  @Get('cycle')
  async getCycle(
    @Query() query: DateLocationQueryDto,
  ): Promise<MaramatakaCycleDetails> {
    const { date, location } = this.validateDateLocationQuery(query);
    const cycle = await this.handleAstronomyErrors('maramataka.cycle', () =>
      this.maramatakaService.getCycleDetails(location, date),
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

    return this.handleAstronomyErrors('maramataka.year', () =>
      this.maramatakaService.getYear(location, date),
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
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
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
}
