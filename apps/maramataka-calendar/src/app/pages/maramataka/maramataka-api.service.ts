import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MARAMATAKA_APP_CONFIG } from '../../app-config';
import { NZ_TIMEZONE } from './maramataka.constants';
import {
  ApiMaramatakaCycleDetails,
  ApiMaramatakaMonth,
  ApiMaramatakaYear,
  ApiMata,
  ApiMoonDetails,
  ApiStarMarker,
  LocationSummary,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaStarMonth,
  MaramatakaToday,
  MaramatakaYear,
  MoonDetails,
  StarMarker,
} from './maramataka.models';

@Injectable({ providedIn: 'root' })
export class MaramatakaApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(MARAMATAKA_APP_CONFIG);

  formatDate(date: Date): string {
    return this.toYyyyMmDd(date);
  }

  getLocations(): Observable<LocationSummary[]> {
    return this.http.get<LocationSummary[]>(this.apiUrl('/locations'));
  }

  getMonth(locationId: string, date: Date): Observable<MaramatakaMonth> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId);

    return this.http
      .get<ApiMaramatakaMonth>(this.apiUrl('/maramataka/month'), { params })
      .pipe(map((response) => this.mapMonth(response)));
  }

  getCycleDetails(
    locationId: string,
    date: Date,
  ): Observable<MaramatakaCycleDetails> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId);

    return this.http
      .get<ApiMaramatakaCycleDetails>(this.apiUrl('/maramataka/cycle'), {
        params,
      })
      .pipe(map((response) => this.mapCycleDetails(response)));
  }

  getYear(locationId: string, date: Date): Observable<MaramatakaYear> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId);

    return this.http
      .get<ApiMaramatakaYear>(this.apiUrl('/maramataka/year'), { params })
      .pipe(map((response) => this.mapYear(response)));
  }

  getToday(locationId: string, date: Date): Observable<MaramatakaToday> {
    const params = new HttpParams()
      .set('dateTime', this.toNzLocalDateTime(date))
      .set('location', locationId);

    return this.http
      .get<MaramatakaToday<string>>(this.apiUrl('/maramataka/today'), {
        params,
      })
      .pipe(map((response) => this.mapToday(response)));
  }

  getMoonDetails(locationId: string, date: Date): Observable<MoonDetails> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId);

    return this.http
      .get<ApiMoonDetails>(this.apiUrl('/maramataka/moon-details'), { params })
      .pipe(map((response) => this.mapMoonDetails(response)));
  }

  getStarMarkers(locationId: string, date: Date): Observable<StarMarker[]> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date))
      .set('location', locationId);

    return this.http
      .get<ApiStarMarker[]>(this.apiUrl('/maramataka/star-markers'), {
        params,
      })
      .pipe(
        map((response) =>
          response.map((marker) => this.mapStarMarker(marker)),
        ),
      );
  }

  private apiUrl(path: string): string {
    return `${this.config.apiBaseUrl}${path}`;
  }

  private mapMonth(apiMonth: ApiMaramatakaMonth): MaramatakaMonth {
    return {
      version: apiMonth.version,
      ruleSet: apiMonth.ruleSet,
      whiroStartsAt: new Date(apiMonth.whiroStartsAt),
      starMonthSequence: apiMonth.starMonthSequence,
      nights: apiMonth.nights.map((night) => this.mapNight(night)),
    };
  }

  private mapToday(apiToday: MaramatakaToday<string>): MaramatakaToday {
    return {
      ruleSet: apiToday.ruleSet,
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

  private mapCycleDetails(
    apiCycle: ApiMaramatakaCycleDetails,
  ): MaramatakaCycleDetails {
    return {
      version: apiCycle.version,
      ruleSet: apiCycle.ruleSet,
      timezone: apiCycle.timezone,
      currentMataIndex: apiCycle.currentMataIndex,
      currentNight: this.mapNight(apiCycle.currentNight),
      anchors: {
        whiro: {
          ...apiCycle.anchors.whiro,
          occursAt: new Date(apiCycle.anchors.whiro.occursAt),
          astronomicalOccursAt: apiCycle.anchors.whiro.astronomicalOccursAt
            ? new Date(apiCycle.anchors.whiro.astronomicalOccursAt)
            : undefined,
        },
        fullMoon: apiCycle.anchors.fullMoon
          ? {
              ...apiCycle.anchors.fullMoon,
              occursAt: new Date(apiCycle.anchors.fullMoon.occursAt),
              astronomicalOccursAt: apiCycle.anchors.fullMoon
                .astronomicalOccursAt
                ? new Date(apiCycle.anchors.fullMoon.astronomicalOccursAt)
                : undefined,
            }
          : undefined,
        nextWhiro: {
          ...apiCycle.anchors.nextWhiro,
          occursAt: new Date(apiCycle.anchors.nextWhiro.occursAt),
          astronomicalOccursAt: apiCycle.anchors.nextWhiro
            .astronomicalOccursAt
            ? new Date(apiCycle.anchors.nextWhiro.astronomicalOccursAt)
            : undefined,
        },
      },
      nights: apiCycle.nights.map((night) => this.mapNight(night)),
      starMonth: apiCycle.starMonth
        ? this.mapStarMonth(apiCycle.starMonth)
        : undefined,
      starMarkers: apiCycle.starMarkers?.map((marker) =>
        this.mapStarMarker(marker),
      ),
    };
  }

  private mapYear(apiYear: ApiMaramatakaYear): MaramatakaYear {
    return {
      ...apiYear,
      startsAt: new Date(apiYear.startsAt),
      endsAt: new Date(apiYear.endsAt),
      months: apiYear.months.map((month) => ({
        ...month,
        startsAt: new Date(month.startsAt),
        endsAt: new Date(month.endsAt),
        starMonth: month.starMonth
          ? this.mapStarMonth(month.starMonth)
          : undefined,
        starMarkers: month.starMarkers?.map((marker) =>
          this.mapStarMarker(marker),
        ),
        anchors: {
          whiro: {
            ...month.anchors.whiro,
            occursAt: new Date(month.anchors.whiro.occursAt),
            astronomicalOccursAt: month.anchors.whiro.astronomicalOccursAt
              ? new Date(month.anchors.whiro.astronomicalOccursAt)
              : undefined,
          },
          fullMoon: month.anchors.fullMoon
            ? {
                ...month.anchors.fullMoon,
                occursAt: new Date(month.anchors.fullMoon.occursAt),
                astronomicalOccursAt: month.anchors.fullMoon
                  .astronomicalOccursAt
                  ? new Date(month.anchors.fullMoon.astronomicalOccursAt)
                  : undefined,
              }
            : undefined,
          nextWhiro: {
            ...month.anchors.nextWhiro,
            occursAt: new Date(month.anchors.nextWhiro.occursAt),
            astronomicalOccursAt: month.anchors.nextWhiro.astronomicalOccursAt
              ? new Date(month.anchors.nextWhiro.astronomicalOccursAt)
              : undefined,
          },
        },
      })),
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

  private mapMoonDetails(apiDetails: ApiMoonDetails): MoonDetails {
    return {
      ...apiDetails,
      closestPhase: apiDetails.closestPhase
        ? {
            ...apiDetails.closestPhase,
            occursAt: new Date(apiDetails.closestPhase.occursAt),
          }
        : undefined,
      moonrise: apiDetails.moonrise
        ? {
            ...apiDetails.moonrise,
            occursAt: new Date(apiDetails.moonrise.occursAt),
          }
        : undefined,
      moonset: apiDetails.moonset
        ? {
            ...apiDetails.moonset,
            occursAt: new Date(apiDetails.moonset.occursAt),
          }
        : undefined,
      transit: apiDetails.transit
        ? {
            ...apiDetails.transit,
            occursAt: new Date(apiDetails.transit.occursAt),
          }
        : undefined,
    };
  }

  private mapStarMonth(
    apiStarMonth: MaramatakaStarMonth<string>,
  ): MaramatakaStarMonth {
    return {
      ...apiStarMonth,
      marker: apiStarMonth.marker
        ? this.mapStarMarker(apiStarMonth.marker)
        : undefined,
    };
  }

  private mapStarMarker(apiMarker: ApiStarMarker): StarMarker {
    return {
      ...apiMarker,
      observedAt: new Date(apiMarker.observedAt),
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
}
