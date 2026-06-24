import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { Location } from '@maramataka-calendar/astronomy';
import { MaramatakaMonth, MaramatakaService } from '@maramataka-calendar/maramataka-domain';

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
    const latitude = this.parseNumber(latInput, 'lat');
    const longitude = this.parseNumber(lonInput, 'lon');
    const timezoneOffset = this.parseNumber(tzInput, 'tz');

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('lat must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('lon must be between -180 and 180');
    }

    if (timezoneOffset < -12 || timezoneOffset > 14) {
      throw new BadRequestException('tz must be between -12 and 14');
    }

    if (!Number.isInteger(timezoneOffset)) {
      throw new BadRequestException('tz must be a whole-hour offset');
    }

    const location: Location = {
      latitude,
      longitude,
      timezoneOffset,
    };

    return this.maramatakaService.getMonth(location, date);
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
}
