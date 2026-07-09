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
}

const LANGUAGE_STORAGE_KEY = 'maramataka-language';

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
  private lastRequestedNzDate: string | null = null;

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
    this.reloadData();
  }

  selectDateString(date: string): void {
    if (!date || date === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(false);
    this.selectedDate.set(date);
    this.selectedDateInstant.set(this.nzMiddayForDate(date));
    this.reloadData();
  }

  selectDate(date: Date): void {
    const selectedDate = this.api.formatDate(date);
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
    const today = this.api.formatDate(new Date());
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
        switchMap(({ locationId, requestDate }) =>
          this.api.getPageData(locationId, requestDate).pipe(
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
        switchMap(({ locationId, requestDate }) =>
          this.api.getStarMarkers(locationId, requestDate).pipe(
            catchError(() => {
              this.starMarkers.set([]);
              this.starMarkersLoading.set(false);
              this.starMarkersError.set(this.copy().errors.dawnSky);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((markers) => {
        this.starMarkers.set(markers);
        this.starMarkersLoading.set(false);
      });

    this.requestContext$
      .pipe(
        switchMap(({ locationId, requestDate }) =>
          this.api
            .getYear(locationId, requestDate, { includeTimelineEvents: false })
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
                  .getYear(locationId, requestDate, {
                    includeTimelineEvents: true,
                  })
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
    this.now.set(requestDate);
    this.lastRequestedNzDate = this.api.formatDate(requestDate);
    this.resetDataState();
    this.requestContext$.next({ locationId, requestDate });
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
  }

  private refreshIfDateChanged(): void {
    if (
      !this.useLiveDate() ||
      this.locationsLoading() ||
      !this.selectedLocationId()
    ) {
      return;
    }

    const currentNzDate = this.api.formatDate(new Date());
    if (currentNzDate !== this.lastRequestedNzDate) {
      this.selectedDate.set(currentNzDate);
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
      this.selectedDateInstant() ?? this.nzMiddayForDate(this.selectedDate())
    );
  }

  private nzMiddayForDate(localDate: string): Date {
    const match = localDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return new Date();
    }

    return this.nzLocalDateTimeToDate({
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: 12,
      minute: 0,
      second: 0,
    });
  }

  private nzLocalDateTimeToDate(parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  }): Date {
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
        this.nzTimezoneOffsetMs(new Date(localDateTimeAsUtcMs + probeOffset)),
      ),
    );

    for (const offset of candidateOffsets) {
      const candidate = new Date(localDateTimeAsUtcMs - offset);
      if (this.matchesNzLocalDateTime(candidate, parts)) {
        return candidate;
      }
    }

    return new Date(localDateTimeAsUtcMs);
  }

  private nzTimezoneOffsetMs(date: Date): number {
    const parts = this.nzDateTimeParts(date);
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

  private matchesNzLocalDateTime(
    date: Date,
    expected: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    },
  ): boolean {
    const actual = this.nzDateTimeParts(date);

    return (
      actual.year === expected.year &&
      actual.month === expected.month &&
      actual.day === expected.day &&
      actual.hour === expected.hour &&
      actual.minute === expected.minute &&
      actual.second === expected.second
    );
  }

  private nzDateTimeParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
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
