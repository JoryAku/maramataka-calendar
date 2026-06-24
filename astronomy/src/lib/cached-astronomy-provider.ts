import { AstronomyProvider, Location, NewMoon, Sunset } from './astronomy-provider';

export class CachedAstronomyProvider implements AstronomyProvider {
  private newMoonCache = new Map<number, NewMoon[]>();
  private sunsetCache = new Map<string, Sunset>();

  constructor(private readonly provider: AstronomyProvider) {}

  async getNewMoons(year: number): Promise<NewMoon[]> {
    if (!this.newMoonCache.has(year)) {
      this.newMoonCache.set(year, await this.provider.getNewMoons(year));
    }

    return this.newMoonCache.get(year)!;
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const key = `${date}:${location.latitude}:${location.longitude}:${location.timezoneOffset}`;

    if (!this.sunsetCache.has(key)) {
      this.sunsetCache.set(key, await this.provider.getSunset(date, location));
    }

    return this.sunsetCache.get(key)!;
  }
}