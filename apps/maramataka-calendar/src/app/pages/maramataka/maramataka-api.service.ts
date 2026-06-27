import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { NZ_TIMEZONE } from './maramataka.constants';
import {
  ApiMaramatakaMonth,
  ApiMata,
  LocationSummary,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaToday,
} from './maramataka.models';

@Injectable({ providedIn: 'root' })
export class MaramatakaApiService {
  private readonly http = inject(HttpClient);

  formatDate(date: Date): string {
    return this.toYyyyMmDd(date);
  }

  getLocations(): Observable<LocationSummary[]> {
    return this.http.get<LocationSummary[]>('/api/locations');
  }

  getMonth(locationId: string, date: Date): Observable<MaramatakaMonth> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId)
      .set('tz', String(this.getNzTimezoneOffset(date)));

    return this.http
      .get<ApiMaramatakaMonth>('/api/maramataka/month', { params })
      .pipe(map((response) => this.mapMonth(response)));
  }

  getToday(locationId: string, date: Date): Observable<MaramatakaToday> {
    const params = new HttpParams()
      .set('dateTime', this.toNzLocalDateTime(date))
      .set('location', locationId);

    return this.http
      .get<MaramatakaToday<string>>('/api/maramataka/today', { params })
      .pipe(map((response) => this.mapToday(response)));
  }

  private mapMonth(apiMonth: ApiMaramatakaMonth): MaramatakaMonth {
    return {
      version: apiMonth.version,
      whiroStartsAt: new Date(apiMonth.whiroStartsAt),
      nights: apiMonth.nights.map((night) => this.mapNight(night)),
    };
  }

  private mapToday(apiToday: MaramatakaToday<string>): MaramatakaToday {
    return {
      mata: apiToday.mata,
      overlappingMata: apiToday.overlappingMata?.map((overlap) => ({
        mata: overlap.mata,
        cycleStartsAt: new Date(overlap.cycleStartsAt),
        reason: overlap.reason,
      })),
      startsAt: new Date(apiToday.startsAt),
      endsAt: new Date(apiToday.endsAt),
    };
  }

  private mapNight(
    night: ApiMaramatakaMonth['nights'][number],
  ): MaramatakaNight {
    return {
      mata: this.mataName(night.mata),
      overlappingMata: night.overlappingMata?.map((overlap) => ({
        mata: this.mataName(overlap.mata),
        cycleStartsAt: new Date(overlap.cycleStartsAt),
        reason: overlap.reason,
      })),
      startsAt: new Date(night.startsAt),
      endsAt: new Date(night.endsAt),
    };
  }

  private mataName(mata: string | ApiMata): string {
    return typeof mata === 'string' ? mata : mata.name;
  }

  private toYyyyMmDd(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: NZ_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    return `${year}-${month}-${day}`;
  }

  private toNzLocalDateTime(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: NZ_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    const hour = parts.find((part) => part.type === 'hour')?.value;
    const minute = parts.find((part) => part.type === 'minute')?.value;
    const second = parts.find((part) => part.type === 'second')?.value;

    if (!year || !month || !day || !hour || !minute || !second) {
      return `${this.toYyyyMmDd(date)}T00:00:00`;
    }

    const normalizedHour = hour === '24' ? '00' : hour;

    return `${year}-${month}-${day}T${normalizedHour}:${minute}:${second}`;
  }

  private getNzTimezoneOffset(date: Date): number {
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: NZ_TIMEZONE,
      timeZoneName: 'shortOffset',
    });
    const timezonePart = formatter
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value;

    const match = timezonePart?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
    if (!match) {
      return 12;
    }

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? '0');

    if (minutes !== 0 || !Number.isFinite(hours)) {
      return 12;
    }

    return sign * hours;
  }
}
