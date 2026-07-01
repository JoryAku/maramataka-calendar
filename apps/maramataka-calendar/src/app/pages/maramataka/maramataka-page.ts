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
import { MaramatakaMonthView } from './components/maramataka-month-view/maramataka-month-view';
import { MaramatakaApiService } from './maramataka-api.service';
import {
  LocationSummary,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaToday,
  MoonDetails,
  StarMarker,
} from './maramataka.models';
import { NZ_TIMEZONE } from './maramataka.constants';

@Component({
  selector: 'app-maramataka-page',
  imports: [CommonModule, MaramatakaMonthView],
  templateUrl: './maramataka-page.html',
  styleUrl: './maramataka-page.css',
})
export class MaramatakaPage implements OnInit {
  private readonly api = inject(MaramatakaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private requestGeneration = 0;
  private lastRequestedNzDate: string | null = null;

  protected readonly nzTimeZone = NZ_TIMEZONE;
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
  protected readonly starMarkersLoading = signal(true);
  protected readonly starMarkersError = signal<string | null>(null);
  protected readonly starMarkers = signal<StarMarker[]>([]);
  protected readonly now = signal(new Date());
  protected readonly selectedDate = signal(this.api.formatDate(new Date()));
  protected readonly useLiveDate = signal(true);
  protected readonly hasNights = computed(
    () => (this.month()?.nights.length ?? 0) > 0,
  );
  protected readonly selectedLocationName = computed(() => {
    const selectedLocation = this.locations().find(
      (location) => location.id === this.selectedLocationId(),
    );

    return selectedLocation?.name ?? 'Selected location';
  });
  protected readonly countdownToNextMata = computed(() => {
    const today = this.today();
    if (!today) {
      return null;
    }

    const remainingMs = today.endsAt.getTime() - this.now().getTime();
    if (remainingMs <= 0) {
      return 'Now';
    }

    const totalMinutes = Math.ceil(remainingMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      return `${minutes}m`;
    }

    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  });
  protected readonly illuminationPercent = computed(() => {
    const fraction = this.moonDetails()?.fractionIlluminated;

    return fraction === undefined ? null : Math.round(fraction * 100);
  });
  protected readonly fishingGuidance = computed(() =>
    this.today()?.mata.contentLayers?.find(
      (layer) =>
        layer.id === 'fishing-guidance' && layer.status === 'available',
    ),
  );
  protected readonly visibleStarMarkers = computed(() =>
    this.relevantStarMarkers(this.starMarkers()).slice(0, 3),
  );
  protected readonly starMonthNaming = computed(
    () =>
      this.cycle()?.ruleSet.starMonthNaming ??
      this.month()?.ruleSet.starMonthNaming ??
      this.today()?.ruleSet.starMonthNaming,
  );
  protected readonly starMonth = computed(() => this.cycle()?.starMonth);

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
    this.reloadData();
  }

  protected resetDateToToday(): void {
    const today = this.api.formatDate(new Date());
    if (this.useLiveDate() && today === this.selectedDate()) {
      return;
    }

    this.useLiveDate.set(true);
    this.selectedDate.set(today);
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
    this.starMarkersLoading.set(true);
    this.monthError.set(null);
    this.cycleError.set(null);
    this.todayError.set(null);
    this.moonDetailsError.set(null);
    this.starMarkersError.set(null);
    this.month.set(null);
    this.cycle.set(null);
    this.today.set(null);
    this.moonDetails.set(null);
    this.starMarkers.set([]);

    const generation = ++this.requestGeneration;

    this.api
      .getMonth(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (month) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.month.set(month);
          this.monthLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.month.set(null);
          this.monthLoading.set(false);
          this.monthError.set(
            'Unable to load maramataka month. Please try again.',
          );
        },
      });

    this.api
      .getCycleDetails(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cycle) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.cycle.set(cycle);
          this.cycleLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.cycle.set(null);
          this.cycleLoading.set(false);
          this.cycleError.set('Unable to load maramataka cycle anchors.');
        },
      });

    this.api
      .getToday(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (today) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.today.set(today);
          this.todayLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.today.set(null);
          this.todayLoading.set(false);
          this.todayError.set(
            'Unable to load the selected day. Please try again.',
          );
        },
      });

    this.api
      .getMoonDetails(locationId, requestDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.moonDetails.set(details);
          this.moonDetailsLoading.set(false);
        },
        error: () => {
          if (generation !== this.requestGeneration) {
            return;
          }

          this.moonDetails.set(null);
          this.moonDetailsLoading.set(false);
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
          this.starMarkersError.set('Unable to load star markers.');
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

  private requestDate(): Date {
    if (this.useLiveDate()) {
      return new Date();
    }

    return this.nzMiddayForDate(this.selectedDate());
  }

  private nzMiddayForDate(localDate: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      return new Date();
    }

    return new Date(`${localDate}T12:00:00+12:00`);
  }

  private relevantStarMarkers(markers: StarMarker[]): StarMarker[] {
    const markerIds = this.starMonth()?.note?.markerIds;
    if (markerIds?.length) {
      return markers.filter((marker) => markerIds.includes(marker.id));
    }

    const visibleMarkers = markers.filter(
      (marker) => marker.visibility !== 'below-horizon',
    );
    const starMonthMarkerId = this.starMonth()?.marker?.id;
    if (starMonthMarkerId) {
      return visibleMarkers.filter((marker) => marker.id === starMonthMarkerId);
    }

    return visibleMarkers;
  }
}
