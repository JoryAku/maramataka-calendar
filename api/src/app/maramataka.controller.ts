import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  findAstronomyProviderError,
  Location,
  parseLocalDateTimeInTimezone,
  validateIanaTimezone,
} from '@maramataka-calendar/astronomy';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaRuleSetSummary,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';
import { findLocationById } from './locations';

interface TodayMaramatakaNightResponse {
  ruleSet: MaramatakaRuleSetSummary;
  mata: {
    index: number;
    name: string;
  };
  overlappingMata?: {
    mata: {
      index: number;
      name: string;
    };
    cycleStartsAt: Date;
    reason: 'new-moon-anchor';
  }[];
  startsAt: Date;
  endsAt: Date;
}

interface MoonDetailsResponse {
  date: string;
  phase: string;
  fractionIlluminated: number;
  lunarAgeDays: null;
  distanceKm: null;
  closestPhase?: {
    phase: string;
    occursAt: Date;
    source: string;
  };
  moonrise?: {
    occursAt: Date;
    source: string;
  };
  moonset?: {
    occursAt: Date;
    source: string;
  };
  transit?: {
    occursAt: Date;
    source: string;
  };
  unavailable: Array<'lunarAgeDays' | 'distanceKm'>;
  source: string;
}

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

@Controller('maramataka')
export class MaramatakaController {
  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('month')
  async getMonth(
    @Query('date') dateInput: string,
    @Query('location') locationInput?: string,
    @Query('lat') latInput?: string,
    @Query('lon') lonInput?: string,
    @Query('timezone') timezoneInput?: string,
  ): Promise<MaramatakaMonth> {
    const dateParts = this.parseDateParts(dateInput);
    const location = locationInput
      ? this.parseNamedLocation(locationInput)
      : this.parseCoordinatesOrThrow(latInput, lonInput, timezoneInput);
    const date = this.parseLocalDateForTimezone(dateParts, location.timezone);

    return this.handleAstronomyErrors(() =>
      this.maramatakaService.getMonth(location, date),
    );
  }

  @Get('cycle')
  async getCycle(
    @Query('date') dateInput: string,
    @Query('location') locationInput?: string,
    @Query('lat') latInput?: string,
    @Query('lon') lonInput?: string,
    @Query('timezone') timezoneInput?: string,
  ): Promise<MaramatakaCycleDetails> {
    const dateParts = this.parseDateParts(dateInput);
    const location = locationInput
      ? this.parseNamedLocation(locationInput)
      : this.parseCoordinatesOrThrow(latInput, lonInput, timezoneInput);
    const date = this.parseLocalDateForTimezone(dateParts, location.timezone);
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
    @Query('dateTime') dateTimeInput: string,
    @Query('location') locationInput?: string,
    @Query('lat') latInput?: string,
    @Query('lon') lonInput?: string,
    @Query('timezone') timezoneInput?: string,
  ): Promise<TodayMaramatakaNightResponse> {
    const { date, location } = locationInput
      ? this.parseNamedLocationDateTime(locationInput, dateTimeInput)
      : this.parseCoordinateDateTime(
          dateTimeInput,
          latInput,
          lonInput,
          timezoneInput,
        );
    const currentNight = await this.handleAstronomyErrors(() =>
      this.maramatakaService.getCurrentNight(location, date),
    );

    if (!currentNight) {
      throw new BadRequestException(
        'No Maramataka night found for supplied date and location',
      );
    }

    const { night } = currentNight;

    return {
      ruleSet: currentNight.ruleSet,
      mata: {
        index: night.mata.index,
        name: night.mata.name,
      },
      overlappingMata: night.overlappingMata?.map((overlap) => ({
        mata: {
          index: overlap.mata.index,
          name: overlap.mata.name,
        },
        cycleStartsAt: overlap.cycleStartsAt,
        reason: overlap.reason,
      })),
      startsAt: night.startsAt,
      endsAt: night.endsAt,
    };
  }

  @Get('moon-details')
  async getMoonDetails(
    @Query('date') dateInput: string,
    @Query('location') locationInput?: string,
    @Query('lat') latInput?: string,
    @Query('lon') lonInput?: string,
    @Query('timezone') timezoneInput?: string,
  ): Promise<MoonDetailsResponse> {
    const dateParts = this.parseDateParts(dateInput);
    const location = locationInput
      ? this.parseNamedLocation(locationInput)
      : this.parseCoordinatesOrThrow(latInput, lonInput, timezoneInput);
    const date = this.parseLocalDateForTimezone(dateParts, location.timezone);
    const details = await this.handleAstronomyErrors(() =>
      this.maramatakaService.getMoonDetails(location, date),
    );

    return {
      date: details.date,
      phase: details.phase,
      fractionIlluminated: details.fractionIlluminated,
      lunarAgeDays: null,
      distanceKm: null,
      closestPhase: details.closestPhase
        ? {
            phase: details.closestPhase.phase,
            occursAt: details.closestPhase.occursAt,
            source: details.closestPhase.source,
          }
        : undefined,
      moonrise: details.moonrise
        ? {
            occursAt: details.moonrise.risesAt,
            source: details.moonrise.source,
          }
        : undefined,
      moonset: details.moonset
        ? {
            occursAt: details.moonset.setsAt,
            source: details.moonset.source,
          }
        : undefined,
      transit: details.transit
        ? {
            occursAt: details.transit.transitsAt,
            source: details.transit.source,
          }
        : undefined,
      unavailable: ['lunarAgeDays', 'distanceKm'],
      source: details.source,
    };
  }

