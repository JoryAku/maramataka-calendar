import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import {
  DawnMoon,
  DawnSunPath,
  DawnSunPathPoint,
  MaramatakaToday,
  MoonDetails,
  StarMarker,
} from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';
import { MaramatakaCopy } from '../../maramataka-copy';

type HorizonBody = {
  name: string;
  type: StarMarker['type'] | 'moon';
  visibility: StarMarker['visibility'];
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: string;
};

@Component({
  selector: 'app-maramataka-today-view',
  imports: [CommonModule],
  templateUrl: './maramataka-today-view.html',
  styleUrl: './maramataka-today-view.css',
})
export class MaramatakaTodayView {
  protected readonly nzTimeZone = NZ_TIMEZONE;
  private readonly moonVisualRadius = 42;
  private readonly moonVisualCenter = 50;
  protected readonly horizonAltitudeGuideLines = [45, 30, 15, 0];
  private readonly horizonAltitudeMin = 0;
  private readonly horizonAltitudeMax = 45;
  private readonly horizonPlotBottom = 12;
  private readonly horizonPlotHeight = 76;
  private readonly sunPathBelowHorizonMinAltitude = -18;
  private readonly sunPathBelowHorizonBottom = 4;
  private readonly dawnFieldMinAzimuth = 0;
  private readonly dawnFieldMaxAzimuth = 180;

  copy = input.required<MaramatakaCopy>();
  selectedLocationName = input.required<string>();
  todayLoading = input.required<boolean>();
  todayError = input<string | null>(null);
  today = input<MaramatakaToday | null>(null);
  now = input.required<Date>();
  moonDetailsLoading = input.required<boolean>();
  moonDetailsError = input<string | null>(null);
  moonDetails = input<MoonDetails | null>(null);
  starMarkersLoading = input.required<boolean>();
  starMarkersError = input<string | null>(null);
  starMarkers = input<StarMarker[]>([]);
  dawnSunPath = input<DawnSunPath | null>(null);
  dawnMoon = input<DawnMoon | null>(null);

  protected readonly countdownToNextMata = computed(() => {
    const today = this.today();
    if (!today) {
      return null;
    }

    const remainingMs = today.endsAt.getTime() - this.now().getTime();
    if (remainingMs <= 0) {
      return 'Now';
    }

    const totalMinutes = Math.ceil(remainingMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
      return `${minutes}m`;
    }

    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  });

  protected readonly illuminationPercent = computed(() => {
    const fraction = this.moonDetails()?.fractionIlluminated;

    return fraction === undefined ? null : Math.round(fraction * 100);
  });

  protected readonly moonVisual = computed(() => {
    const details = this.moonDetails();

    if (!details) {
      return null;
    }

    const fraction = Math.max(0, Math.min(1, details.fractionIlluminated));
    const isWaxing = this.isWaxingMoon();

    return {
      ariaLabel: `${details.phase}, ${Math.round(fraction * 100)}% illuminated`,
      litPath: this.moonLitPath(fraction, !isWaxing),
      litSide: isWaxing ? 'left' : 'right',
    };
  });

  protected readonly fishingGuidance = computed(() =>
    this.today()?.mata.contentLayers?.find(
      (layer) =>
        layer.id === 'fishing-guidance' && layer.status === 'available',
    ),
  );

  protected readonly dawnVisibleMarkers = computed(() =>
    this.starMarkers()
      .filter(
        (marker) =>
          marker.visibility !== 'below-horizon' &&
          this.isInDawnFieldOfView(marker),
      )
      .sort(
        (left, right) =>
          this.normalizedAzimuth(left) - this.normalizedAzimuth(right) ||
          this.starMarkerVisibilityRank(left) -
            this.starMarkerVisibilityRank(right) ||
          right.altitudeDegrees - left.altitudeDegrees ||
          left.name.localeCompare(right.name),
      ),
  );

  protected readonly dawnVisibleMoon = computed(() => {
    const moon = this.dawnMoon();

    if (
      !moon ||
      moon.visibility === 'below-horizon' ||
      !this.isInDawnFieldOfView(moon)
    ) {
      return null;
    }

    return moon;
  });

