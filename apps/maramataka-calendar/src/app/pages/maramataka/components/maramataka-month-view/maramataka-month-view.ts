import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaYearEvent,
} from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';
import { MaramatakaCopy } from '../../maramataka-copy';

type MonthNightEvent = MaramatakaYearEvent & {
  type: Exclude<MaramatakaYearEvent['type'], 'month-start'>;
};

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

  copy = input.required<MaramatakaCopy>();
  month = input.required<MaramatakaMonth>();
  now = input.required<Date>();
  cycle = input<MaramatakaCycleDetails | null>(null);
  yearEvents = input<MaramatakaYearEvent[]>([]);
  nightSelected = output<MaramatakaNight>();

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
    const midpointIndex = total ? Math.ceil(total / 2) : 0;

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
        fill: this.segmentFill(index, midpointIndex, total),
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

  protected selectNight(night: MaramatakaNight): void {
    this.nightSelected.emit(night);
  }


  protected segmentA11yLabel(night: MaramatakaNight): string {
    const anchor = this.anchorLabel(night);

    return [
      night.mata,
      `${this.copy().cycle.moonrise} ${this.formatNightStart(night)}`,
      anchor,
    ]
      .filter(Boolean)
      .join(', ');
  }

  protected segmentHoverLabel(night: MaramatakaNight): string {
    const anchor = this.anchorLabel(night);

    if (anchor) {
      return `${night.mata} - ${anchor}`;
    }

    return night.mata;
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
      return `Rākaunui / ${this.copy().cycle.fullMoon}`;
    }

    return null;
  }

  eventsForNight(night: MaramatakaNight): MonthNightEvent[] {
    const startsAt = night.startsAt.getTime();
    const endsAt = night.endsAt.getTime();

    return this.yearEvents()
      .filter(
        (event): event is MonthNightEvent =>
          event.type !== 'month-start' &&
          event.occursAt.getTime() >= startsAt &&
          event.occursAt.getTime() < endsAt,
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
  }

  eventSymbol(event: MonthNightEvent): string {
    switch (event.type) {
      case 'star-marker':
        return '★';
      case 'star-appearance':
        return '◉';
      case 'star-invisibility':
        return '◌';
      case 'new-moon':
        return '○';
      case 'full-moon':
        return '●';
      case 'public-holiday':
        return '✦';
      case 'sunrise-extreme':
        return '↕';
    }
  }

  eventTypeLabel(event: MonthNightEvent): string {
    switch (event.type) {
      case 'star-marker':
        return event.starMarkerScope === 'seasonal'
          ? this.copy().year.eventTypes.seasonal
          : this.copy().year.eventTypes.star;
      case 'star-appearance':
        return this.copy().year.eventTypes.appears;
      case 'star-invisibility':
        return this.copy().year.eventTypes.disappears;
      case 'new-moon':
        return this.copy().year.eventTypes.newMoon;
      case 'full-moon':
        return this.copy().year.eventTypes.fullMoon;
      case 'public-holiday':
        return this.copy().year.eventTypes.holiday;
      case 'sunrise-extreme':
        return this.copy().year.eventTypes.sunriseLimit;
    }
  }

  private isFullMoonAnchor(night: MaramatakaNight): boolean {
    const fullMoon = this.cycle()?.anchors.fullMoon;

    return Boolean(
      fullMoon &&
        fullMoon.occursAt.getTime() >= night.startsAt.getTime() &&
        fullMoon.occursAt.getTime() < night.endsAt.getTime(),
    );
  }

  private segmentFill(
    index: number,
    midpointIndex: number,
    total: number,
  ): string {
    if (!total) {
      return '#5f7480';
    }

    const progress =
      index <= midpointIndex
        ? midpointIndex === 0
          ? 0.5
          : (index / midpointIndex) * 0.5
        : total - 1 === midpointIndex
          ? 0.5
          : 0.5 + ((index - midpointIndex) / (total - 1 - midpointIndex)) * 0.5;

    const ramp = ['#4a6476', '#e0b34f', '#4a6476'];

    return this.samplePalette(ramp, progress);
  }

  private samplePalette(colors: string[], ratio: number): string {
    if (colors.length === 1) {
      return colors[0];
    }

    const scaled = ratio * (colors.length - 1);
    const startIndex = Math.min(colors.length - 2, Math.floor(scaled));
    const endIndex = startIndex + 1;
    const localRatio = scaled - startIndex;

    return this.mixHex(colors[startIndex], colors[endIndex], localRatio);
  }

  private mixHex(startColor: string, endColor: string, ratio: number): string {
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);

    const red = Math.round(this.interpolate(start.red, end.red, ratio));
    const green = Math.round(this.interpolate(start.green, end.green, ratio));
    const blue = Math.round(this.interpolate(start.blue, end.blue, ratio));

    return `rgb(${red} ${green} ${blue})`;
  }

  private hexToRgb(color: string): { red: number; green: number; blue: number } {
    const value = color.replace('#', '');
    const red = Number.parseInt(value.slice(0, 2), 16);
    const green = Number.parseInt(value.slice(2, 4), 16);
    const blue = Number.parseInt(value.slice(4, 6), 16);

    return { red, green, blue };
  }

  private interpolate(start: number, end: number, ratio: number): number {
    return start + (end - start) * ratio;
  }

  private formatNightStart(night: MaramatakaNight): string {
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: this.nzTimeZone,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(night.startsAt);
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
