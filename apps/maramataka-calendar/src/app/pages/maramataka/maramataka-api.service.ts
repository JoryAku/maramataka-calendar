import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { defer, finalize, map, Observable } from 'rxjs';
import { MARAMATAKA_APP_CONFIG } from '../../app-config';
import { NZ_TIMEZONE } from './maramataka.constants';
import {
  ApiMaramatakaCycleDetails,
  DawnSky,
  ApiMaramatakaPageData,
  ApiMaramatakaYear,
  ApiMata,
  ApiMoonDetails,
  ApiStarMarker,
  LocationSummary,
  MaramatakaCycleDetails,
  MaramatakaNight,
  MaramatakaPageData,
  MaramatakaStarMonth,
  MaramatakaTodayMata,
  MaramatakaYear,
  MoonDetails,
  StarMarker,
} from './maramataka.models';

const LOCATION_REGISTRY_VERSION = '2026-07-tahiti-timezone';

@Injectable({ providedIn: 'root' })
export class MaramatakaApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(MARAMATAKA_APP_CONFIG);

  formatDate(date: Date, timezone = NZ_TIMEZONE): string {
    return this.toYyyyMmDd(date, timezone);
  }

  getLocations(): Observable<LocationSummary[]> {
    const params = new HttpParams().set(
      'registryVersion',
      LOCATION_REGISTRY_VERSION,
    );

    return this.profileRequest(
      'locations',
      this.http.get<LocationSummary[]>(this.apiUrl('/locations'), { params }),
    );
  }

  getPageData(
    locationId: string,
    date: Date,
    timezone = NZ_TIMEZONE,
  ): Observable<MaramatakaPageData> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date, timezone))
      .set('instant', date.toISOString())
      .set('location', locationId);

    return this.profileRequest(
      `page ${locationId} ${date.toISOString()}`,
      this.http
        .get<ApiMaramatakaPageData>(this.apiUrl('/maramataka/page'), {
          params,
        })
        .pipe(map((response) => this.mapPageData(response))),
    );
  }

  getYear(
    locationId: string,
    date: Date,
    options: { includeTimelineEvents?: boolean } = {},
    timezone = NZ_TIMEZONE,
  ): Observable<MaramatakaYear> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date, timezone))
      .set('location', locationId)
      .set(
        'includeTimelineEvents',
        String(options.includeTimelineEvents ?? true),
      );

    return this.profileRequest(
      `year ${locationId} ${this.toYyyyMmDd(date, timezone)} timeline=${options.includeTimelineEvents ?? true}`,
      this.http
        .get<ApiMaramatakaYear>(this.apiUrl('/maramataka/year'), { params })
        .pipe(map((response) => this.mapYear(response))),
    );
  }

  getDawnSky(
    locationId: string,
    date: Date,
    timezone = NZ_TIMEZONE,
  ): Observable<DawnSky> {
    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(date, timezone))
      .set('location', locationId);

    return this.profileRequest(
      `dawn-sky ${locationId} ${this.toYyyyMmDd(date, timezone)}`,
      this.http
        .get<DawnSky<string> | ApiStarMarker[]>(
          this.apiUrl('/maramataka/dawn-sky'),
          {
            params,
          },
        )
        .pipe(map((response) => this.mapDawnSky(response))),
    );
  }

  private emptyDawnSunPath(): DawnSky['sunPath'] {
    return {
      startsAt: new Date(0),
      sunriseAt: new Date(0),
      points: [],
      calculation: 'Dawn sun path unavailable from API response.',
    };
  }

  private mapDawnSky(apiDawnSky: DawnSky<string> | ApiStarMarker[]): DawnSky {
    if (Array.isArray(apiDawnSky)) {
      return {
        starMarkers: apiDawnSky.map((marker) => this.mapStarMarker(marker)),
        sunPath: this.emptyDawnSunPath(),
      };
    }

    return {
      starMarkers: apiDawnSky.starMarkers.map((marker) =>
        this.mapStarMarker(marker),
      ),
      sunPath: {
        ...apiDawnSky.sunPath,
        startsAt: new Date(apiDawnSky.sunPath.startsAt),
        sunriseAt: new Date(apiDawnSky.sunPath.sunriseAt),
        points: apiDawnSky.sunPath.points.map((point) => ({
          ...point,
          observedAt: new Date(point.observedAt),
        })),
      },
      sunriseExtremes: apiDawnSky.sunriseExtremes
        ? {
            ...apiDawnSky.sunriseExtremes,
            northernmost: {
              ...apiDawnSky.sunriseExtremes.northernmost,
              observedAt: new Date(
                apiDawnSky.sunriseExtremes.northernmost.observedAt,
              ),
            },
            southernmost: {
              ...apiDawnSky.sunriseExtremes.southernmost,
              observedAt: new Date(
                apiDawnSky.sunriseExtremes.southernmost.observedAt,
              ),
            },
          }
        : undefined,
      moon: apiDawnSky.moon
        ? {
            ...apiDawnSky.moon,
            observedAt: new Date(apiDawnSky.moon.observedAt),
          }
        : undefined,
    };
  }

  private apiUrl(path: string): string {
    return `${this.config.apiBaseUrl}${path}`;
  }

  private profileRequest<T>(label: string, request: Observable<T>): Observable<T> {
    if (!this.profileEnabled()) {
      return request;
    }

    return defer(() => {
      const startedAt = performance.now();

      return request.pipe(
        finalize(() => {
          console.debug(
            `[maramataka profile] ${label}: ${Math.round((performance.now() - startedAt) * 10) / 10}ms`,
          );
        }),
      );
    });
  }

  private profileEnabled(): boolean {
    try {
      return localStorage.getItem('maramataka:profile') === '1';
    } catch {
      return false;
    }
  }

  private mapPageData(apiPageData: ApiMaramatakaPageData): MaramatakaPageData {
    return {
      cycle: this.mapCycleDetails(apiPageData.cycle),
      moonDetails: this.mapMoonDetails(apiPageData.moonDetails),
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
          astronomicalOccursAt: apiCycle.anchors.nextWhiro.astronomicalOccursAt
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
      diagnostics: (apiYear.diagnostics ?? []).map((diagnostic) => ({
        ...diagnostic,
        anchorDate: diagnostic.anchorDate
          ? new Date(diagnostic.anchorDate)
          : undefined,
      })),
      events: (apiYear.events ?? []).map((event) => ({
        ...event,
        occursAt: new Date(event.occursAt),
      })),
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
    night: ApiMaramatakaCycleDetails['nights'][number],
  ): MaramatakaNight {
    const mataDetails =
      typeof night.mata === 'string'
        ? undefined
        : this.mapMataDetails(night.mata);

    return {
      mata: this.mataName(night.mata),
      mataDetails,
      phaseGroup: this.mataPhaseGroup(night.mata),
      overlappingMata: night.overlappingMata?.map((overlap) => ({
        mata: this.mataName(overlap.mata),
        mataDetails:
          typeof overlap.mata === 'string'
            ? undefined
            : this.mapMataDetails(overlap.mata),
        cycleStartsAt: new Date(overlap.cycleStartsAt),
        reason: overlap.reason,
      })),
      startsAt: new Date(night.startsAt),
      endsAt: new Date(night.endsAt),
    };
  }

  private mapMataDetails(
    mata: ApiMata | MaramatakaTodayMata,
  ): MaramatakaTodayMata {
    return {
      index: mata.index,
      name: mata.name,
      version: mata.version,
      contentLayers: mata.contentLayers,
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

  private mataPhaseGroup(
    mata: string | ApiMata,
  ): MaramatakaNight['phaseGroup'] {
    return typeof mata === 'string' ? undefined : mata.phaseGroup;
  }

  private toYyyyMmDd(date: Date, timezone: string): string {
    const formatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: timezone,
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

}