  protected readonly dawnVisibleBodies = computed(() => [
    ...this.dawnVisibleMarkers(),
    ...(this.dawnVisibleMoon() ? [this.dawnVisibleMoon()!] : []),
  ]);

  protected readonly dawnHiddenMarkerCount = computed(
    () =>
      this.starMarkers().filter(
        (marker) => marker.visibility === 'below-horizon',
      ).length,
  );

  protected readonly dawnOutOfViewMarkerCount = computed(
    () =>
      this.starMarkers().filter(
        (marker) =>
          marker.visibility !== 'below-horizon' &&
          !this.isInDawnFieldOfView(marker),
      ).length,
  );

  protected readonly dawnObservationTime = computed(
    () =>
      this.dawnVisibleMarkers()[0]?.observedAt ??
      this.starMarkers()[0]?.observedAt ??
      null,
  );

  protected readonly dawnSunPathPoints = computed(
    () =>
      this.dawnSunPath()?.points.filter((point) =>
        this.isSunPathPointInDawnField(point),
      ) ?? [],
  );

  protected readonly dawnSunSvgPath = computed(() => {
    const points = this.dawnSunPathPoints();

    if (points.length < 2) {
      return '';
    }

    return points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${this.sunPathPointLeft(point).toFixed(2)} ${this.sunPathPointTop(point).toFixed(2)}`;
      })
      .join(' ');
  });

  protected readonly dawnSunrisePoint = computed(() => {
    const points = this.dawnSunPathPoints();

    return points.length ? points[points.length - 1] : null;
  });

  protected readonly dawnMoonSummary = computed(() => {
    const details = this.moonDetails();
    const illumination = this.illuminationPercent();

    if (!details || illumination === null) {
      return null;
    }

    return `${details.phase}, ${illumination}% illuminated`;
  });

  protected horizonMarkerLeft(marker: HorizonBody): number {
    const normalizedAzimuth = this.normalizedAzimuth(marker);
    const clampedAzimuth = Math.max(
      this.dawnFieldMinAzimuth,
      Math.min(this.dawnFieldMaxAzimuth, normalizedAzimuth),
    );

    return (
      ((clampedAzimuth - this.dawnFieldMinAzimuth) /
        (this.dawnFieldMaxAzimuth - this.dawnFieldMinAzimuth)) *
      100
    );
  }

  protected horizonMarkerBottom(marker: HorizonBody): number {
    return this.horizonAltitudeBottom(marker.altitudeDegrees);
  }

  protected horizonAltitudeBottom(altitudeDegrees: number): number {
    const altitude = Math.max(
      this.horizonAltitudeMin,
      Math.min(this.horizonAltitudeMax, altitudeDegrees),
    );

    return (
      this.horizonPlotBottom +
      ((altitude - this.horizonAltitudeMin) /
        (this.horizonAltitudeMax - this.horizonAltitudeMin)) *
        this.horizonPlotHeight
    );
  }

  protected sunPathPointLeft(point: DawnSunPathPoint): number {
    const normalizedAzimuth = ((point.azimuthDegrees % 360) + 360) % 360;
    const clampedAzimuth = Math.max(
      this.dawnFieldMinAzimuth,
      Math.min(this.dawnFieldMaxAzimuth, normalizedAzimuth),
    );

    return (
      ((clampedAzimuth - this.dawnFieldMinAzimuth) /
        (this.dawnFieldMaxAzimuth - this.dawnFieldMinAzimuth)) *
      100
    );
  }

  protected sunPathPointBottom(point: DawnSunPathPoint): number {
    if (point.altitudeDegrees < this.horizonAltitudeMin) {
      const altitude = Math.max(
        this.sunPathBelowHorizonMinAltitude,
        point.altitudeDegrees,
      );

      return (
        this.sunPathBelowHorizonBottom +
        ((altitude - this.sunPathBelowHorizonMinAltitude) /
          (this.horizonAltitudeMin - this.sunPathBelowHorizonMinAltitude)) *
          (this.horizonPlotBottom - this.sunPathBelowHorizonBottom)
      );
    }

    return this.horizonAltitudeBottom(point.altitudeDegrees);
  }

  protected sunPathPointTop(point: DawnSunPathPoint): number {
    return 100 - this.sunPathPointBottom(point);
  }

  protected isHorizonMarkerClamped(marker: HorizonBody): boolean {
    return marker.altitudeDegrees > this.horizonAltitudeMax;
  }

  protected horizonMarkerClass(marker: HorizonBody): string {
    return [
      'horizon-marker',
      marker.visibility,
      marker.type,
    ].join(' ');
  }

  private isInDawnFieldOfView(marker: HorizonBody): boolean {
    const azimuth = this.normalizedAzimuth(marker);

    return (
      azimuth >= this.dawnFieldMinAzimuth &&
      azimuth <= this.dawnFieldMaxAzimuth
    );
  }

  private isSunPathPointInDawnField(point: DawnSunPathPoint): boolean {
    const azimuth = ((point.azimuthDegrees % 360) + 360) % 360;

    return (
      azimuth >= this.dawnFieldMinAzimuth &&
      azimuth <= this.dawnFieldMaxAzimuth
    );
  }

  private normalizedAzimuth(marker: HorizonBody): number {
    return ((marker.azimuthDegrees % 360) + 360) % 360;
  }

  private isWaxingMoon(): boolean {
    const mataIndex = this.today()?.mata.index;

    if (mataIndex !== undefined) {
      return mataIndex <= 16;
    }

    const phaseLabel = this.moonDetails()?.phase.toLowerCase() ?? '';

    return !phaseLabel.includes('waning');
  }

  private moonLitPath(fractionIlluminated: number, isWaxing: boolean): string {
    if (fractionIlluminated <= 0.005) {
      return '';
    }

    const center = this.moonVisualCenter;
    const radius = this.moonVisualRadius;

    if (fractionIlluminated >= 0.995) {
      return [
        `M ${center} ${center - radius}`,
        `A ${radius} ${radius} 0 1 1 ${center} ${center + radius}`,
        `A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`,
        'Z',
      ].join(' ');
    }

    const topY = center - radius;
    const bottomY = center + radius;
    const litSideArcSweep = isWaxing ? 1 : 0;
    const terminatorBias = 1 - 2 * fractionIlluminated;
    const terminatorControlX =
      center + (isWaxing ? 1 : -1) * terminatorBias * radius * 1.34;

    return [
      `M ${center} ${topY}`,
      `A ${radius} ${radius} 0 0 ${litSideArcSweep} ${center} ${bottomY}`,
      `C ${terminatorControlX.toFixed(2)} ${bottomY}`,
      `${terminatorControlX.toFixed(2)} ${topY}`,
      `${center} ${topY}`,
      'Z',
    ].join(' ');
  }

  protected starMarkerAltitudeLabel(marker: HorizonBody): string {
    if (marker.visibility === 'below-horizon') {
      return `${Math.abs(marker.altitudeDegrees)}° ${this.copy().today.belowHorizon}`;
    }

    return `${marker.altitudeDegrees}° ${this.copy().today.above} ${marker.direction}`;
  }

  protected starMarkerMetaLabel(marker: StarMarker): string {
    return [marker.englishName, this.starMarkerTypeLabel(marker.type)]
      .filter(Boolean)
      .join(' / ');
  }

  protected moonMetaLabel(moon: DawnMoon): string {
    return `${moon.phase}, ${Math.round(moon.fractionIlluminated * 100)}% illuminated`;
  }

  protected starMarkerVisibilityLabel(marker: HorizonBody): string {
    return marker.visibility === 'below-horizon'
      ? this.copy().today.visibility.belowHorizon
      : this.copy().today.visibility[marker.visibility];
  }

  private starMarkerTypeLabel(type: StarMarker['type']): string {
    switch (type) {
      case 'asterism':
        return this.copy().today.markerTypes.asterism;
      case 'planet':
        return this.copy().today.markerTypes.planet;
      case 'sky-figure':
        return this.copy().today.markerTypes.skyFigure;
      case 'star':
        return this.copy().today.markerTypes.star;
    }
  }

  private starMarkerVisibilityRank(marker: StarMarker): number {
    switch (marker.visibility) {
      case 'prominent':
        return 0;
      case 'visible':
        return 1;
      case 'low':
        return 2;
      case 'below-horizon':
        return 3;
    }
  }
}
