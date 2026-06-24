import {
  AstronomyProvider,
  Location,
  NewMoon,
  Sunset,
} from './astronomy-provider';

type FetchFn = typeof fetch;

export class UsnoAstronomyProvider implements AstronomyProvider {
  constructor(private readonly fetchFn: FetchFn = fetch) {}

  async getNewMoons(year: number): Promise<NewMoon[]> {
    await this.fetchFn(
      `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`
    );
    return [];
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    throw new Error('Not implemented');
  }
}