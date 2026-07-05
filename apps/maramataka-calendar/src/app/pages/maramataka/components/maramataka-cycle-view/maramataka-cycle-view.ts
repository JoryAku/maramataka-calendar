import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MaramatakaMonthView } from '../maramataka-month-view/maramataka-month-view';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaYearEvent,
} from '../../maramataka.models';

@Component({
  selector: 'app-maramataka-cycle-view',
  imports: [CommonModule, MaramatakaMonthView],
  templateUrl: './maramataka-cycle-view.html',
  styleUrl: './maramataka-cycle-view.css',
})
export class MaramatakaCycleView {
  selectedLocationName = input.required<string>();
  monthLoading = input.required<boolean>();
  monthError = input<string | null>(null);
  month = input<MaramatakaMonth | null>(null);
  cycleLoading = input.required<boolean>();
  cycleError = input<string | null>(null);
  cycle = input<MaramatakaCycleDetails | null>(null);
  yearEvents = input<MaramatakaYearEvent[]>([]);
  now = input.required<Date>();
  nightSelected = output<MaramatakaNight>();

  protected readonly hasNights = computed(
    () => (this.month()?.nights.length ?? 0) > 0,
  );

  protected selectNight(night: MaramatakaNight): void {
    this.nightSelected.emit(night);
  }
}
