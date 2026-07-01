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
  private readonly wheelCenter = 50;
  private readonly outerRadius = 47;
  private readonly innerRadius = 31;
  private readonly labelRadius = 39;

  month = input.required<MaramatakaMonth>();
  now = input.required<Date>();
  cycle = input<MaramatakaCycleDetails | null>(null);

  protected readonly cycleStarMarkers = computed(() => {
    const cycleMarkers = this.cycle()?.starMarkers ?? [];

    return cycleMarkers.slice(0, 4);
  });
  protected readonly starMonth = computed(() => this.cycle()?.starMonth);

  protected readonly wheelSegments = computed(() => {
    const nights = this.month().nights;
    const total = nights.length;
    const segmentAngle = total ? 360 / total : 0;
    const gapAngle = Math.min(1.1, segmentAngle * 0.16);

    return nights.map((night, index) => {
      const startAngle = -90 + segmentAngle * index + gapAngle / 2;
      const endAngle = -90 + segmentAngle * (index + 1) - gapAngle / 2;
      const labelPoint = this.polarToCartesian(
        this.labelRadius,
        startAngle + segmentAngle / 2,
      );

      return {
        night,
        index,
        path: this.describeSegment(startAngle, endAngle),
        labelX: labelPoint.x,
        labelY: labelPoint.y,
        isCurrent: this.isCurrentNight(night),
        isFullMoonAnchor: this.isFullMoonAnchor(night),
        hasOverlap: (night.overlappingMata?.length ?? 0) > 0,
      };
    });
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

  private describeSegment(startAngle: number, endAngle: number): string {
    const outerStart = this.polarToCartesian(this.outerRadius, startAngle);
    const outerEnd = this.polarToCartesian(this.outerRadius, endAngle);
    const innerEnd = this.polarToCartesian(this.innerRadius, endAngle);
    const innerStart = this.polarToCartesian(this.innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${this.outerRadius} ${this.outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${this.innerRadius} ${this.innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  }

  private polarToCartesian(
    radius: number,
    angleInDegrees: number,
  ): { x: string; y: string } {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;

    return {
      x: (this.wheelCenter + radius * Math.cos(angleInRadians)).toFixed(3),
      y: (this.wheelCenter + radius * Math.sin(angleInRadians)).toFixed(3),
    };
  }
}
