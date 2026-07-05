import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import {
  MaramatakaYear,
  MaramatakaYearEvent,
  MaramatakaYearMonth,
} from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';

type YearEventLayoutGroup =
  | 'star-marker'
  | 'seasonal-marker'
  | 'star-invisibility'
  | 'public-holiday'
  | 'solar-season'
  | 'lunar-phase';

@Component({
  selector: 'app-maramataka-year-view',
  imports: [CommonModule],
  templateUrl: './maramataka-year-view.html',
})
export class MaramatakaYearView {
  protected readonly nzTimeZone = NZ_TIMEZONE;

  yearLoading = input.required<boolean>();
  yearError = input<string | null>(null);
  year = input<MaramatakaYear | null>(null);
  selectedDate = input<Date | null>(null);
  monthSelected = output<MaramatakaYearMonth>();

  private readonly yearEventLayout = computed(
    () => this.computeYearEventLayout(),
  );

  protected selectYearMonth(month: MaramatakaYearMonth): void {
    this.monthSelected.emit(month);
  }

  protected yearEventOffsetPercent(event: MaramatakaYearEvent): number {
    return this.yearEventLayout().get(this.yearEventLayoutKey(event))?.offset ?? 0;
  }

  protected yearEventClass(event: MaramatakaYearEvent): string {
    const lane = this.yearEventLane(event);
    const group = this.yearEventLayoutGroupForEvent(event);
    const classes = ['year-event', event.type, `lane-${lane}`];

    if (group) {
      classes.push(group);
    }

    if (lane === 0) {
      classes.push('compact-label');
    }

    return classes.join(' ');
  }

  protected yearEventTopRem(event: MaramatakaYearEvent): number {
    const lane = this.yearEventLane(event);

    switch (event.type) {
      case 'star-marker':
        if (event.starMarkerScope === 'seasonal') {
          return lane === 0 ? 7.3 : 4.9;
        }

        return 0.8 + lane * 2.8;
      case 'star-appearance':
      case 'star-invisibility':
        return 13 + lane * 1.8;
      case 'solar-season':
        return 14.9;
      case 'new-moon':
      case 'full-moon':
        return 21.2 + lane * 1.25;
      case 'public-holiday':
        return 25.1;
      case 'month-start':
        return 29.2;
    }
  }

