export interface MaramatakaNight {
  mata: string;
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
}

export interface MaramatakaMonth {
  version: string;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
}

export interface MaramatakaToday<TDate = Date> {
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
}

export interface MoonDetails<TDate = Date> {
  date: string;
  phase: string;
  fractionIlluminated: number;
  lunarAgeDays: null;
  distanceKm: null;
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
}

export interface ApiMaramatakaMonth {
  version: string;
  whiroStartsAt: string;
  nights: ApiMaramatakaNight[];
}

export type ApiMoonDetails = MoonDetails<string>;
