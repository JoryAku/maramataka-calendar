import { StarMarker } from '@maramataka-calendar/astronomy';
import { Mata, MaramatakaVersion } from './mata';
import {
  MaramatakaRuleSetSummary,
  StarMonthNote,
} from './maramataka-rule-set';

export interface MaramatakaNight {
  mata: Mata;
  overlappingMata?: MaramatakaNightOverlap[];
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaNightOverlap {
  mata: Mata;
  cycleStartsAt: Date;
  reason: 'new-moon-anchor';
}

export interface MaramatakaMonth {
  version: MaramatakaVersion;
  ruleSet: MaramatakaRuleSetSummary;
  whiroStartsAt: Date;
  starMonthSequence?: number;
  nights: MaramatakaNight[];
}

export interface CurrentMaramatakaNight {
  version: MaramatakaVersion;
  ruleSet: MaramatakaRuleSetSummary;
  night: MaramatakaNight;
}

export interface MaramatakaCycleAnchor {
  type: 'whiro' | 'full-moon' | 'next-whiro';
  label: string;
  occursAt: Date;
  astronomicalOccursAt?: Date;
  localDate: string;
  localTime: string;
  timezone: string;
  source: string;
  mata?: Mata;
}

export interface MaramatakaStarMonth {
  name: string;
  marker?: StarMarker;
  rule: string;
  source: string;
  sourceUrl?: string;
  note?: StarMonthNote;
}

export interface MaramatakaCycleDetails {
  version: MaramatakaVersion;
  ruleSet: MaramatakaRuleSetSummary;
  timezone: string;
  currentMataIndex: number;
  currentNight: MaramatakaNight;
  anchors: {
    whiro: MaramatakaCycleAnchor;
    fullMoon?: MaramatakaCycleAnchor;
    nextWhiro: MaramatakaCycleAnchor;
  };
  nights: MaramatakaNight[];
  starMonth?: MaramatakaStarMonth;
  starMarkers?: StarMarker[];
}

export interface MaramatakaYear {
  version: MaramatakaVersion;
  ruleSet: MaramatakaRuleSetSummary;
  year: number;
  timezone: string;
  startsAt: Date;
  endsAt: Date;
  months: MaramatakaYearMonth[];
  events: MaramatakaYearEvent[];
  diagnostics: MaramatakaYearDiagnostic[];
}

export interface MaramatakaYearEvent {
  type: 'month-start' | 'star-marker' | 'new-moon' | 'full-moon';
  name: string;
  occursAt: Date;
  monthSequence?: number;
  monthName?: string;
  description?: string;
  source?: string;
}

export interface MaramatakaYearDiagnostic {
  type: 'phase-provider' | 'estimated-month' | 'skipped-month';
  name: string;
  sequence?: number;
  anchorDate?: Date;
  reason: string;
}

export interface MaramatakaYearMonth {
  sequence: number;
  name: string;
  starMonth?: MaramatakaStarMonth;
  starMarkers?: StarMarker[];
  isEstimated?: boolean;
  unavailableReason?: string;
  startsAt: Date;
  endsAt: Date;
  durationDays: number;
  nightsCount: number;
  repeatedMata: string[];
  anchors: {
    whiro: MaramatakaCycleAnchor;
    fullMoon?: MaramatakaCycleAnchor;
    nextWhiro: MaramatakaCycleAnchor;
  };
}
