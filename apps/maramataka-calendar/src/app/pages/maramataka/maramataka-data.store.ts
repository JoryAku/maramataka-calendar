import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  filter,
  fromEvent,
  interval,
  merge,
  Subject,
  switchMap,
} from 'rxjs';
import { NZ_TIMEZONE } from './maramataka.constants';
import { MaramatakaApiService } from './maramataka-api.service';
import {
  AppLanguage,
  isAppLanguage,
  MARAMATAKA_COPY,
} from './maramataka-copy';
import {
  LocationSummary,
  DawnMoon,
  DawnSunPath,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaToday,
  MaramatakaYear,
  MoonDetails,
  StarMarker,
} from './maramataka.models';

interface MaramatakaLoadContext {
  locationId: string;
  requestDate: Date;
  timezone: string;
}

const LANGUAGE_STORAGE_KEY = 'maramataka-language';
const LOCATION_TIMEZONE_FALLBACKS: Record<string, string> = {
  tahiti: 'Pacific/Tahiti',
  'waitangi-chatham-islands': 'Pacific/Chatham',
};

function initialLanguage(): AppLanguage {
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage && isAppLanguage(storedLanguage)) {
    return storedLanguage;
  }

  return navigator.language.toLowerCase().startsWith('mi') ? 'mi' : 'en';
}

