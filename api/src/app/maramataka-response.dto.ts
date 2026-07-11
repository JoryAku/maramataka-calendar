import { DawnSky, MoonDetails, StarMarker } from '@maramataka-calendar/astronomy';
import { MaramatakaCycleDetails } from '@maramataka-calendar/maramataka-domain';

export interface MoonDetailsResponseDto {
  date: string;
  phase: string;
  fractionIlluminated: number;
  lunarAgeDays: number | null;
  distanceKm: number | null;
  lunarAgeSource?: string;
  closestPhase?: {
    phase: string;
    occursAt: Date;
    source: string;
  };
  moonrise?: {
    occursAt: Date;
    source: string;
  };
  moonset?: {
    occursAt: Date;
    source: string;
  };
  transit?: {
    occursAt: Date;
    source: string;
  };
  unavailable: Array<'lunarAgeDays' | 'distanceKm'>;
  source: string;
}

export type StarMarkerResponseDto = StarMarker;

export type DawnSkyResponseDto = DawnSky;

export interface MaramatakaPageResponseDto {
  cycle: MaramatakaCycleDetails;
  moonDetails: MoonDetailsResponseDto;
}

export function toMoonDetailsResponse(
  details: MoonDetails,
): MoonDetailsResponseDto {
  return {
    date: details.date,
    phase: details.phase,
    fractionIlluminated: details.fractionIlluminated,
    lunarAgeDays: details.lunarAgeDays ?? null,
    distanceKm: null,
    lunarAgeSource: details.lunarAgeSource,
    closestPhase: details.closestPhase
      ? {
          phase: details.closestPhase.phase,
          occursAt: details.closestPhase.occursAt,
          source: details.closestPhase.source,
        }
      : undefined,
    moonrise: details.moonrise
      ? {
          occursAt: details.moonrise.risesAt,
          source: details.moonrise.source,
        }
      : undefined,
    moonset: details.moonset
      ? {
          occursAt: details.moonset.setsAt,
          source: details.moonset.source,
        }
      : undefined,
    transit: details.transit
      ? {
          occursAt: details.transit.transitsAt,
          source: details.transit.source,
        }
      : undefined,
    unavailable: [
      ...(details.lunarAgeDays === undefined ? ['lunarAgeDays' as const] : []),
      'distanceKm' as const,
    ],
    source: details.source,
  };
}

export function toDawnSkyResponse(dawnSky: DawnSky): DawnSkyResponseDto {
  return dawnSky;
}

export function toStarMarkersResponse(
  markers: StarMarker[],
): StarMarkerResponseDto[] {
  return markers;
}
