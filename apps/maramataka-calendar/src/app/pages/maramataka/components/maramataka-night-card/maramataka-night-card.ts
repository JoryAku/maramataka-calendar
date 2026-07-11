import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { formatDateInTimeZone } from '../../maramataka-date-format';
import { MaramatakaNight } from '../../maramataka.models';

@Component({
  selector: 'app-maramataka-night-card',
  imports: [CommonModule],
  templateUrl: './maramataka-night-card.html',
  styleUrl: './maramataka-night-card.css',
})
export class MaramatakaNightCard {
  night = input.required<MaramatakaNight>();
  timeZone = input.required<string>();
  isCurrent = input(false);

  protected formatNightStart(): string {
    return formatDateInTimeZone(this.night().startsAt, this.timeZone(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
