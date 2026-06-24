import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MaramatakaMonth, MaramatakaNight } from '../../maramataka.models';
import { MaramatakaNightCard } from '../maramataka-night-card/maramataka-night-card';

@Component({
  selector: 'app-maramataka-month-view',
  imports: [CommonModule, MaramatakaNightCard],
  templateUrl: './maramataka-month-view.html',
  styleUrl: './maramataka-month-view.css',
})
export class MaramatakaMonthView {
  protected readonly nzTimeZone = 'Pacific/Auckland';

  month = input.required<MaramatakaMonth>();
  now = input.required<Date>();

  isCurrentNight(night: MaramatakaNight): boolean {
    const currentTime = this.now().getTime();

    return (
      currentTime >= night.startsAt.getTime() &&
      currentTime < night.endsAt.getTime()
    );
  }
}
