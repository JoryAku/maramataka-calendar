import {
  AstronomyProvider,
  FullMoon,
  Location,
  MoonDetails,
  MoonPhase,
  MoonRise,
  MoonRiseSet,
  MoonTransit,
  NewMoon,
} from './astronomy-provider';

export class CachedAstronomyProvider implements AstronomyProvider {
  private moonPhaseCache = new Map<number, Promise<MoonPhase[]>>();
  private newMoonCache = new Map<number, Promise<NewMoon[]>>();
  private fullMoonCache = new Map<number, Promise<FullMoon[]>>();
  private moonRiseCache = new Map<string, Promise<MoonRise>>();
  private moonRiseSetCache = new Map<string, Promise<MoonRiseSet>>();
  private moonTransitCache = new Map<string, Promise<MoonTransit>>();
  private moonDetailsCache = new Map<string, Promise<MoonDetails>>();

  constructor(private readonly provider: AstronomyProvider) {}

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    const cachedRequest = this.moonPhaseCache.get(year);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider.getMoonPhases(year).catch((error) => {
      this.moonPhaseCache.delete(year);
      throw error;
    });

    this.moonPhaseCache.set(year, request);
    return request;
  }

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

  async getFullMoons(year: number): Promise<FullMoon[]> {
    const cachedRequest = this.fullMoonCache.get(year);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider.getFullMoons(year).catch((error) => {
      this.fullMoonCache.delete(year);
      throw error;
    });

    this.fullMoonCache.set(year, request);
    return request;
  }

  async getMoonRise(date: string, location: Location): Promise<MoonRise> {
    const key = this.locationCacheKey(date, location);

    const cachedRequest = this.moonRiseCache.get(key);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider.getMoonRise(date, location).catch((error) => {
      this.moonRiseCache.delete(key);
      throw error;
    });

    this.moonRiseCache.set(key, request);
    return request;
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    const key = this.locationCacheKey(date, location);

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

  async getMoonTransit(date: string, location: Location): Promise<MoonTransit> {
    const key = this.locationCacheKey(date, location);

    const cachedRequest = this.moonTransitCache.get(key);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider
      .getMoonTransit(date, location)
      .catch((error) => {
        this.moonTransitCache.delete(key);
        throw error;
      });

    this.moonTransitCache.set(key, request);
    return request;
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    const key = this.locationCacheKey(date, location);

    const cachedRequest = this.moonDetailsCache.get(key);
    if (cachedRequest) {
      return cachedRequest;
    }

    const request = this.provider
      .getMoonDetails(date, location)
      .catch((error) => {
        this.moonDetailsCache.delete(key);
        throw error;
      });

    this.moonDetailsCache.set(key, request);
    return request;
  }

  private locationCacheKey(date: string, location: Location): string {
    return `${date}:${location.latitude}:${location.longitude}:${location.timezone}`;
  }
}
