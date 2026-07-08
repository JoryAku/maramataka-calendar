import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Logger,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { findAstronomyProviderError } from '@maramataka-calendar/astronomy';
import {
  MaramatakaService,
  MaramatakaYear,
} from '@maramataka-calendar/maramataka-domain';
import { DateLocationQueryDto } from './api-query.dto';
import {
  MaramatakaPageResponseDto,
  StarMarkerResponseDto,
  toMoonDetailsResponse,
  toStarMarkersResponse,
} from './maramataka-response.dto';

@Controller('maramataka')
export class MaramatakaController {
  private readonly logger = new Logger(MaramatakaController.name);

  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('page')
  @Header('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600')
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

  @Get('year')
  @Header('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600')
  async getYear(@Query() query: DateLocationQueryDto): Promise<MaramatakaYear> {
    const { date, location } = this.validateDateLocationQuery(query);

    return this.handleAstronomyErrors(
      'maramataka.year',
      () => this.maramatakaService.getYear(location, date),
      this.profileContext(query, date),
    );
  }

  @Get('star-markers')
  @Header('Cache-Control', 'public, max-age=900, stale-while-revalidate=3600')
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
    query: DateLocationQueryDto,
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
