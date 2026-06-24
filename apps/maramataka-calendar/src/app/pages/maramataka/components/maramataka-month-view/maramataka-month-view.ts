import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MaramatakaMonth, MaramatakaNight } from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';
import { MaramatakaNightCard } from '../maramataka-night-card/maramataka-night-card';

@Component({
  selector: 'app-maramataka-month-view',
  imports: [CommonModule, MaramatakaNightCard],
  templateUrl: './maramataka-month-view.html',
  styleUrl: './maramataka-month-view.css',
})
export class MaramatakaMonthView {
  protected readonly nzTimeZone = NZ_TIMEZONE;

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
