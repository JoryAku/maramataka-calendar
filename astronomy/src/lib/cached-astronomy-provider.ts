import {
  AstronomyProvider,
  Location,
  MoonRiseSet,
  NewMoon,
  Sunset,
} from './astronomy-provider';

export class CachedAstronomyProvider implements AstronomyProvider {
  private newMoonCache = new Map<number, Promise<NewMoon[]>>();
  private sunsetCache = new Map<string, Promise<Sunset>>();
  private moonRiseSetCache = new Map<string, Promise<MoonRiseSet>>();

  constructor(private readonly provider: AstronomyProvider) {}

  async getNewMoons(year: number): Promise<NewMoon[]> {
    const cachedRequest = this.newMoonCache.get(year);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider.getNewMoons(year).catch((error) => {
      this.newMoonCache.delete(year);
      throw error;
    });

    this.newMoonCache.set(year, request);
    return request;
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const key = `${date}:${location.latitude}:${location.longitude}:${location.timezoneOffset}`;

    const cachedRequest = this.sunsetCache.get(key);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider.getSunset(date, location).catch((error) => {
      this.sunsetCache.delete(key);
      throw error;
    });

    this.sunsetCache.set(key, request);
    return request;
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    const key = `${date}:${location.latitude}:${location.longitude}:${location.timezoneOffset}`;

    const cachedRequest = this.moonRiseSetCache.get(key);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider
      .getMoonRiseSet(date, location)
      .catch((error) => {
        this.moonRiseSetCache.delete(key);
        throw error;
      });

    this.moonRiseSetCache.set(key, request);
    return request;
  }
}
