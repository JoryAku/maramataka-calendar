import {
  BadRequestException,
  Controller,
  Get,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { findAstronomyProviderError } from '@maramataka-calendar/astronomy';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';
import {
  DateLocationQueryDto,
  DateTimeLocationQueryDto,
} from './api-query.dto';
import {
  MoonDetailsResponseDto,
  TodayMaramatakaNightResponseDto,
  toMoonDetailsResponse,
  toTodayMaramatakaNightResponse,
} from './maramataka-response.dto';

@Controller('maramataka')
export class MaramatakaController {
  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('month')
  async getMonth(
    @Query() query: DateLocationQueryDto,
  ): Promise<MaramatakaMonth> {
    const { date, location } = this.validateDateLocationQuery(query);

    return this.handleAstronomyErrors(() =>
      this.maramatakaService.getMonth(location, date),
    );
  }

  @Get('cycle')
  async getCycle(
    @Query() query: DateLocationQueryDto,
  ): Promise<MaramatakaCycleDetails> {
    const { date, location } = this.validateDateLocationQuery(query);
    const cycle = await this.handleAstronomyErrors(() =>
      this.maramatakaService.getCycleDetails(location, date),
    );

    if (!cycle) {
      throw new BadRequestException(
        'No Maramataka cycle found for supplied date and location',
      );
    }

    return cycle;
  }

  @Get('today')
  async getToday(
    @Query() query: DateTimeLocationQueryDto,
  ): Promise<TodayMaramatakaNightResponseDto> {
    const { date, location } = this.validateDateTimeLocationQuery(query);
    const currentNight = await this.handleAstronomyErrors(() =>
      this.maramatakaService.getCurrentNight(location, date),
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
    const details = await this.handleAstronomyErrors(() =>
      this.maramatakaService.getMoonDetails(location, date),
    );

    return toMoonDetailsResponse(details);
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
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const astronomyError = findAstronomyProviderError(error);
      if (astronomyError) {
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
