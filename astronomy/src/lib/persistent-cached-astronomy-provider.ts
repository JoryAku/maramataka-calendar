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
  SolarSeasonEvent,
  StarMarker,
  StarMarkerDefinition,
  StarMarkerNightInvisibilityPeriod,
} from './astronomy-provider';
import { AstronomyCacheStore } from './persistent-astronomy-cache';

type Reviver<T> = (value: T) => T;

const STAR_DAWN_SAMPLING_CACHE_VERSION = 'dawn-window-first-appearance-v1';
const STAR_NIGHT_INVISIBILITY_CACHE_VERSION = 'night-invisibility-v1';

export class PersistentCachedAstronomyProvider implements AstronomyProvider {
  constructor(
    private readonly provider: AstronomyProvider,
    private readonly store: AstronomyCacheStore,
  ) {}

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    return this.getOrSet(
      `moon-phases:${year}`,
      () => this.provider.getMoonPhases(year),
      (phases) =>
        phases.map((phase) => ({
          ...phase,
          occursAt: new Date(phase.occursAt),
        })),
    );
  }

  async getNewMoons(year: number): Promise<NewMoon[]> {
    return this.getOrSet(
      `new-moons:${year}`,
      () => this.provider.getNewMoons(year),
      (newMoons) =>
        newMoons.map((newMoon) => ({
          ...newMoon,
          occursAt: new Date(newMoon.occursAt),
        })),
    );
  }

  async getFullMoons(year: number): Promise<FullMoon[]> {
    return this.getOrSet(
      `full-moons:${year}`,
      () => this.provider.getFullMoons(year),
      (fullMoons) =>
        fullMoons.map((fullMoon) => ({
          ...fullMoon,
          occursAt: new Date(fullMoon.occursAt),
        })),
    );
  }

  async getSolarSeasons(year: number): Promise<SolarSeasonEvent[]> {
    return this.getOrSet(
      `solar-seasons:${year}`,
      () => this.provider.getSolarSeasons?.(year) ?? Promise.resolve([]),
      (events) =>
        events.map((event) => ({
          ...event,
          occursAt: new Date(event.occursAt),
        })),
    );
  }

  async getMoonRise(date: string, location: Location): Promise<MoonRise> {
    return this.getOrSet(
      `moonrise:${this.locationCacheKey(date, location)}`,
      () => this.provider.getMoonRise(date, location),
      (moonRise) => ({
        ...moonRise,
        risesAt: new Date(moonRise.risesAt),
      }),
    );
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    return this.getOrSet(
      `moonrise-set:${this.locationCacheKey(date, location)}`,
      () => this.provider.getMoonRiseSet(date, location),
      (moonRiseSet) => ({
        ...moonRiseSet,
        risesAt: new Date(moonRiseSet.risesAt),
        setsAt: new Date(moonRiseSet.setsAt),
      }),
    );
  }

  async getMoonTransit(date: string, location: Location): Promise<MoonTransit> {
    return this.getOrSet(
      `moon-transit:${this.locationCacheKey(date, location)}`,
      () => this.provider.getMoonTransit(date, location),
      (transit) => ({
        ...transit,
        transitsAt: new Date(transit.transitsAt),
      }),
    );
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    return this.getOrSet(
      `moon-details:${this.locationCacheKey(date, location)}`,
      () => this.provider.getMoonDetails(date, location),
      (details) => ({
        ...details,
        closestPhase: details.closestPhase
          ? {
              ...details.closestPhase,
              occursAt: new Date(details.closestPhase.occursAt),
            }
          : undefined,
        moonrise: details.moonrise
          ? {
              ...details.moonrise,
              risesAt: new Date(details.moonrise.risesAt),
            }
          : undefined,
        moonset: details.moonset
          ? {
              ...details.moonset,
              setsAt: new Date(details.moonset.setsAt),
            }
          : undefined,
        transit: details.transit
          ? {
              ...details.transit,
              transitsAt: new Date(details.transit.transitsAt),
            }
          : undefined,
      }),
    );
  }

  async getStarMarkers(
    date: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    return this.getOrSet(
      [
        'star-markers',
        STAR_DAWN_SAMPLING_CACHE_VERSION,
        this.locationCacheKey(date, location),
        this.starMarkerCacheKey(markers),
      ].join(':'),
      () =>
        this.provider.getStarMarkers?.(date, location, markers) ??
        Promise.resolve([]),
      (markers) =>
        markers.map((marker) => ({
          ...marker,
          observedAt: new Date(marker.observedAt),
        })),
    );
  }

  async getStarFirstAppearances(
    startDate: string,
    endDate: string,
    location: Location,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    return this.getOrSet(
      [
        'star-first-appearances',
        STAR_DAWN_SAMPLING_CACHE_VERSION,
        this.locationCacheKey(startDate, location),
        endDate,
        this.starMarkerCacheKey(markers),
      ].join(':'),
      () =>
        this.provider.getStarFirstAppearances?.(
          startDate,
          endDate,
          location,
          markers,
        ) ?? Promise.resolve([]),
      (markers) =>
        markers.map((marker) => ({
          ...marker,
          observedAt: new Date(marker.observedAt),
        })),
    );
  }

  async getStarNightInvisibilityPeriods(
    startDate: string,
    endDate: string,
    location: Location,
    markers?: StarMarkerDefinition[],
    sunAltitudeThresholdDegrees?: number,
  ): Promise<StarMarkerNightInvisibilityPeriod[]> {
    return this.getOrSet(
      [
        'star-night-invisibility-periods',
        STAR_NIGHT_INVISIBILITY_CACHE_VERSION,
        this.locationCacheKey(startDate, location),
        endDate,
        this.starMarkerCacheKey(markers),
        sunAltitudeThresholdDegrees ?? 'default',
      ].join(':'),
      () =>
        this.provider.getStarNightInvisibilityPeriods?.(
          startDate,
          endDate,
          location,
          markers,
          sunAltitudeThresholdDegrees,
        ) ?? Promise.resolve([]),
      (periods) => periods,
    );
  }

  private async getOrSet<T>(
    key: string,
    fetchValue: () => Promise<T>,
    revive: Reviver<T>,
  ): Promise<T> {
    const cachedValue = await this.getCachedValue<T>(key);
    if (cachedValue) {
      return revive(cachedValue);
    }

    const value = await fetchValue();
    await this.setCachedValue(key, value);
    return value;
  }

  private async getCachedValue<T>(key: string): Promise<T | undefined> {
    try {
      return await this.store.get<T>(key);
    } catch {
      return undefined;
    }
  }

  private async setCachedValue<T>(key: string, value: T): Promise<void> {
    try {
      await this.store.set(key, value);
    } catch {
      return undefined;
    }
  }

  private locationCacheKey(date: string, location: Location): string {
    return [
      date,
      location.latitude,
      location.longitude,
      location.timezone,
    ].join(':');
  }

  private starMarkerCacheKey(markers?: StarMarkerDefinition[]): string {
    return markers?.map((marker) => marker.id).join(',') ?? 'default';
  }
}
