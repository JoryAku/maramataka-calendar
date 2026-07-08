import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  Location,
  parseLocalDateTimeInTimezone,
  validateIanaTimezone,
} from '@maramataka-calendar/astronomy';
import { findLocationById } from '@maramataka-calendar/location';

interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export interface DateLocationRequest {
  date: Date;
  location: Location;
}

export class DateLocationQueryDto {
  date?: string;
  location?: string;
  lat?: string;
  lon?: string;
  timezone?: string;

  validate(): DateLocationRequest {
    const dateParts = parseDateParts(this.date);
    const location = this.location
      ? parseNamedLocation(this.location)
      : parseCoordinatesOrThrow(this.lat, this.lon, this.timezone);
    const date = parseLocalDateForTimezone(dateParts, location.timezone);

    return { date, location };
  }
}

function parseCoordinatesOrThrow(
  latInput?: string,
  lonInput?: string,
  timezoneInput?: string,
): Location {
  if (!latInput || !lonInput || !timezoneInput) {
    throw new BadRequestException(
      'Either location parameter or all of lat, lon, and timezone parameters are required',
    );
  }

  const latitude = parseNumber(latInput, 'lat');
  const longitude = parseNumber(lonInput, 'lon');

  validateLatitude(latitude);
  validateLongitude(longitude);
  validateTimezone(timezoneInput);

  return {
    latitude,
    longitude,
    timezone: timezoneInput,
  };
}

function parseNamedLocation(locationInput: string): Location {
  const locationData = findLocationById(locationInput);
  if (!locationData) {
    throw new NotFoundException(`Unknown location: ${locationInput}`);
  }

  return {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timezone: locationData.timezone,
  };
}

function parseLocalDateForTimezone(
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
    throw new BadRequestException('date must be a valid local date');
  }
}

function parseDateParts(dateInput: string | undefined): LocalDateParts {
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
    throw new BadRequestException('date must be a valid local date');
  }

  return {
    year,
    month,
    day,
  };
}

function parseNumber(value: string, field: 'lat' | 'lon'): number {
  if (value === '') {
    throw new BadRequestException(`${field} query parameter is required`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`${field} must be a valid number`);
  }

  return parsed;
}

function validateLatitude(latitude: number): void {
  if (latitude < -90 || latitude > 90) {
    throw new BadRequestException('lat must be between -90 and 90');
  }
}

function validateLongitude(longitude: number): void {
  if (longitude < -180 || longitude > 180) {
    throw new BadRequestException('lon must be between -180 and 180');
  }
}

function validateTimezone(timezone: string): void {
  try {
    validateIanaTimezone(timezone);
  } catch {
    throw new BadRequestException('timezone must be a valid IANA timezone');
  }
}