  private parseCoordinatesOrThrow(
    latInput?: string,
    lonInput?: string,
    timezoneInput?: string,
  ): Location {
    if (!latInput || !lonInput || !timezoneInput) {
      throw new BadRequestException(
        'Either location parameter or all of lat, lon, and timezone parameters are required',
      );
    }

    return this.parseLocation(latInput, lonInput, timezoneInput);
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

  private parseCoordinateDateTime(
    dateTimeInput: string,
    latInput?: string,
    lonInput?: string,
    timezoneInput?: string,
  ): { date: Date; location: Location } {
    const location = this.parseCoordinatesOrThrow(
      latInput,
      lonInput,
      timezoneInput,
    );
    const date = this.parseDateTime(dateTimeInput, location.timezone);

    return { date, location };
  }

  private parseNamedLocationDateTime(
    locationInput: string,
    dateTimeInput: string,
  ): { date: Date; location: Location } {
    const location = this.parseNamedLocation(locationInput);
    const date = this.parseDateTimeForTimezone(
      dateTimeInput,
      location.timezone,
    );

    return {
      date,
      location,
    };
  }

  private parseNamedLocation(locationInput: string): Location {
    const locationData = this.findNamedLocationOrThrow(locationInput);

    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timezone: locationData.timezone,
    };
  }

  private findNamedLocationOrThrow(locationInput: string): {
    latitude: number;
    longitude: number;
    timezone: string;
  } {
    const locationData = findLocationById(locationInput);
    if (!locationData) {
      throw new NotFoundException(`Unknown location: ${locationInput}`);
    }

    return locationData;
  }

  private parseLocation(
    latInput: string,
    lonInput: string,
    timezoneInput: string,
  ): Location {
    const latitude = this.parseNumber(latInput, 'lat');
    const longitude = this.parseNumber(lonInput, 'lon');

    this.validateLatitude(latitude);
    this.validateLongitude(longitude);
    this.validateTimezone(timezoneInput);

    return {
      latitude,
      longitude,
      timezone: timezoneInput,
    };
  }

  private parseDateTime(dateTimeInput: string, timezone: string): Date {
    return this.parseDateTimeForTimezone(dateTimeInput, timezone);
  }

  private parseDateTimeForTimezone(
    dateTimeInput: string,
    timezone: string,
  ): Date {
    const dateTimeParts = this.parseDateTimeParts(dateTimeInput);
    try {
      return parseLocalDateTimeInTimezone(dateTimeParts, timezone);
    } catch {
      throw new BadRequestException('date must be a valid local date-time');
    }
  }

  private parseLocalDateForTimezone(
    dateParts: LocalDateParts,
    timezone: string,
  ): Date {
    try {
      return parseLocalDateTimeInTimezone(
        {
          ...dateParts,
          hour: 12,
          minute: 0,
          second: 0,
        },
        timezone,
      );
    } catch {
      throw new BadRequestException('date must be a valid calendar date');
    }
  }

  private parseDateTimeParts(dateTimeInput: string): LocalDateTimeParts {
    if (!dateTimeInput) {
      throw new BadRequestException('dateTime query parameter is required');
    }

    const datePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
    const match = dateTimeInput.match(datePattern);
    if (!match) {
      throw new BadRequestException(
        'dateTime must be in YYYY-MM-DDTHH:mm:ss format',
      );
    }

    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4]),
      minute: Number(match[5]),
      second: Number(match[6]),
    };
  }

  private parseDateParts(dateInput: string): LocalDateParts {
    if (!dateInput) {
      throw new BadRequestException('date query parameter is required');
    }

    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateInput.match(datePattern);
    if (!match) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException('date must be a valid calendar date');
    }

    return {
      year,
      month,
      day,
    };
  }

  private parseNumber(value: string, field: 'lat' | 'lon'): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} query parameter is required`);
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException(`${field} must be a valid number`);
    }

    return parsed;
  }

  private validateLatitude(latitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('lat must be between -90 and 90');
    }
  }

  private validateLongitude(longitude: number): void {
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('lon must be between -180 and 180');
    }
  }

  private validateTimezone(timezone: string): void {
    try {
      validateIanaTimezone(timezone);
    } catch {
      throw new BadRequestException('timezone must be a valid IANA timezone');
    }
  }

}
