export interface MaramatakaNight {
  mata: string;
  phaseGroup?: MataPhaseGroup;
  overlappingMata?: MaramatakaNightOverlap[];
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaNightOverlap {
  mata: string;
  cycleStartsAt: Date;
  reason: 'new-moon-anchor';
}

export interface LocationSummary {
  id: string;
  name: string;
  rohe?: string;
}

export interface MaramatakaMonth {
  version: string;
  ruleSet: MaramatakaRuleSet;
  whiroStartsAt: Date;
  starMonthSequence?: number;
  nights: MaramatakaNight[];
}

export interface MaramatakaCycleDetails<TDate = Date> {
  version: string;
  ruleSet: MaramatakaRuleSet;
  timezone: string;
  currentMataIndex: number;
  currentNight: MaramatakaNight;
  anchors: {
    whiro: MaramatakaCycleAnchor<TDate>;
    fullMoon?: MaramatakaCycleAnchor<TDate>;
    nextWhiro: MaramatakaCycleAnchor<TDate>;
  };
  nights: MaramatakaNight[];
  starMonth?: MaramatakaStarMonth<TDate>;
  starMarkers?: StarMarker<TDate>[];
}

export interface MaramatakaStarMonth<TDate = Date> {
  name: string;
  marker?: StarMarker<TDate>;
  rule: string;
  source: string;
  sourceUrl?: string;
  note?: StarMonthNote;
}

export interface StarMonthNote {
  sequence: number;
  name: string;
  markerIds: string[];
  description: string;
  sourceText: string;
}

export interface MaramatakaYear<TDate = Date> {
  version: string;
  ruleSet: MaramatakaRuleSet;
  year: number;
  timezone: string;
  startsAt: TDate;
  endsAt: TDate;
  months: MaramatakaYearMonth<TDate>[];
  events: MaramatakaYearEvent<TDate>[];
  diagnostics: MaramatakaYearDiagnostic<TDate>[];
}

export interface MaramatakaYearEvent<TDate = Date> {
  type:
    | 'month-start'
    | 'star-marker'
    | 'star-appearance'
    | 'star-invisibility'
    | 'solar-season'
    | 'new-moon'
    | 'full-moon'
    | 'public-holiday';
  name: string;
  occursAt: TDate;
  monthSequence?: number;
  monthName?: string;
  starMarkerScope?: 'month' | 'seasonal';
  description?: string;
  source?: string;
}

export interface MaramatakaYearDiagnostic<TDate = Date> {
  type: 'phase-provider' | 'estimated-month' | 'skipped-month';
  name: string;
  sequence?: number;
  anchorDate?: TDate;
  reason: string;
}

export interface MaramatakaYearMonth<TDate = Date> {
  sequence: number;
  name: string;
  starMonth?: MaramatakaStarMonth<TDate>;
  starMarkers?: StarMarker<TDate>[];
  isEstimated?: boolean;
  unavailableReason?: string;
  startsAt: TDate;
  endsAt: TDate;
  durationDays: number;
  nightsCount: number;
  repeatedMata: string[];
  anchors: {
    whiro: MaramatakaCycleAnchor<TDate>;
    fullMoon?: MaramatakaCycleAnchor<TDate>;
    nextWhiro: MaramatakaCycleAnchor<TDate>;
  };
}

export interface MaramatakaCycleAnchor<TDate = Date> {
  type: 'whiro' | 'full-moon' | 'next-whiro';
  label: string;
  occursAt: TDate;
  astronomicalOccursAt?: TDate;
  localDate: string;
  localTime: string;
  timezone: string;
  source: string;
  mata?: ApiMata;
}

export interface MaramatakaToday<TDate = Date> {
  ruleSet: MaramatakaRuleSet;
  mata: MaramatakaTodayMata;
  overlappingMata?: MaramatakaTodayOverlap<TDate>[];
  startsAt: TDate;
  endsAt: TDate;
}

export interface MaramatakaTodayOverlap<TDate = Date> {
  mata: MaramatakaTodayMata;
  cycleStartsAt: TDate;
  reason: 'new-moon-anchor';
}

export interface MaramatakaTodayMata {
  index: number;
  name: string;
  version?: string;
  contentLayers?: MataContentLayer[];
}

export interface MaramatakaRuleSet {
  id: string;
  name: string;
  version: string;
  source: string;
  sourceQuote?: string;
  tradition: string;
  maramaStart: string;
  mataBoundary: string;
  calibration: string;
  balancing: string;
  yearStartRule?: {
    strategy: string;
    marker: {
      id: string;
      name: string;
      type: StarMarkerType;
      englishName?: string;
      seasonalAssociation: string;
      confidence: StarMarkerConfidence;
    };
    description: string;
    source: string;
    sourceUrl?: string;
    sourceQuote?: string;
  };
  starMonthNaming?: {
    strategy: string;
    sampleTimeLocal: string;
    source: string;
    sourceUrl?: string;
    sourceQuote?: string;
    months: StarMonthNote[];
    markers: Array<{
      id: string;
      name: string;
      type: StarMarkerType;
      englishName?: string;
      seasonalAssociation: string;
      confidence: StarMarkerConfidence;
    }>;
  };
}

export interface MoonDetails<TDate = Date> {
  date: string;
  phase: string;
  fractionIlluminated: number;
  lunarAgeDays: number | null;
  distanceKm: number | null;
  lunarAgeSource?: string;
  closestPhase?: MoonDetailsPhase<TDate>;
  moonrise?: MoonDetailsEvent<TDate>;
  moonset?: MoonDetailsEvent<TDate>;
  transit?: MoonDetailsEvent<TDate>;
  unavailable: Array<'lunarAgeDays' | 'distanceKm'>;
  source: string;
}

export interface MoonDetailsPhase<TDate = Date> {
  phase: string;
  occursAt: TDate;
  source: string;
}

export interface MoonDetailsEvent<TDate = Date> {
  occursAt: TDate;
  source: string;
}

export type StarMarkerType = 'star' | 'planet' | 'asterism' | 'sky-figure';
export type StarMarkerConfidence = 'confirmed' | 'working' | 'uncertain';
export type StarMarkerVisibility =
  | 'prominent'
  | 'visible'
  | 'low'
  | 'below-horizon';

export interface StarMarker<TDate = Date> {
  id: string;
  name: string;
  type: StarMarkerType;
  englishName?: string;
  description: string;
  seasonalAssociation: string;
  source: string;
  sourceUrl?: string;
  confidence: StarMarkerConfidence;
  observedAt: TDate;
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: string;
  visibility: StarMarkerVisibility;
  calculation: string;
}

export interface ApiMaramatakaNight {
  mata: string | ApiMata;
  overlappingMata?: ApiMaramatakaNightOverlap[];
  startsAt: string;
  endsAt: string;
}

export interface ApiMaramatakaNightOverlap {
  mata: string | ApiMata;
  cycleStartsAt: string;
  reason: 'new-moon-anchor';
}

export interface ApiMata {
  index: number;
  name: string;
  version: string;
  phaseGroup?: MataPhaseGroup;
  contentLayers?: MataContentLayer[];
}

export interface MataPhaseGroup {
  name: string;
}

export interface MataContentLayer {
  id: string;
  name: string;
  source: string;
  sourceUrl?: string;
  version: string;
  status: 'available' | 'unavailable';
  description?: string;
  recommendations?: string[];
  unavailableReason?: string;
}

export type ApiMaramatakaCycleDetails = Omit<
  MaramatakaCycleDetails<string>,
  'currentNight' | 'nights'
> & {
  currentNight: ApiMaramatakaNight;
  nights: ApiMaramatakaNight[];
};

export type ApiMoonDetails = MoonDetails<string>;
export type ApiMaramatakaYear = MaramatakaYear<string>;
export type ApiStarMarker = StarMarker<string>;
