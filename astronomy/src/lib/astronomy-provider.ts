export interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface NewMoon {
  occursAt: Date;
  source: string;
}

export interface FullMoon {
  occursAt: Date;
  source: string;
}

export interface Sunset {
  date: string;
  occursAt: Date;
  source: string;
}

export interface MoonRiseSet {
  date: string;
  risesAt: Date;
  setsAt: Date;
  source: string;
}

export interface MoonRise {
  date: string;
  risesAt: Date;
  source: string;
}

export interface MoonTransit {
  date: string;
  transitsAt: Date;
  source: string;
}

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhase {
  phase: MoonPhaseName;
  occursAt: Date;
  source: string;
}

export interface MoonDetails {
  date: string;
  phase: MoonPhaseName;
  fractionIlluminated: number;
  closestPhase?: MoonPhase;
  moonrise?: MoonRise;
  moonset?: {
    date: string;
    setsAt: Date;
    source: string;
  };
  transit?: MoonTransit;
  source: string;
}

export interface AstronomyProvider {
  getMoonPhases(year: number): Promise<MoonPhase[]>;
  getNewMoons(year: number): Promise<NewMoon[]>;
  getFullMoons(year: number): Promise<FullMoon[]>;
  getSunset(date: string, location: Location): Promise<Sunset>;
  getMoonRise(date: string, location: Location): Promise<MoonRise>;
  getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet>;
  getMoonTransit(date: string, location: Location): Promise<MoonTransit>;
  getMoonDetails(date: string, location: Location): Promise<MoonDetails>;
}
