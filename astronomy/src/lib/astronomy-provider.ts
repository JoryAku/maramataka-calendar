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
  lunarAgeDays?: number;
  lunarAgeSource?: string;
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

export type StarMarkerType = 'star' | 'planet' | 'asterism' | 'sky-figure';
export type StarMarkerConfidence = 'confirmed' | 'working' | 'uncertain';
export type StarMarkerVisibility =
  | 'prominent'
  | 'visible'
  | 'low'
  | 'below-horizon';

export interface StarMarker {
  id: string;
  name: string;
  type: StarMarkerType;
  englishName?: string;
  description: string;
  seasonalAssociation: string;
  source: string;
  sourceUrl?: string;
  confidence: StarMarkerConfidence;
  observedAt: Date;
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: string;
  visibility: StarMarkerVisibility;
  calculation: string;
}

export interface DawnSunPathPoint {
  observedAt: Date;
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: string;
}

export interface DawnSunPath {
  startsAt: Date;
  sunriseAt: Date;
  points: DawnSunPathPoint[];
  calculation: string;
}

export interface DawnSunriseExtremePoint extends DawnSunPathPoint {
  date: string;
}

export interface DawnSunriseExtremes {
  year: number;
  northernmost: DawnSunriseExtremePoint;
  southernmost: DawnSunriseExtremePoint;
  calculation: string;
}

export interface DawnMoon {
  name: 'Moon';
  type: 'moon';
  observedAt: Date;
  phase: MoonPhaseName;
  fractionIlluminated: number;
  altitudeDegrees: number;
  azimuthDegrees: number;
  direction: string;
  visibility: StarMarkerVisibility;
  calculation: string;
  source: string;
}

export interface DawnSky {
  starMarkers: StarMarker[];
  sunPath: DawnSunPath;
  sunriseExtremes?: DawnSunriseExtremes;
  moon?: DawnMoon;
}

export interface StarMarkerNightInvisibilityPeriod {
  markerId: string;
  markerName: string;
  startsOn: string;
  endsOn: string;
  days: number;
  sunAltitudeThresholdDegrees: number;
  calculation: string;
}

export interface StarMarkerAppearanceWindow {
  id: string;
  startDate: string;
  endDate: string;
  marker: StarMarkerDefinition;
}

export interface StarMarkerWindowAppearance {
  id: string;
  marker?: StarMarker;
}

export interface FixedEquatorialStarMarkerRepresentative {
  kind: 'fixed-equatorial';
  rightAscensionHours: number;
  declinationDegrees: number;
}

export interface BodyStarMarkerRepresentative {
  kind: 'body';
  body: 'Venus';
}

export interface StarMarkerDawnRisingConfig {
  /**
   * The earliest Sun altitude in degrees to start testing from. The current
   * observational rule uses astronomical dawn at -18 degrees.
   */
  startSunAltitudeDegrees: number;
  /**
   * The latest Sun altitude in degrees to test through. The current
   * observational rule uses sunrise at 0 degrees.
   */
  endSunAltitudeDegrees: number;
  minimumMarkerAltitudeDegrees: number;
  minimumAzimuthDegrees: number;
  maximumAzimuthDegrees: number;
  sampleMinutes: number;
}

export interface StarMarkerDefinition {
  id: string;
  name: string;
  type: StarMarkerType;
  englishName?: string;
  description: string;
  seasonalAssociation: string;
  source: string;
  sourceUrl?: string;
  confidence: StarMarkerConfidence;
  representative:
    | FixedEquatorialStarMarkerRepresentative
    | BodyStarMarkerRepresentative;
  dawnRising?: StarMarkerDawnRisingConfig;
}

export interface AstronomyProvider {
  getMoonPhases(year: number): Promise<MoonPhase[]>;
  getNewMoons(year: number): Promise<NewMoon[]>;
  getFullMoons(year: number): Promise<FullMoon[]>;
  getMoonRise(date: string, location: Location): Promise<MoonRise>;
  getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet>;
  getMoonTransit(date: string, location: Location): Promise<MoonTransit>;
  getMoonDetails(date: string, location: Location): Promise<MoonDetails>;
  getStarMarkers?(
    date: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]>;
  getSunriseExtremes?(
    year: number,
    location: Location,
  ): Promise<DawnSunriseExtremes>;
  getDawnSky?(
    date: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<DawnSky>;
  getStarFirstAppearances?(
    startDate: string,
    endDate: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]>;
  getStarFirstAppearancesForWindows?(
    windows: StarMarkerAppearanceWindow[],
    location: Location,
  ): Promise<StarMarkerWindowAppearance[]>;
  getStarNightInvisibilityPeriods?(
    startDate: string,
    endDate: string,
    location: Location,
    markers?: StarMarkerDefinition[],
    sunAltitudeThresholdDegrees?: number,
  ): Promise<StarMarkerNightInvisibilityPeriod[]>;
}