  protected yearEventSymbol(event: MaramatakaYearEvent): string {
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
      case 'solar-season':
        return '☼';
      case 'month-start':
        return '◇';
    }
  }

  protected yearEventTypeLabel(event: MaramatakaYearEvent): string {
    switch (event.type) {
      case 'star-marker':
        return event.starMarkerScope === 'seasonal'
          ? 'Seasonal'
          : 'Star';
      case 'star-appearance':
        return 'Appears';
      case 'star-invisibility':
        return 'Disappears';
      case 'new-moon':
        return 'New Moon';
      case 'full-moon':
        return 'Full Moon';
      case 'public-holiday':
        return 'Holiday';
      case 'solar-season':
        return 'Solar';
      case 'month-start':
        return 'Month start';
    }
  }

  protected yearEventDateLabel(event: MaramatakaYearEvent): string {
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: this.nzTimeZone,
      day: 'numeric',
      month: 'short',
      ...(event.type === 'public-holiday'
        ? { year: 'numeric' }
        : event.type === 'star-invisibility'
          ? { year: 'numeric' }
          : { hour: 'numeric', minute: '2-digit' }),
    }).format(event.occursAt);
  }

  protected yearMonthOffsetPercent(month: MaramatakaYearMonth): number {
    const year = this.year();
    if (!year) {
      return 0;
    }

    const duration = year.endsAt.getTime() - year.startsAt.getTime();
    if (duration <= 0) {
      return 0;
    }

    const rawOffset =
      ((month.startsAt.getTime() - year.startsAt.getTime()) / duration) *
      100;
    const offset = this.yearTimelineOffsetPercent(rawOffset);

    return Math.min(100, Math.max(0, offset));
  }

  protected selectedDateOffsetPercent(): number | null {
    const year = this.year();
    const selectedDate = this.selectedDate();
    if (!year || !selectedDate) {
      return null;
    }

    const duration = year.endsAt.getTime() - year.startsAt.getTime();
    if (duration <= 0) {
      return null;
    }

    const rawOffset =
      ((selectedDate.getTime() - year.startsAt.getTime()) / duration) * 100;

    if (rawOffset < 0 || rawOffset > 100) {
      return null;
    }

    return Math.min(
      100,
      Math.max(0, this.yearTimelineOffsetPercent(rawOffset)),
    );
  }

  protected selectedDateLabel(): string {
    const selectedDate = this.selectedDate();
    if (!selectedDate) {
      return '';
    }

    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: this.nzTimeZone,
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(selectedDate);
  }

  protected yearEventAriaLabel(event: MaramatakaYearEvent): string {
    const parts = [
      event.name,
      this.formatShortDate(event.occursAt),
      event.monthName,
      event.description,
    ].filter(Boolean);

    return parts.join(', ');
  }

  protected yearMaramaAriaLabel(month: MaramatakaYearMonth): string {
    const parts = [
      month.name,
      `Whiro ${this.formatShortDate(month.anchors.whiro.occursAt)}`,
    ];

    if (month.anchors.fullMoon) {
      parts.push(
        `Full Moon ${this.formatShortDate(month.anchors.fullMoon.occursAt)}`,
      );
    }

    parts.push(
      `next Whiro ${this.formatShortDate(month.anchors.nextWhiro.occursAt)}`,
    );

    return parts.join(', ');
  }

  private yearEventLane(event: MaramatakaYearEvent): number {
    return this.yearEventLayout().get(this.yearEventLayoutKey(event))?.lane ?? 0;
  }

  private computeYearEventLayout(): Map<string, { offset: number; lane: number }> {
    const layout = new Map<string, { offset: number; lane: number }>();
    const year = this.year();

    if (!year) {
      return layout;
    }

    const duration = year.endsAt.getTime() - year.startsAt.getTime();
    if (duration <= 0) {
      return layout;
    }

    const layoutGroups: Array<{
      key: YearEventLayoutGroup;
      types: MaramatakaYearEvent['type'][];
    }> = [
      { key: 'star-marker', types: ['star-marker'] },
      { key: 'seasonal-marker', types: ['star-marker'] },
      { key: 'star-invisibility', types: ['star-appearance', 'star-invisibility'] },
      { key: 'public-holiday', types: ['public-holiday'] },
      { key: 'solar-season', types: ['solar-season'] },
      { key: 'lunar-phase', types: ['new-moon', 'full-moon'] },
    ];

    for (const group of layoutGroups) {
      const events = year.events
        .filter(
          (event) =>
            group.types.includes(event.type) &&
            this.yearEventLayoutGroupForEvent(event) === group.key,
        )
        .slice()
        .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());

      const laneCount = this.yearEventLaneCount(group.key);
      const minGapPercent = this.yearEventMinLaneGapPercent(group.key);
      const laneLastOffsets = Array.from({ length: laneCount }, () => -Infinity);

      for (const event of events) {
        const rawOffset =
          ((event.occursAt.getTime() - year.startsAt.getTime()) / duration) *
          100;
        const offset = Math.min(
          100,
          Math.max(0, this.yearTimelineOffsetPercent(rawOffset)),
        );

        let lane = 0;
        if (laneCount > 1) {
          const openLane = laneLastOffsets.findIndex(
            (lastOffset) => offset - lastOffset >= minGapPercent,
          );
          if (openLane >= 0) {
            lane = openLane;
          } else {
            lane = laneLastOffsets.indexOf(Math.min(...laneLastOffsets));
          }
        }

        laneLastOffsets[lane] = offset;
        layout.set(this.yearEventLayoutKey(event), { offset, lane });
      }
    }

    return layout;
  }

  private yearEventLayoutKey(event: MaramatakaYearEvent): string {
    return `${event.type}|${event.name}|${event.occursAt.toISOString()}`;
  }

  private yearEventLayoutGroupForEvent(
    event: MaramatakaYearEvent,
  ): YearEventLayoutGroup | null {
    switch (event.type) {
      case 'star-marker':
        return event.starMarkerScope === 'seasonal'
          ? 'seasonal-marker'
          : 'star-marker';
      case 'star-appearance':
      case 'star-invisibility':
        return 'star-invisibility';
      case 'public-holiday':
        return 'public-holiday';
      case 'solar-season':
        return 'solar-season';
      case 'new-moon':
      case 'full-moon':
        return 'lunar-phase';
      case 'month-start':
        return null;
    }
  }

  private yearEventLaneCount(group: YearEventLayoutGroup): number {
    switch (group) {
      case 'star-marker':
      case 'seasonal-marker':
      case 'star-invisibility':
        return 2;
      case 'public-holiday':
      case 'solar-season':
        return 1;
      case 'lunar-phase':
        return 3;
    }
  }

  private yearEventMinLaneGapPercent(group: YearEventLayoutGroup): number {
    switch (group) {
      case 'star-marker':
      case 'seasonal-marker':
      case 'star-invisibility':
        return 4;
      case 'public-holiday':
      case 'solar-season':
        return 0;
      case 'lunar-phase':
        return 2.8;
    }
  }

  private yearTimelineOffsetPercent(rawOffset: number): number {
    const startInsetPercent = 6.5;

    return startInsetPercent + rawOffset * (1 - startInsetPercent / 100);
  }

  private formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: this.nzTimeZone,
      day: 'numeric',
      month: 'short',
    }).format(date);
  }
}