@Injectable()
export class MaramatakaDataStore {
  private readonly api = inject(MaramatakaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly requestContext$ = new Subject<MaramatakaLoadContext>();
  private lastRequestedLocalDate: string | null = null;

  readonly locationsLoading = signal(true);
  readonly locationsError = signal<string | null>(null);
  readonly locations = signal<LocationSummary[]>([]);
  readonly selectedLocationId = signal<string | null>(null);
  readonly monthLoading = signal(true);
  readonly monthError = signal<string | null>(null);
  readonly month = signal<MaramatakaMonth | null>(null);
  readonly cycleLoading = signal(true);
  readonly cycleError = signal<string | null>(null);
  readonly cycle = signal<MaramatakaCycleDetails | null>(null);
  readonly todayLoading = signal(true);
  readonly todayError = signal<string | null>(null);
  readonly today = signal<MaramatakaToday | null>(null);
  readonly moonDetailsLoading = signal(true);
  readonly moonDetailsError = signal<string | null>(null);
  readonly moonDetails = signal<MoonDetails | null>(null);
  readonly yearLoading = signal(true);
  readonly yearTimelineLoading = signal(false);
  readonly yearTimelineError = signal<string | null>(null);
  readonly yearError = signal<string | null>(null);
  readonly year = signal<MaramatakaYear | null>(null);
  readonly starMarkersLoading = signal(true);
  readonly starMarkersError = signal<string | null>(null);
  readonly starMarkers = signal<StarMarker[]>([]);
  readonly dawnSunPath = signal<DawnSunPath | null>(null);
  readonly dawnMoon = signal<DawnMoon | null>(null);
  readonly now = signal(new Date());
  readonly selectedDate = signal(this.api.formatDate(new Date()));
  readonly useLiveDate = signal(true);
  readonly language = signal<AppLanguage>(initialLanguage());
  readonly copy = computed(() => MARAMATAKA_COPY[this.language()]);

  private readonly selectedDateInstant = signal<Date | null>(null);

  readonly selectedLocationName = computed(() => {
    const selectedLocation = this.locations().find(
      (location) => location.id === this.selectedLocationId(),
    );

    return selectedLocation?.name ?? this.copy().errors.selectedLocation;
  });

  readonly selectedLocationTimezone = computed(() => {
    const selectedLocation = this.locations().find(
      (location) => location.id === this.selectedLocationId(),
    );

    return (
      selectedLocation?.timezone ??
      LOCATION_TIMEZONE_FALLBACKS[this.selectedLocationId() ?? ''] ??
      NZ_TIMEZONE
    );
  });

  constructor() {
    this.connectDataStreams();
  }

  initialize(): void {
    this.loadLocations();

    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.useLiveDate()) {
          this.now.set(new Date());
        }
      });

    merge(fromEvent(window, 'focus'), fromEvent(document, 'visibilitychange'))
      .pipe(
        filter(() => !document.hidden),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.refreshIfDateChanged();
      });
  }

  selectLocation(locationId: string): void {
    if (locationId === this.selectedLocationId()) {
      return;
    }

    this.selectedLocationId.set(locationId);
    if (this.useLiveDate()) {
      this.selectedDate.set(
        this.api.formatDate(new Date(), this.selectedLocationTimezone()),
      );
    } else {
      this.selectedDateInstant.set(
        this.localMiddayForDate(
          this.selectedDate(),
          this.selectedLocationTimezone(),
        ),
      );
    }
    this.reloadData();
  }

  selectDateString(date: string): void {
    if (!date || date === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(false);
    this.selectedDate.set(date);
    this.selectedDateInstant.set(
      this.localMiddayForDate(date, this.selectedLocationTimezone()),
    );
    this.reloadData();
  }

  selectDate(date: Date): void {
    const selectedDate = this.api.formatDate(
      date,
      this.selectedLocationTimezone(),
    );
    const shouldReload =
      selectedDate !== this.selectedDate() ||
      this.selectedDateInstant()?.getTime() !== date.getTime() ||
      this.useLiveDate();

    this.useLiveDate.set(false);
    this.selectedDate.set(selectedDate);
    this.selectedDateInstant.set(date);

    if (shouldReload) {
      this.reloadData();
    }
  }

  resetDateToToday(): void {
    const today = this.api.formatDate(
      new Date(),
      this.selectedLocationTimezone(),
    );
    if (this.useLiveDate() && today === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(true);
    this.selectedDate.set(today);
    this.selectedDateInstant.set(null);
    this.reloadData();
  }

  selectLanguage(language: string): void {
    if (!isAppLanguage(language) || language === this.language()) {
      return;
    }

    this.language.set(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  private connectDataStreams(): void {
    this.requestContext$
      .pipe(
        switchMap(({ locationId, requestDate, timezone }) =>
          this.api
            .getPageData(locationId, requestDate, timezone)
            .pipe(
              catchError(() => {
                this.month.set(null);
                this.cycle.set(null);
                this.today.set(null);
                this.moonDetails.set(null);
                this.monthLoading.set(false);
                this.cycleLoading.set(false);
                this.todayLoading.set(false);
                this.moonDetailsLoading.set(false);
                const copy = this.copy().errors;
                this.monthError.set(copy.month);
                this.cycleError.set(copy.cycle);
                this.todayError.set(copy.today);
                this.moonDetailsError.set(copy.moonDetails);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pageData) => {
        this.cycle.set(pageData.cycle);
        this.month.set(this.monthFromCycle(pageData.cycle));
        this.today.set(this.todayFromCycle(pageData.cycle));
        this.moonDetails.set(pageData.moonDetails);
        this.monthLoading.set(false);
        this.cycleLoading.set(false);
        this.todayLoading.set(false);
        this.moonDetailsLoading.set(false);
      });

    this.requestContext$
      .pipe(
        switchMap(({ locationId, requestDate, timezone }) =>
          this.api
            .getDawnSky(locationId, requestDate, timezone)
            .pipe(
              catchError(() => {
                this.starMarkers.set([]);
                this.dawnSunPath.set(null);
                this.dawnMoon.set(null);
                this.starMarkersLoading.set(false);
                this.starMarkersError.set(this.copy().errors.dawnSky);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dawnSky) => {
        this.starMarkers.set(dawnSky.starMarkers);
        this.dawnSunPath.set(dawnSky.sunPath);
        this.dawnMoon.set(dawnSky.moon ?? null);
        this.starMarkersLoading.set(false);
      });

    this.requestContext$
      .pipe(
        switchMap(({ locationId, requestDate, timezone }) =>
          this.api
            .getYear(
              locationId,
              requestDate,
              { includeTimelineEvents: false },
              timezone,
            )
            .pipe(
              catchError((error: unknown) => {
                this.year.set(null);
                this.yearLoading.set(false);
                this.yearTimelineLoading.set(false);
                this.yearTimelineError.set(null);
                this.yearError.set(
                  `${this.copy().errors.year}${this.formatRequestError(error)}`,
                );
                return EMPTY;
              }),
              switchMap((year) => {
                this.year.set(year);
                this.yearLoading.set(false);
                this.yearTimelineLoading.set(true);
                this.yearTimelineError.set(null);

                return this.api
                  .getYear(
                    locationId,
                    requestDate,
                    {
                      includeTimelineEvents: true,
                    },
                    timezone,
                  )
                  .pipe(
                    catchError((error: unknown) => {
                      this.yearTimelineLoading.set(false);
                      this.yearTimelineError.set(
                        `${this.copy().errors.yearAnnotations}${this.formatRequestError(error)}`,
                      );
                      return EMPTY;
                    }),
                  );
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((year) => {
        this.year.set(year);
        this.yearTimelineLoading.set(false);
        this.yearTimelineError.set(null);
      });
  }

  private loadLocations(): void {
    this.locationsLoading.set(true);
    this.locationsError.set(null);

    this.api
      .getLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.selectedLocationId.set(locations[0]?.id ?? null);
          this.selectedDate.set(
            this.api.formatDate(new Date(), this.selectedLocationTimezone()),
          );
          this.locationsLoading.set(false);

          if (this.selectedLocationId()) {
            this.reloadData();
          }
        },
        error: () => {
          this.locations.set([]);
          this.selectedLocationId.set(null);
          this.locationsLoading.set(false);
          this.monthLoading.set(false);
          this.cycleLoading.set(false);
          this.todayLoading.set(false);
          this.moonDetailsLoading.set(false);
          this.yearLoading.set(false);
          this.yearTimelineLoading.set(false);
          this.yearTimelineError.set(null);
          this.starMarkersLoading.set(false);
          const copy = this.copy().errors;
          this.monthError.set(copy.monthWithoutLocations);
          this.cycleError.set(copy.cycleWithoutLocations);
          this.todayError.set(copy.todayWithoutLocations);
          this.moonDetailsError.set(copy.moonDetailsWithoutLocations);
          this.yearError.set(copy.yearWithoutLocations);
          this.starMarkersError.set(copy.starMarkersWithoutLocations);
          this.locationsError.set(copy.locations);
        },
      });
  }

  private reloadData(): void {
    const locationId = this.selectedLocationId();
    if (!locationId) {
      return;
    }

    const requestDate = this.requestDate();
    const timezone = this.selectedLocationTimezone();
    this.now.set(requestDate);
    this.lastRequestedLocalDate = this.api.formatDate(
      requestDate,
      timezone,
    );
    this.resetDataState();
    this.requestContext$.next({ locationId, requestDate, timezone });
  }

  private resetDataState(): void {
    this.monthLoading.set(true);
    this.cycleLoading.set(true);
    this.todayLoading.set(true);
    this.moonDetailsLoading.set(true);
    this.yearLoading.set(true);
    this.yearTimelineLoading.set(false);
    this.yearTimelineError.set(null);
    this.starMarkersLoading.set(true);
    this.monthError.set(null);
    this.cycleError.set(null);
    this.todayError.set(null);
    this.moonDetailsError.set(null);
    this.yearError.set(null);
    this.yearTimelineError.set(null);
    this.starMarkersError.set(null);
    this.month.set(null);
    this.cycle.set(null);
    this.today.set(null);
    this.moonDetails.set(null);
    this.year.set(null);
    this.starMarkers.set([]);
    this.dawnSunPath.set(null);
    this.dawnMoon.set(null);
  }

  private refreshIfDateChanged(): void {
    if (
      !this.useLiveDate() ||
      this.locationsLoading() ||
      !this.selectedLocationId()
    ) {
      return;
    }

    const currentLocalDate = this.api.formatDate(
      new Date(),
      this.selectedLocationTimezone(),
    );
    if (currentLocalDate !== this.lastRequestedLocalDate) {
      this.selectedDate.set(currentLocalDate);
      this.reloadData();
    }
  }

  private monthFromCycle(cycle: MaramatakaCycleDetails): MaramatakaMonth {
    return {
      version: cycle.version,
      ruleSet: cycle.ruleSet,
      whiroStartsAt: cycle.anchors.whiro.occursAt,
      starMonthSequence: cycle.starMonth?.note?.sequence,
      nights: cycle.nights,
    };
  }

  private todayFromCycle(cycle: MaramatakaCycleDetails): MaramatakaToday {
    return {
      ruleSet: cycle.ruleSet,
      mata: cycle.currentNight.mataDetails ?? {
        index: cycle.currentMataIndex,
        name: cycle.currentNight.mata,
      },
      overlappingMata: cycle.currentNight.overlappingMata?.map((overlap) => ({
        mata: overlap.mataDetails ?? {
          index: 0,
          name: overlap.mata,
        },
        cycleStartsAt: overlap.cycleStartsAt,
        reason: overlap.reason,
      })),
      startsAt: cycle.currentNight.startsAt,
      endsAt: cycle.currentNight.endsAt,
    };
  }

  private requestDate(): Date {
    if (this.useLiveDate()) {
      return new Date();
    }

    return (
      this.selectedDateInstant() ??
      this.localMiddayForDate(
        this.selectedDate(),
        this.selectedLocationTimezone(),
      )
    );
  }

  private localMiddayForDate(localDate: string, timezone: string): Date {
    const match = localDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return new Date();
    }

    return this.localDateTimeToDate(
      {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: 12,
        minute: 0,
        second: 0,
      },
      timezone,
    );
  }

  private localDateTimeToDate(
    parts: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    },
    timezone: string,
  ): Date {
    const localDateTimeAsUtcMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const candidateOffsets = new Set(
      [-24 * 60 * 60 * 1000, 0, 24 * 60 * 60 * 1000].map((probeOffset) =>
        this.timezoneOffsetMs(
          new Date(localDateTimeAsUtcMs + probeOffset),
          timezone,
        ),
      ),
    );

    for (const offset of candidateOffsets) {
      const candidate = new Date(localDateTimeAsUtcMs - offset);
      if (this.matchesLocalDateTime(candidate, parts, timezone)) {
        return candidate;
      }
    }

    return new Date(localDateTimeAsUtcMs);
  }

  private timezoneOffsetMs(date: Date, timezone: string): number {
    const parts = this.dateTimeParts(date, timezone);
    const localAsUtcMs = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );

    return localAsUtcMs - date.getTime();
  }

  private matchesLocalDateTime(
    date: Date,
    expected: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    },
    timezone: string,
  ): boolean {
    const actual = this.dateTimeParts(date, timezone);

    return (
      actual.year === expected.year &&
      actual.month === expected.month &&
      actual.day === expected.day &&
      actual.hour === expected.hour &&
      actual.minute === expected.minute &&
      actual.second === expected.second
    );
  }

  private dateTimeParts(date: Date, timezone: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
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
    const parts = Object.fromEntries(
      formatter.formatToParts(date).map((part) => [part.type, part.value]),
    );

    return {
      year: Number(parts['year']),
      month: Number(parts['month']),
      day: Number(parts['day']),
      hour: Number(parts['hour']),
      minute: Number(parts['minute']),
      second: Number(parts['second']),
    };
  }

  private formatRequestError(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return '';
    }

    const maybeError = error as {
      status?: number;
      statusText?: string;
      message?: string;
      error?: { message?: string } | string;
    };
    const detail =
      typeof maybeError.error === 'string'
        ? maybeError.error
        : maybeError.error?.message ||
          maybeError.statusText ||
          maybeError.message;
    const status = maybeError.status ? String(maybeError.status) : '';

    return detail ? ` (${status}${status ? ': ' : ''}${detail})` : '';
  }
}
