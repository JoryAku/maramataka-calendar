export interface Location {
  latitude: number;
  longitude: number;
  timezoneOffset: number;
}

export interface NewMoon {
  occursAt: Date;
  source: 'usno';
}

export interface Sunset {
  date: string;
  occursAt: Date;
  source: 'usno';
}

export interface AstronomyProvider {
  getNewMoons(year: number): Promise<NewMoon[]>;
  getSunset(date: string, location: Location): Promise<Sunset>;
}