import { MoonDetails, StarMarker } from '@maramataka-calendar/astronomy';
import {
  CurrentMaramatakaNight,
  MaramatakaRuleSetSummary,
  MataContentLayer,
} from '@maramataka-calendar/maramataka-domain';

export interface TodayMaramatakaNightResponseDto {
  ruleSet: MaramatakaRuleSetSummary;
  mata: {
    index: number;
    name: string;
    contentLayers?: MataContentLayer[];
  };
  overlappingMata?: {
    mata: {
      index: number;
      name: string;
      contentLayers?: MataContentLayer[];
    };
    cycleStartsAt: Date;
    reason: 'new-moon-anchor';
  }[];
  startsAt: Date;
  endsAt: Date;
}

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

export function toTodayMaramatakaNightResponse(
  currentNight: CurrentMaramatakaNight,
): TodayMaramatakaNightResponseDto {
  const { night } = currentNight;

  return {
    ruleSet: currentNight.ruleSet,
    mata: {
      index: night.mata.index,
      name: night.mata.name,
      contentLayers: night.mata.contentLayers,
    },
    overlappingMata: night.overlappingMata?.map((overlap) => ({
      mata: {
        index: overlap.mata.index,
        name: overlap.mata.name,
        contentLayers: overlap.mata.contentLayers,
      },
      cycleStartsAt: overlap.cycleStartsAt,
      reason: overlap.reason,
    })),
    startsAt: night.startsAt,
    endsAt: night.endsAt,
  };
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

export function toStarMarkersResponse(
  markers: StarMarker[],
): StarMarkerResponseDto[] {
  return markers;
}
