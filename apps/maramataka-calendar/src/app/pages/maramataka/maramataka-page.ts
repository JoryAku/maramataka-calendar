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
import { filter, fromEvent, merge } from 'rxjs';
import { MaramatakaMonthView } from './components/maramataka-month-view/maramataka-month-view';
import { MaramatakaApiService } from './maramataka-api.service';
import { LocationSummary, MaramatakaMonth, MaramatakaToday } from './maramataka.models';

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

  protected readonly locationsLoading = signal(true);
  protected readonly locationsError = signal<string | null>(null);
  protected readonly locations = signal<LocationSummary[]>([]);
  protected readonly selectedLocationId = signal<string | null>(null);
  protected readonly monthLoading = signal(true);
  protected readonly monthError = signal<string | null>(null);
  protected readonly month = signal<MaramatakaMonth | null>(null);
  protected readonly todayLoading = signal(true);
  protected readonly todayError = signal<string | null>(null);
  protected readonly today = signal<MaramatakaToday | null>(null);
  protected readonly now = signal(new Date());
  protected readonly hasNights = computed(
    () => (this.month()?.nights.length ?? 0) > 0
  );
  protected readonly selectedLocationName = computed(() => {
    const selectedLocation = this.locations().find(
      (location) => location.id === this.selectedLocationId()
    );

    return selectedLocation?.name ?? 'Selected location';
  });

  ngOnInit(): void {
    this.loadLocations();

    merge(fromEvent(window, 'focus'), fromEvent(document, 'visibilitychange'))
      .pipe(
        filter(() => !document.hidden),
        takeUntilDestroyed(this.destroyRef)
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
          this.todayLoading.set(false);
          this.monthError.set(
            'Unable to load maramataka month because locations could not be loaded.'
          );
          this.todayError.set(
            'Unable to load today\'s maramataka because locations could not be loaded.'
          );
          this.locationsError.set('Unable to load locations. Please try again.');
        },
      });
  }

  private reloadData(): void {
    const locationId = this.selectedLocationId();
    if (!locationId) {
      return;
    }

    const now = new Date();
    this.now.set(now);
    this.lastRequestedNzDate = this.api.formatDate(now);
    this.monthLoading.set(true);
    this.todayLoading.set(true);
    this.monthError.set(null);
    this.todayError.set(null);
    this.month.set(null);
    this.today.set(null);

    const generation = ++this.requestGeneration;

    this.api
      .getMonth(locationId, now)
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
          this.monthError.set('Unable to load maramataka month. Please try again.');
        },
      });

    this.api
      .getToday(locationId, now)
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
          this.todayError.set('Unable to load today\'s maramataka. Please try again.');
        },
      });
  }

  private refreshIfDateChanged(): void {
    if (this.locationsLoading() || !this.selectedLocationId()) {
      return;
    }

    const currentNzDate = this.api.formatDate(new Date());
    if (currentNzDate !== this.lastRequestedNzDate) {
      this.reloadData();
    }
  }
}