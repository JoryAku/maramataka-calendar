import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaYearEvent,
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
  private readonly phaseGroupTokens: Readonly<Record<string, string>> = {
    'Te Marama i te rā': 'te-marama-i-te-ra',
    'Te Hua': 'te-hua',
    'Tāmatea': 'tamatea',
    'Te Rākau': 'te-rakau',
    'Te Atarau': 'te-atarau',
    Korekore: 'korekore',
    Tangaroa: 'tangaroa',
  };
  protected readonly phaseLegend = [
    { name: 'Te Marama i te ra', token: 'te-marama-i-te-ra' },
    { name: 'Te Hua', token: 'te-hua' },
    { name: 'Tamatea', token: 'tamatea' },
    { name: 'Te Rakau', token: 'te-rakau' },
    { name: 'Te Atarau', token: 'te-atarau' },
    { name: 'Korekore', token: 'korekore' },
    { name: 'Tangaroa', token: 'tangaroa' },
  ] as const;
  private readonly wheelCenter = 50;
  private readonly outerRadius = 47;
  private readonly innerRadius = 31;
  private readonly labelRadius = 39;

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
  protected readonly hasUnknownPhaseGroup = computed(() =>
    this.month().nights.some((night) => this.phaseGroupToken(night) === 'unknown'),
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

  protected phaseGroupToken(night: MaramatakaNight): string {
    const phaseGroupName = night.phaseGroup?.name;

    if (!phaseGroupName) {
      return 'unknown';
    }

    return this.phaseGroupTokens[phaseGroupName] ?? 'unknown';
  }

  protected phaseGroupName(night: MaramatakaNight): string {
    return night.phaseGroup?.name ?? 'Unknown phase group';
  }

  protected segmentA11yLabel(night: MaramatakaNight): string {
    const anchor = this.anchorLabel(night);

    return [
      `${night.mata} (${this.phaseGroupName(night)})`,
      `moonrise ${this.formatNightStart(night)}`,
      anchor,
    ]
      .filter(Boolean)
      .join(', ');
  }

  protected segmentHoverLabel(night: MaramatakaNight): string {
    const anchor = this.anchorLabel(night);

    if (anchor) {
      return `${night.mata} (${this.phaseGroupName(night)}) - ${anchor}`;
    }

    return `${night.mata} (${this.phaseGroupName(night)})`;
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

    return null;
  }

  eventsForNight(night: MaramatakaNight): MaramatakaYearEvent[] {
    const startsAt = night.startsAt.getTime();
    const endsAt = night.endsAt.getTime();

    return this.yearEvents()
      .filter(
        (event) =>
          event.type !== 'month-start' &&
          event.occursAt.getTime() >= startsAt &&
          event.occursAt.getTime() < endsAt,
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
  }

  eventSymbol(event: MaramatakaYearEvent): string {
    switch (event.type) {
      case 'star-marker':
        return '★';
      case 'star-invisibility':
        return '◌';
      case 'new-moon':
        return '◐';
      case 'full-moon':
        return '●';
      case 'public-holiday':
        return '✦';
      case 'month-start':
        return '◇';
    }
  }

  eventTypeLabel(event: MaramatakaYearEvent): string {
    switch (event.type) {
      case 'star-marker':
        return event.starMarkerScope === 'seasonal'
          ? 'Seasonal'
          : 'Star';
      case 'star-invisibility':
        return 'Disappears';
      case 'new-moon':
        return 'New Moon';
      case 'full-moon':
        return 'Full Moon';
      case 'public-holiday':
        return 'Holiday';
      case 'month-start':
        return 'Month start';
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
