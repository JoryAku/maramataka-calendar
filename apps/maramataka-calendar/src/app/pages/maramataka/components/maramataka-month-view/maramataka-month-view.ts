import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
} from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';

@Component({
  selector: 'app-maramataka-month-view',
  imports: [CommonModule],
  templateUrl: './maramataka-month-view.html',
  styleUrl: './maramataka-month-view.css',
})
export class MaramatakaMonthView {
  protected readonly nzTimeZone = NZ_TIMEZONE;

  month = input.required<MaramatakaMonth>();
  now = input.required<Date>();
  cycle = input<MaramatakaCycleDetails | null>(null);

  protected readonly wheelNights = computed(() => {
    const nights = this.month().nights;
    const total = nights.length;

    return nights.map((night, index) => ({
      night,
      index,
      rotation: total ? (360 / total) * index : 0,
      labelRotation: total ? -(360 / total) * index : 0,
      isCurrent: this.isCurrentNight(night),
      isFullMoonAnchor: this.isFullMoonAnchor(night),
      hasOverlap: (night.overlappingMata?.length ?? 0) > 0,
    }));
  });

  protected readonly repeatedMata = computed(() => {
    const counts = new Map<string, number>();
    for (const night of this.month().nights) {
      counts.set(night.mata, (counts.get(night.mata) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name, count]) => `${name} x${count}`);
  });

  protected readonly hasBalancedLength = computed(
    () => this.month().nights.length !== 30 || this.repeatedMata().length > 0,
  );

  isCurrentNight(night: MaramatakaNight): boolean {
    const currentTime = this.now().getTime();

    return (
      currentTime >= night.startsAt.getTime() &&
      currentTime < night.endsAt.getTime()
    );
  }

  anchorLabel(night: MaramatakaNight): string | null {
    const cycle = this.cycle();
    const fullMoon = cycle?.anchors.fullMoon;

    if (night.startsAt.getTime() === this.month().whiroStartsAt.getTime()) {
      return 'Whiro';
    }

    if (
      fullMoon &&
      fullMoon.occursAt.getTime() >= night.startsAt.getTime() &&
      fullMoon.occursAt.getTime() < night.endsAt.getTime()
    ) {
      return 'Rakaunui / Full Moon';
    }

    if (cycle?.anchors.nextWhiro.occursAt.getTime() === night.endsAt.getTime()) {
      return 'Next Whiro';
    }

    return null;
  }

  private isFullMoonAnchor(night: MaramatakaNight): boolean {
    const fullMoon = this.cycle()?.anchors.fullMoon;

    return Boolean(
      fullMoon &&
        fullMoon.occursAt.getTime() >= night.startsAt.getTime() &&
        fullMoon.occursAt.getTime() < night.endsAt.getTime(),
    );
  }
}
