export interface Location {
  latitude: number;
  longitude: number;
  timezoneOffset: number;
}

export interface NewMoon {
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

export interface AstronomyProvider {
  getNewMoons(year: number): Promise<NewMoon[]>;
  getSunset(date: string, location: Location): Promise<Sunset>;
  getMoonRise(date: string, location: Location): Promise<MoonRise>;
  getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet>;
}
