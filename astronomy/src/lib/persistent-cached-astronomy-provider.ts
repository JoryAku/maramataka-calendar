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
  StarMarkerAppearanceWindow,
  StarMarkerDawnRisingConfig,
  StarMarkerDefinition,
  StarMarkerNightInvisibilityPeriod,
  StarMarkerWindowAppearance,
} from './astronomy-provider';
import {
  CacheFingerprintMetadata,
  createCacheFingerprint,
  createFingerprintNamespace,
} from './cache-fingerprint';
import { AstronomyCacheStore } from './persistent-astronomy-cache';

type Reviver<T> = (value: T) => T;

export const RAW_ASTRONOMY_CACHE_METADATA = {
  layer: 'raw-astronomy',
  version: 1,
  providerContract: 'astronomy-provider-v1',
  operations: [
    'moon-phases',
    'new-moons',
    'full-moons',
    'solar-seasons',
    'moonrise',
    'moonrise-set',
    'moon-transit',
    'moon-details',
  ],
  locationKeyFields: ['date', 'latitude', 'longitude', 'timezone'],
  valueDateEncoding: 'iso-string-on-disk-revived-to-date',
} as const satisfies CacheFingerprintMetadata;

export const OBSERVATIONAL_ASTRONOMY_CACHE_METADATA = {
  layer: 'observational-astronomy',
  version: 1,
  providerContract: 'astronomy-provider-v1',
  operations: [
    'star-markers',
    'star-first-appearances',
    'star-first-appearance-windows',
    'star-night-invisibility-periods',
  ],
  dawnMarkerSampling: {
    dailyMarkerSample: 'midpoint-between-sun-altitude--18-and--12',
    firstAppearanceWindow: 'sun-altitude--18-through-sunrise',
    nightInvisibilityCondition:
      'marker-never-above-horizon-while-sun-at-or-below-threshold',
  },
  markerDefinitionFields: ['id', 'type', 'representative', 'dawnRising'],
  locationKeyFields: ['date', 'latitude', 'longitude', 'timezone'],
  valueDateEncoding: 'iso-string-on-disk-revived-to-date',
} as const satisfies CacheFingerprintMetadata;

export interface PersistentCachedAstronomyProviderOptions {
  rawAstronomyMetadata?: CacheFingerprintMetadata;
  observationalAstronomyMetadata?: CacheFingerprintMetadata;
}

export class PersistentCachedAstronomyProvider implements AstronomyProvider {
  private readonly rawAstronomyNamespace: string;
  private readonly observationalAstronomyNamespace: string;

