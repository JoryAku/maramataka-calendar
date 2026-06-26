import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { Location } from '@maramataka-calendar/astronomy';
import {
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';
import { findLocationById } from './locations';

interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
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
    @Query('tz') tzInput?: string
  ): Promise<MaramatakaMonth> {
    const date = this.parseDate(dateInput);
    const location = locationInput
      ? this.parseNamedLocationForDate(locationInput, date)
      : this.parseCoordinatesOrThrow(latInput, lonInput, tzInput);

    return this.maramatakaService.getMonth(location, date);
  }

  @Get('today')
  async getToday(
    @Query('dateTime') dateTimeInput: string,
    @Query('location') locationInput?: string,
    @Query('lat') latInput?: string,
    @Query('lon') lonInput?: string,
    @Query('tz') tzInput?: string
  ): Promise<MaramatakaNight> {
    const { date, location } = locationInput
      ? this.parseNamedLocationDateTime(locationInput, dateTimeInput)
      : this.parseCoordinateDateTime(dateTimeInput, latInput, lonInput, tzInput);
    const month = await this.maramatakaService.getMonth(location, date);
    const night = this.findNightForDate(month.nights, date);

    if (!night) {
      throw new BadRequestException(
        'No Maramataka night found for supplied date and location'
      );
    }

    return {
      mata: night.mata,
      startsAt: night.startsAt,
      endsAt: night.endsAt,
    };
  }

  private parseCoordinatesOrThrow(
    latInput?: string,
    lonInput?: string,
    tzInput?: string
  ): Location {
    if (!latInput || !lonInput || !tzInput) {
      throw new BadRequestException(
        'Either location parameter or all of lat, lon, and tz parameters are required'
      );
    }

    return this.parseLocation(latInput, lonInput, tzInput);
  }

  private parseCoordinateDateTime(
    dateTimeInput: string,
    latInput?: string,
    lonInput?: string,
    tzInput?: string
  ): { date: Date; location: Location } {
    const location = this.parseCoordinatesOrThrow(latInput, lonInput, tzInput);
    const date = this.parseDateTime(dateTimeInput, location.timezoneOffset);

    return { date, location };
  }

  private parseNamedLocationDateTime(
    locationInput: string,
    dateTimeInput: string
  ): { date: Date; location: Location } {
    const locationData = this.findNamedLocationOrThrow(locationInput);
    const date = this.parseDateTimeForTimezone(dateTimeInput, locationData.timezone);
    const timezoneOffset = this.getTimezoneOffsetForDate(locationData.timezone, date);

    return {
      date,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timezoneOffset,
      },
    };
  }

  private parseNamedLocationForDate(locationInput: string, date: Date): Location {
    const locationData = this.findNamedLocationOrThrow(locationInput);
    const localMidday = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        12,
        0,
        0
      )
    );
    const timezoneOffset = this.getTimezoneOffsetForDate(
      locationData.timezone,
      localMidday
    );

    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timezoneOffset,
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
    tzInput: string
  ): Location {
    const latitude = this.parseNumber(latInput, 'lat');
    const longitude = this.parseNumber(lonInput, 'lon');
    const timezoneOffset = this.parseNumber(tzInput, 'tz');

    this.validateLatitude(latitude);
    this.validateLongitude(longitude);
    this.validateTimezoneOffset(timezoneOffset);

    return {
      latitude,
      longitude,
      timezoneOffset,
    };
  }

  private parseDateTime(dateTimeInput: string, timezoneOffset: number): Date {
    const dateTimeParts = this.parseDateTimeParts(dateTimeInput);
    return this.parseDateTimeWithOffset(dateTimeParts, timezoneOffset);
  }

  private parseDateTimeForTimezone(dateTimeInput: string, timezone: string): Date {
    const dateTimeParts = this.parseDateTimeParts(dateTimeInput);
    const hourMs = 60 * 60 * 1000;
    const localDateTimeAsUtcMs = Date.UTC(
      dateTimeParts.year,
      dateTimeParts.month - 1,
      dateTimeParts.day,
      dateTimeParts.hour,
      dateTimeParts.minute,
      dateTimeParts.second
    );

    const candidateOffsets = new Set<number>();
    const probeTimes = [-24 * hourMs, 0, 24 * hourMs];
    for (const probeTime of probeTimes) {
      const probeDate = new Date(localDateTimeAsUtcMs + probeTime);
      candidateOffsets.add(this.getTimezoneOffsetForDate(timezone, probeDate));
    }

    for (const candidateOffset of candidateOffsets) {
      const candidateDate = new Date(
        localDateTimeAsUtcMs - candidateOffset * hourMs
      );
      if (
        this.matchesLocalDateTimeParts(candidateDate, timezone, dateTimeParts)
      ) {
        return candidateDate;
      }
    }

    throw new BadRequestException('date must be a valid local date-time');
  }

  private parseDateTimeParts(dateTimeInput: string): LocalDateTimeParts {
    if (!dateTimeInput) {
      throw new BadRequestException('dateTime query parameter is required');
    }

    const datePattern =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
    const match = dateTimeInput.match(datePattern);
    if (!match) {
      throw new BadRequestException(
        'dateTime must be in YYYY-MM-DDTHH:mm:ss format'
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

  private parseDateTimeWithOffset(
    dateTimeParts: LocalDateTimeParts,
    timezoneOffset: number
  ): Date {
    const { year, month, day, hour, minute, second } = dateTimeParts;

    const utcDate = new Date(
      Date.UTC(year, month - 1, day, hour - timezoneOffset, minute, second)
    );
    const localizedDate = new Date(
      utcDate.getTime() + timezoneOffset * 60 * 60 * 1000
    );

    if (
      Number.isNaN(utcDate.getTime()) ||
      localizedDate.getUTCFullYear() !== year ||
      localizedDate.getUTCMonth() !== month - 1 ||
      localizedDate.getUTCDate() !== day ||
      localizedDate.getUTCHours() !== hour ||
      localizedDate.getUTCMinutes() !== minute ||
      localizedDate.getUTCSeconds() !== second
    ) {
      throw new BadRequestException('date must be a valid local date-time');
    }

    return utcDate;
  }

  private matchesLocalDateTimeParts(
    date: Date,
    timezone: string,
    dateTimeParts: LocalDateTimeParts
  ): boolean {
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const formattedParts = formatter.formatToParts(date);
    const year = Number(
      formattedParts.find((part) => part.type === 'year')?.value
    );
    const month = Number(
      formattedParts.find((part) => part.type === 'month')?.value
    );
    const day = Number(
      formattedParts.find((part) => part.type === 'day')?.value
    );
    const hour = Number(
      formattedParts.find((part) => part.type === 'hour')?.value
    );
    const minute = Number(
      formattedParts.find((part) => part.type === 'minute')?.value
    );
    const second = Number(
      formattedParts.find((part) => part.type === 'second')?.value
    );

    return (
      year === dateTimeParts.year &&
      month === dateTimeParts.month &&
      day === dateTimeParts.day &&
      hour === dateTimeParts.hour &&
      minute === dateTimeParts.minute &&
      second === dateTimeParts.second
    );
  }

  private getTimezoneOffsetForDate(timezone: string, date: Date): number {
    try {
      const formatter = new Intl.DateTimeFormat('en-NZ', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const timezoneName = formatter
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;

      if (!timezoneName) {
        throw new InternalServerErrorException(
          `Invalid location timezone configuration: ${timezone}`
        );
      }

      if (timezoneName === 'GMT') {
        return 0;
      }

      const offsetMatch = timezoneName.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
      if (!offsetMatch) {
        throw new InternalServerErrorException(
          `Invalid location timezone offset configuration: ${timezoneName}`
        );
      }

      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const hours = Number(offsetMatch[2]);
      const minutes = Number(offsetMatch[3] ?? '0');

      return sign * (hours + minutes / 60);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Invalid location timezone configuration: ${timezone}`
      );
    }
  }

  private parseDate(dateInput: string): Date {
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

    return date;
  }

  private parseNumber(value: string, field: 'lat' | 'lon' | 'tz'): number {
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

  private validateTimezoneOffset(timezoneOffset: number): void {
    if (timezoneOffset < -12 || timezoneOffset > 14) {
      throw new BadRequestException('tz must be between -12 and 14');
    }

    if (!Number.isInteger(timezoneOffset)) {
      throw new BadRequestException('tz must be a whole-hour offset');
    }
  }

  private findNightForDate(
    nights: MaramatakaNight[],
    date: Date
  ): MaramatakaNight | undefined {
    const requestedTime = date.getTime();

    return nights.find(
      (night) =>
        night.startsAt.getTime() <= requestedTime &&
        requestedTime < night.endsAt.getTime()
    );
  }
}
