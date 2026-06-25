import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { Location } from '@maramataka-calendar/astronomy';
import {
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';

interface TodayMaramatakaNightResponse {
  mata: {
    index: number;
    name: string;
  };
  startsAt: Date;
  endsAt: Date;
}

@Controller('maramataka')
export class MaramatakaController {
  constructor(private readonly maramatakaService: MaramatakaService) {}

  @Get('month')
  async getMonth(
    @Query('date') dateInput: string,
    @Query('lat') latInput: string,
    @Query('lon') lonInput: string,
    @Query('tz') tzInput: string
  ): Promise<MaramatakaMonth> {
    const date = this.parseDate(dateInput);
    const location = this.parseLocation(latInput, lonInput, tzInput);

    return this.maramatakaService.getMonth(location, date);
  }

  @Get('today')
  async getToday(
    @Query('dateTime') dateTimeInput: string,
    @Query('lat') latInput: string,
    @Query('lon') lonInput: string,
    @Query('tz') tzInput: string
  ): Promise<TodayMaramatakaNightResponse> {
    const location = this.parseLocation(latInput, lonInput, tzInput);
    const date = this.parseDateTime(dateTimeInput, location.timezoneOffset);
    const month = await this.maramatakaService.getMonth(location, date);
    const night = this.findNightForDate(month.nights, date);

    if (!night) {
      throw new BadRequestException(
        'No Maramataka night found for supplied date and location'
      );
    }

    return {
      mata: {
        index: night.mata.index,
        name: night.mata.name,
      },
      startsAt: night.startsAt,
      endsAt: night.endsAt,
    };
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

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6]);

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