  constructor(
    private readonly provider: AstronomyProvider,
    private readonly store: AstronomyCacheStore,
    options: PersistentCachedAstronomyProviderOptions = {},
  ) {
    this.rawAstronomyNamespace = createFingerprintNamespace(
      'raw',
      options.rawAstronomyMetadata ?? RAW_ASTRONOMY_CACHE_METADATA,
    );
    this.observationalAstronomyNamespace = createFingerprintNamespace(
      'observational',
      options.observationalAstronomyMetadata ??
        OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
    );
  }

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    return this.getOrSet(
      this.rawCacheKey(`moon-phases:${year}`),
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
      this.rawCacheKey(`new-moons:${year}`),
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
      this.rawCacheKey(`full-moons:${year}`),
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
      this.rawCacheKey(`solar-seasons:${year}`),
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
      this.rawCacheKey(`moonrise:${this.locationCacheKey(date, location)}`),
      () => this.provider.getMoonRise(date, location),
      (moonRise) => ({
        ...moonRise,
        risesAt: new Date(moonRise.risesAt),
      }),
    );
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    return this.getOrSet(
      this.rawCacheKey(
        `moonrise-set:${this.locationCacheKey(date, location)}`,
      ),
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
      this.rawCacheKey(
        `moon-transit:${this.locationCacheKey(date, location)}`,
      ),
      () => this.provider.getMoonTransit(date, location),
      (transit) => ({
        ...transit,
        transitsAt: new Date(transit.transitsAt),
      }),
    );
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    return this.getOrSet(
      this.rawCacheKey(
        `moon-details:${this.locationCacheKey(date, location)}`,
      ),
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
      this.observationalCacheKey(
        [
          'star-markers',
          this.locationCacheKey(date, location),
          this.starMarkerCacheKey(markers),
        ].join(':'),
      ),
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
      this.observationalCacheKey(
        [
          'star-first-appearances',
          this.locationCacheKey(startDate, location),
          endDate,
          this.starMarkerCacheKey(markers),
        ].join(':'),
      ),
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

  async getStarFirstAppearancesForWindows(
    windows: StarMarkerAppearanceWindow[],
    location: Location,
  ): Promise<StarMarkerWindowAppearance[]> {
    return this.getOrSet(
      this.observationalCacheKey(
        [
          'star-first-appearance-windows',
          this.locationOnlyCacheKey(location),
          this.starMarkerAppearanceWindowsCacheKey(windows),
        ].join(':'),
      ),
      () => this.getStarFirstAppearanceWindows(windows, location),
      (appearances) =>
        appearances.map((appearance) => ({
          ...appearance,
          marker: appearance.marker
            ? {
                ...appearance.marker,
                observedAt: new Date(appearance.marker.observedAt),
              }
            : undefined,
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
      this.observationalCacheKey(
        [
          'star-night-invisibility-periods',
          this.locationCacheKey(startDate, location),
          endDate,
          this.starMarkerCacheKey(markers),
          sunAltitudeThresholdDegrees ?? 'default',
        ].join(':'),
      ),
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

  private async getStarFirstAppearanceWindows(
    windows: StarMarkerAppearanceWindow[],
    location: Location,
  ): Promise<StarMarkerWindowAppearance[]> {
    if (this.provider.getStarFirstAppearancesForWindows) {
      return this.provider.getStarFirstAppearancesForWindows(windows, location);
    }

    return Promise.all(
      windows.map(async (window) => {
        const [marker] =
          (await this.provider.getStarFirstAppearances?.(
            window.startDate,
            window.endDate,
            location,
            [window.marker],
          )) ?? [];

        return {
          id: window.id,
          marker,
        };
      }),
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

  private locationOnlyCacheKey(location: Location): string {
    return [location.latitude, location.longitude, location.timezone].join(':');
  }

  private starMarkerAppearanceWindowsCacheKey(
    windows: StarMarkerAppearanceWindow[],
  ): string {
    return createCacheFingerprint(
      windows.map((window) => ({
        id: window.id,
        startDate: window.startDate,
        endDate: window.endDate,
        marker: this.starMarkerMetadata([window.marker]),
      })),
    );
  }

  private starMarkerCacheKey(markers?: StarMarkerDefinition[]): string {
    return markers
      ? createCacheFingerprint(this.starMarkerMetadata(markers))
      : 'default';
  }

  private starMarkerMetadata(
    markers: StarMarkerDefinition[],
  ): CacheFingerprintMetadata {
    return markers.map((marker) => ({
      id: marker.id,
      type: marker.type,
      representative: this.starRepresentativeMetadata(marker.representative),
      dawnRising: this.dawnRisingMetadata(marker.dawnRising),
    }));
  }

  private starRepresentativeMetadata(
    representative: StarMarkerDefinition['representative'],
  ): CacheFingerprintMetadata {
    if (representative.kind === 'fixed-equatorial') {
      return {
        kind: representative.kind,
        rightAscensionHours: representative.rightAscensionHours,
        declinationDegrees: representative.declinationDegrees,
      };
    }

    return {
      kind: representative.kind,
      body: representative.body,
    };
  }

  private dawnRisingMetadata(
    dawnRising?: StarMarkerDawnRisingConfig,
  ): CacheFingerprintMetadata | undefined {
    if (!dawnRising) {
      return undefined;
    }

    return {
      startSunAltitudeDegrees: dawnRising.startSunAltitudeDegrees,
      endSunAltitudeDegrees: dawnRising.endSunAltitudeDegrees,
      minimumMarkerAltitudeDegrees: dawnRising.minimumMarkerAltitudeDegrees,
      minimumAzimuthDegrees: dawnRising.minimumAzimuthDegrees,
      maximumAzimuthDegrees: dawnRising.maximumAzimuthDegrees,
      sampleMinutes: dawnRising.sampleMinutes,
    };
  }

  private rawCacheKey(key: string): string {
    return `${this.rawAstronomyNamespace}:${key}`;
  }

  private observationalCacheKey(key: string): string {
    return `${this.observationalAstronomyNamespace}:${key}`;
  }
}
