import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Logger,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { findAstronomyProviderError } from '@maramataka-calendar/astronomy';
import {
  MaramatakaService,
  MaramatakaYear,
} from '@maramataka-calendar/maramataka-domain';
import { DateLocationQueryDto, YearQueryDto } from './api-query.dto';
import {
  DawnSkyResponseDto,
  MaramatakaPageResponseDto,
  StarMarkerResponseDto,
  toDawnSkyResponse,
  toMoonDetailsResponse,
  toStarMarkersResponse,
} from './maramataka-response.dto';
import {
  dawnSkySchema,
  maramatakaPageResponseSchema,
  maramatakaYearResponseSchema,
  starMarkerSchema,
} from './maramataka-openapi.schemas';

const MARAMATAKA_CACHE_CONTROL =
  'public, max-age=900, stale-while-revalidate=3600';
const MARAMATAKA_CACHE_RESPONSE_HEADER = {
  description: 'Shared maramataka response cache policy.',
  schema: {
    type: 'string',
    example: MARAMATAKA_CACHE_CONTROL,
  },
};

@ApiTags('maramataka')
@Controller('maramataka')
export class MaramatakaController {
  private readonly logger = new Logger(MaramatakaController.name);

  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('page')
  @Header('Cache-Control', MARAMATAKA_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get shared maramataka page data',
    description:
      'Returns the current cycle details and moon details for the selected local date and location.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-07-05',
    description: 'Local date in YYYY-MM-DD format.',
  })
  @ApiQuery({
    name: 'instant',
    required: false,
    example: '2026-07-04T20:45:00.000Z',
    description:
      'Optional exact instant used to resolve the current mata. The local date is still supplied in date for display/cache grouping.',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'wellington',
    description:
      'Preset location id. Use this instead of lat/lon/timezone for known places.',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    example: '-41.2865',
    description: 'Latitude for a custom location.',
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    example: '174.7762',
    description: 'Longitude for a custom location.',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    example: 'Pacific/Auckland',
    description: 'IANA timezone for a custom location.',
  })
  @ApiOkResponse({
    description:
      'Current cycle and moon details, including the API-safe rule-set summary.',
    headers: {
      'Cache-Control': MARAMATAKA_CACHE_RESPONSE_HEADER,
    },
    schema: maramatakaPageResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date or missing custom location fields.',
  })
  @ApiNotFoundResponse({ description: 'Unknown preset location id.' })
  @ApiServiceUnavailableResponse({
    description: 'Astronomy provider data is unavailable.',
  })
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
  @Header('Cache-Control', MARAMATAKA_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get a maramataka year',
    description:
      'Returns the calculated solar/star/lunar year that contains the selected local date. Timeline events are included by default.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-07-05',
    description: 'Local date in YYYY-MM-DD format.',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'wellington',
    description:
      'Preset location id. Use this instead of lat/lon/timezone for known places.',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    example: '-41.2865',
    description: 'Latitude for a custom location.',
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    example: '174.7762',
    description: 'Longitude for a custom location.',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    example: 'Pacific/Auckland',
    description: 'IANA timezone for a custom location.',
  })
  @ApiQuery({
    name: 'includeTimelineEvents',
    required: false,
    enum: ['true', 'false'],
    example: 'true',
    description:
      'Set to false for a lighter year response without timeline events.',
  })
  @ApiOkResponse({
    description:
      'Calculated maramataka year, month boundaries, optional timeline events, and rule-set summary.',
    headers: {
      'Cache-Control': MARAMATAKA_CACHE_RESPONSE_HEADER,
    },
    schema: maramatakaYearResponseSchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date, boolean, or missing custom location fields.',
  })
  @ApiNotFoundResponse({ description: 'Unknown preset location id.' })
  @ApiServiceUnavailableResponse({
    description: 'Astronomy provider data is unavailable.',
  })
  async getYear(@Query() query: YearQueryDto): Promise<MaramatakaYear> {
    const { date, location, includeTimelineEvents } = Object.assign(
      new YearQueryDto(),
      query,
    ).validate();

    return this.handleAstronomyErrors(
      'maramataka.year',
      () =>
        this.maramatakaService.getYear(location, date, {
          includeTimelineEvents,
        }),
      {
        ...this.profileContext(query, date),
        includeTimelineEvents: String(includeTimelineEvents),
      },
    );
  }

  @Get('star-markers')
  @Header('Cache-Control', MARAMATAKA_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get dawn sky star markers',
    description:
      'Returns configured star and body visibility details for the selected local date and location.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-07-05',
    description: 'Local date in YYYY-MM-DD format.',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'wellington',
    description:
      'Preset location id. Use this instead of lat/lon/timezone for known places.',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    example: '-41.2865',
    description: 'Latitude for a custom location.',
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    example: '174.7762',
    description: 'Longitude for a custom location.',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    example: 'Pacific/Auckland',
    description: 'IANA timezone for a custom location.',
  })
  @ApiOkResponse({
    description:
      'Configured dawn sky marker details, ordered for frontend display.',
    headers: {
      'Cache-Control': MARAMATAKA_CACHE_RESPONSE_HEADER,
    },
    schema: {
      type: 'array',
      items: starMarkerSchema,
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid date or missing custom location fields.',
  })
  @ApiNotFoundResponse({ description: 'Unknown preset location id.' })
  @ApiServiceUnavailableResponse({
    description: 'Astronomy provider data is unavailable.',
  })
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

  @Get('dawn-sky')
  @Header('Cache-Control', MARAMATAKA_CACHE_CONTROL)
  @ApiOperation({
    summary: 'Get dawn sky with Sun path',
    description:
      'Returns configured dawn sky marker details plus the sampled path of the rising Sun for the selected local date and location.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    example: '2026-07-05',
    description: 'Local date in YYYY-MM-DD format.',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    example: 'wellington',
    description:
      'Preset location id. Use this instead of lat/lon/timezone for known places.',
  })
  @ApiQuery({
    name: 'lat',
    required: false,
    example: '-41.2865',
    description: 'Latitude for a custom location.',
  })
  @ApiQuery({
    name: 'lon',
    required: false,
    example: '174.7762',
    description: 'Longitude for a custom location.',
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    example: 'Pacific/Auckland',
    description: 'IANA timezone for a custom location.',
  })
  @ApiOkResponse({
    description:
      'Configured dawn sky marker details and sampled Sun path, ordered for frontend display.',
    headers: {
      'Cache-Control': MARAMATAKA_CACHE_RESPONSE_HEADER,
    },
    schema: dawnSkySchema,
  })
  @ApiBadRequestResponse({
    description: 'Invalid date or missing custom location fields.',
  })
  @ApiNotFoundResponse({ description: 'Unknown preset location id.' })
  @ApiServiceUnavailableResponse({
    description: 'Astronomy provider data is unavailable.',
  })
  async getDawnSky(
    @Query() query: DateLocationQueryDto,
  ): Promise<DawnSkyResponseDto> {
    const { date, location } = this.validateDateLocationQuery(query);
    const dawnSky = await this.handleAstronomyErrors(
      'maramataka.dawn-sky',
      () => this.maramatakaService.getDawnSky(location, date),
      this.profileContext(query, date),
    );

    return toDawnSkyResponse(dawnSky);
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
