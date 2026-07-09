import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MaramatakaCycleView } from './components/maramataka-cycle-view/maramataka-cycle-view';
import { MaramatakaTodayView } from './components/maramataka-today-view/maramataka-today-view';
import { MaramatakaYearView } from './components/maramataka-year-view/maramataka-year-view';
import { MaramatakaDataStore } from './maramataka-data.store';
import {
  MaramatakaNight,
  MaramatakaYearMonth,
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
  providers: [MaramatakaDataStore],
})
export class MaramatakaPage implements OnInit {
  protected readonly store = inject(MaramatakaDataStore);

  ngOnInit(): void {
    this.store.initialize();
  }

  protected onLocationChange(locationId: string): void {
    this.store.selectLocation(locationId);
  }

  protected onDateChange(date: string): void {
    this.store.selectDateString(date);
  }

  protected onLanguageChange(language: string): void {
    this.store.selectLanguage(language);
  }

  protected selectDate(date: Date): void {
    this.store.selectDate(date);
  }

  protected selectNight(night: MaramatakaNight): void {
    this.selectDate(this.dateInsideNight(night));
  }

  protected selectYearMonth(month: MaramatakaYearMonth): void {
    this.selectDate(month.startsAt);
  }

  protected resetDateToToday(): void {
    this.store.resetDateToToday();
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
}
