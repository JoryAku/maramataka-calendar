import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, fromEvent, interval, merge } from 'rxjs';
import { MaramatakaCycleView } from './components/maramataka-cycle-view/maramataka-cycle-view';
import { MaramatakaTodayView } from './components/maramataka-today-view/maramataka-today-view';
import { MaramatakaYearView } from './components/maramataka-year-view/maramataka-year-view';
import { NZ_TIMEZONE } from './maramataka.constants';
import { MaramatakaApiService } from './maramataka-api.service';
import {
  LocationSummary,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaToday,
  MaramatakaYear,
  MaramatakaYearMonth,
  MoonDetails,
  StarMarker,
} from './maramataka.models';

@Component({
  selector: 'app-maramataka-page',
  imports: [
    CommonModule,
    MaramatakaCycleView,
    MaramatakaTodayView,
    MaramatakaYearView,
  ],
  templateUrl: './maramataka-page.html',
  styleUrl: './maramataka-page.css',
})
export class MaramatakaPage implements OnInit {
  private readonly api = inject(MaramatakaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private requestGeneration = 0;
  private lastRequestedNzDate: string | null = null;

  protected readonly locationsLoading = signal(true);
  protected readonly locationsError = signal<string | null>(null);
  protected readonly locations = signal<LocationSummary[]>([]);
  protected readonly selectedLocationId = signal<string | null>(null);
  protected readonly monthLoading = signal(true);
  protected readonly monthError = signal<string | null>(null);
  protected readonly month = signal<MaramatakaMonth | null>(null);
  protected readonly cycleLoading = signal(true);
  protected readonly cycleError = signal<string | null>(null);
  protected readonly cycle = signal<MaramatakaCycleDetails | null>(null);
  protected readonly todayLoading = signal(true);
  protected readonly todayError = signal<string | null>(null);
  protected readonly today = signal<MaramatakaToday | null>(null);
  protected readonly moonDetailsLoading = signal(true);
  protected readonly moonDetailsError = signal<string | null>(null);
  protected readonly moonDetails = signal<MoonDetails | null>(null);
  protected readonly yearLoading = signal(true);
  protected readonly yearError = signal<string | null>(null);
  protected readonly year = signal<MaramatakaYear | null>(null);
  protected readonly starMarkersLoading = signal(true);
  protected readonly starMarkersError = signal<string | null>(null);
  protected readonly starMarkers = signal<StarMarker[]>([]);
  protected readonly now = signal(new Date());
  protected readonly selectedDate = signal(this.api.formatDate(new Date()));
  private readonly selectedDateInstant = signal<Date | null>(null);
  protected readonly useLiveDate = signal(true);
  protected readonly selectedLocationName = computed(() => {
    const selectedLocation = this.locations().find(
      (location) => location.id === this.selectedLocationId(),
    );

    return selectedLocation?.name ?? 'Selected location';
  });

  ngOnInit(): void {
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

  protected onLocationChange(locationId: string): void {
    if (locationId === this.selectedLocationId()) {
      return;
    }

    this.selectedLocationId.set(locationId);
    this.reloadData();
  }

  protected onDateChange(date: string): void {
    if (!date || date === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(false);
    this.selectedDate.set(date);
    this.selectedDateInstant.set(this.nzMiddayForDate(date));
    this.reloadData();
  }

  protected selectDate(date: Date): void {
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

  protected selectNight(night: MaramatakaNight): void {
    this.selectDate(this.dateInsideNight(night));
  }

  protected selectYearMonth(month: MaramatakaYearMonth): void {
    this.selectDate(month.startsAt);
  }

  protected resetDateToToday(): void {
    const today = this.api.formatDate(new Date());
    if (this.useLiveDate() && today === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(true);
    this.selectedDate.set(today);
    this.selectedDateInstant.set(null);
    this.reloadData();
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
          this.starMarkersLoading.set(false);
          this.monthError.set(
            'Unable to load maramataka month because locations could not be loaded.',
          );
          this.cycleError.set(
            'Unable to load maramataka cycle because locations could not be loaded.',
          );
          this.todayError.set(
            'Unable to load the selected day because locations could not be loaded.',
          );
          this.moonDetailsError.set(
            'Unable to load moon details because locations could not be loaded.',
          );
          this.yearError.set(
            'Unable to load maramataka year because locations could not be loaded.',
          );
          this.starMarkersError.set(
            'Unable to load star markers because locations could not be loaded.',
          );
          this.locationsError.set(
            'Unable to load locations. Please try again.',
          );
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
    this.monthLoading.set(true);
    this.cycleLoading.set(true);
    this.todayLoading.set(true);
    this.moonDetailsLoading.set(true);
    this.yearLoading.set(true);
    this.starMarkersLoading.set(true);
    this.monthError.set(null);
    this.cycleError.set(null);
    this.todayError.set(null);
    this.moonDetailsError.set(null);
    this.yearError.set(null);
    this.starMarkersError.set(null);
    this.month.set(null);
    this.cycle.set(null);
    this.today.set(null);
    this.moonDetails.set(null);
    this.year.set(null);
    this.starMarkers.set([]);

    const generation = ++this.requestGeneration;

    this.api
      .getPageData(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageData) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.cycle.set(pageData.cycle);
          this.month.set(this.monthFromCycle(pageData.cycle));
          this.today.set(this.todayFromCycle(pageData.cycle));
          this.moonDetails.set(pageData.moonDetails);
          this.monthLoading.set(false);
          this.cycleLoading.set(false);
          this.todayLoading.set(false);
          this.moonDetailsLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.month.set(null);
          this.cycle.set(null);
          this.today.set(null);
          this.moonDetails.set(null);
          this.monthLoading.set(false);
          this.cycleLoading.set(false);
          this.todayLoading.set(false);
          this.moonDetailsLoading.set(false);
          this.monthError.set(
            'Unable to load maramataka month. Please try again.',
          );
          this.cycleError.set('Unable to load maramataka cycle anchors.');
          this.todayError.set(
            'Unable to load the selected day. Please try again.',
          );
          this.moonDetailsError.set('Unable to load moon details.');
        },
      });

    this.api
      .getStarMarkers(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (markers) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.starMarkers.set(markers);
          this.starMarkersLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.starMarkers.set([]);
          this.starMarkersLoading.set(false);
          this.starMarkersError.set('Unable to load dawn sky.');
        },
      });

    this.api
      .getYear(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (year) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.year.set(year);
          this.yearLoading.set(false);
        },
        error: (error: unknown) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.year.set(null);
          this.yearLoading.set(false);
          this.yearError.set(
            `Unable to load maramataka year timeline.${this.formatRequestError(error)}`,
          );
        },
      });
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

  private dateInsideNight(night: MaramatakaNight): Date {
    const startsAt = night.startsAt.getTime();
    const endsAt = night.endsAt.getTime();
    const oneMinuteAfterStart = startsAt + 60_000;

    if (oneMinuteAfterStart < endsAt) {
      return new Date(oneMinuteAfterStart);
    }

    return new Date(startsAt + Math.max(0, endsAt - startsAt) / 2);
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
