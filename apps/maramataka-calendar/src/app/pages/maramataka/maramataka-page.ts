import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MaramatakaMonthView } from './components/maramataka-month-view/maramataka-month-view';
import { ApiMaramatakaMonth, ApiMata, MaramatakaMonth } from './maramataka.models';

const DEFAULT_LOCATION = {
  latitude: -41.2865,
  longitude: 174.7762,
};
const DEFAULT_TIMEZONE_OFFSET = 12;
const NZ_TIMEZONE = 'Pacific/Auckland';

@Component({
  selector: 'app-maramataka-page',
  imports: [CommonModule, MaramatakaMonthView],
  templateUrl: './maramataka-page.html',
  styleUrl: './maramataka-page.css',
})
export class MaramatakaPage implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly month = signal<MaramatakaMonth | null>(null);
  protected readonly now = signal(new Date());
  protected readonly hasNights = computed(
    () => (this.month()?.nights.length ?? 0) > 0
  );

  ngOnInit(): void {
    this.loadMonth();
  }

  private loadMonth(): void {
    this.loading.set(true);
    this.error.set(null);

    const now = new Date();
    this.now.set(now);

    const params = new HttpParams()
      .set('date', this.toYyyyMmDd(now))
      .set('lat', String(DEFAULT_LOCATION.latitude))
      .set('lon', String(DEFAULT_LOCATION.longitude))
      .set('tz', String(this.getNzTimezoneOffset(now)));

    this.http
      .get<ApiMaramatakaMonth>('/api/maramataka/month', { params })
      .subscribe({
        next: (response) => {
          this.month.set(this.mapMonth(response));
          this.loading.set(false);
        },
        error: () => {
          this.month.set(null);
          this.error.set('Unable to load maramataka month. Please try again.');
          this.loading.set(false);
        },
      });
  }

  private mapMonth(apiMonth: ApiMaramatakaMonth): MaramatakaMonth {
    return {
      version: apiMonth.version,
      whiroStartsAt: new Date(apiMonth.whiroStartsAt),
      nights: apiMonth.nights.map((night) => ({
        mata: this.mataName(night.mata),
        startsAt: new Date(night.startsAt),
        endsAt: new Date(night.endsAt),
      })),
    };
  }

  private mataName(mata: string | ApiMata): string {
    if (typeof mata === 'string') {
      return mata;
    }

    return mata.name;
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
      const fallbackYear = date.getUTCFullYear();
      const fallbackMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
      const fallbackDay = String(date.getUTCDate()).padStart(2, '0');

      return `${fallbackYear}-${fallbackMonth}-${fallbackDay}`;
    }

    return `${year}-${month}-${day}`;
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
      return DEFAULT_TIMEZONE_OFFSET;
    }

    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? '0');

    if (minutes !== 0 || !Number.isFinite(hours)) {
      return DEFAULT_TIMEZONE_OFFSET;
    }

    return sign * hours;
  }
}
