import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import {
  MaramatakaToday,
  MoonDetails,
  StarMarker,
} from '../../maramataka.models';
import { NZ_TIMEZONE } from '../../maramataka.constants';

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
  private readonly dawnFieldMinAzimuth = 0;
  private readonly dawnFieldMaxAzimuth = 180;

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

  protected readonly dawnMoonSummary = computed(() => {
    const details = this.moonDetails();
    const illumination = this.illuminationPercent();

    if (!details || illumination === null) {
      return null;
    }

    return `${details.phase}, ${illumination}% illuminated`;
  });

  protected horizonMarkerLeft(marker: StarMarker): number {
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

  protected horizonMarkerBottom(marker: StarMarker): number {
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

  protected isHorizonMarkerClamped(marker: StarMarker): boolean {
    return marker.altitudeDegrees > this.horizonAltitudeMax;
  }

  protected horizonMarkerClass(marker: StarMarker): string {
    return [
      'horizon-marker',
      marker.visibility,
      marker.type,
    ].join(' ');
  }

  private isInDawnFieldOfView(marker: StarMarker): boolean {
    const azimuth = this.normalizedAzimuth(marker);

    return (
      azimuth >= this.dawnFieldMinAzimuth &&
      azimuth <= this.dawnFieldMaxAzimuth
    );
  }

  private normalizedAzimuth(marker: StarMarker): number {
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

  protected starMarkerAltitudeLabel(marker: StarMarker): string {
    if (marker.visibility === 'below-horizon') {
      return `${Math.abs(marker.altitudeDegrees)}° below horizon`;
    }

    return `${marker.altitudeDegrees}° above ${marker.direction}`;
  }

  protected starMarkerMetaLabel(marker: StarMarker): string {
    return [marker.englishName, this.starMarkerTypeLabel(marker.type)]
      .filter(Boolean)
      .join(' / ');
  }

  protected starMarkerVisibilityLabel(marker: StarMarker): string {
    return marker.visibility === 'below-horizon'
      ? 'below horizon'
      : marker.visibility;
  }

  private starMarkerTypeLabel(type: StarMarker['type']): string {
    switch (type) {
      case 'asterism':
        return 'asterism';
      case 'planet':
        return 'planet';
      case 'sky-figure':
        return 'sky figure';
      case 'star':
        return 'star';
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
