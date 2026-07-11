import {
  AstronomyProvider,
  DawnMoon,
  DawnSky,
  DawnSunriseExtremePoint,
  DawnSunriseExtremes,
  DawnSunPath,
  DawnSunPathPoint,
  FullMoon,
  Location,
  MoonDetails,
  MoonPhase,
  MoonPhaseName,
  MoonRise,
  MoonRiseSet,
  MoonTransit,
  NewMoon,
  StarMarkerAppearanceWindow,
  StarMarkerDawnRisingConfig,
  StarMarker,
  StarMarkerDefinition,
  StarMarkerNightInvisibilityPeriod,
  StarMarkerWindowAppearance,
  StarMarkerVisibility,
} from './astronomy-provider';
import { AstronomyProviderError } from './astronomy-provider-error';
import { calculateLunarAgeDays } from './moon-metrics';
import {
  formatIsoDateInTimezone,
  parseLocalDateTimeInTimezone,
} from './timezone';

const ASTRONOMY_ENGINE_SOURCE = 'astronomy-engine';
const ASTRONOMY_ENGINE_LUNAR_AGE_SOURCE = 'astronomy-engine moon phases';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const DAWN_FIRST_APPEARANCE_SAMPLE_MINUTES = 5;
const NIGHT_VISIBILITY_SAMPLE_MINUTES = 10;
const ASTRONOMICAL_NIGHT_SUN_ALTITUDE_DEGREES = -18;

export const DEFAULT_DAWN_RISING_CONFIG: StarMarkerDawnRisingConfig = {
  startSunAltitudeDegrees: -18,
  endSunAltitudeDegrees: 0,
  minimumMarkerAltitudeDegrees: 0,
  minimumAzimuthDegrees: 0,
  maximumAzimuthDegrees: 180,
  sampleMinutes: DAWN_FIRST_APPEARANCE_SAMPLE_MINUTES,
};

type AstronomyEngineModule = typeof import('astronomy-engine');

interface StarEquatorResult {
  ra: number;
  dec: number;
}

interface DawnRisingObservationWindow {
  startsAt: Date;
  endsAt: Date;
}

type DawnRisingObservationWindowCache = Map<
  string,
  DawnRisingObservationWindow
>;
type StarEquatorCache = Map<string, StarEquatorResult>;

const STAR_MARKER_SOURCE = 'Elsdon Best, The Maori Division of Time';

export const DEFAULT_STAR_MARKERS: StarMarkerDefinition[] = [
  {
    id: 'matariki',
    name: 'Matariki',
    type: 'asterism',
    englishName: 'Pleiades',
    description:
      'Pleiades; year-start marker appearing on the dawn horizon.',
    seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
    source: STAR_MARKER_SOURCE,
    confidence: 'confirmed',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 3.7914,
      declinationDegrees: 24.1051,
    },
  },
  {
    id: 'kopu',
    name: 'Kōpū',
    type: 'planet',
    englishName: 'Venus',
    description: 'Venus as a morning-star marker in the seasonal account.',
    seasonalAssociation: 'Second seasonal month marker',
    source: STAR_MARKER_SOURCE,
    confidence: 'confirmed',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'body',
      body: 'Venus',
    },
  },
  {
    id: 'takurua',
    name: 'Takurua',
    type: 'star',
    englishName: 'Sirius',
    description: 'Sirius; Best notes Takurua is also a name for winter.',
    seasonalAssociation: 'Second named month marker',
    source: STAR_MARKER_SOURCE,
    confidence: 'confirmed',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 6.7525,
      declinationDegrees: -16.7161,
    },
  },
  {
    id: 'tautoru',
    name: 'Tautoru',
    type: 'asterism',
    englishName: "Orion's Belt",
    description:
      'Orion Belt marker; represented here by Alnilam for sky-position calculation.',
    seasonalAssociation: 'Second seasonal month marker',
    source: STAR_MARKER_SOURCE,
    confidence: 'confirmed',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 5.6036,
      declinationDegrees: -1.2019,
    },
  },
  {
    id: 'whakaahu',
    name: 'Whakaahu',
    type: 'star',
    englishName: 'Castor',
    description:
      'Gemini marker; represented by Castor, with Pollux retained for later review.',
    seasonalAssociation: 'Late winter / early spring marker',
    source: 'Te Aka / project star-marker notes',
    confidence: 'working',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 7.5767,
      declinationDegrees: 31.8883,
    },
  },
  {
    id: 'rehua',
    name: 'Rehua',
    type: 'star',
    englishName: 'Antares',
    description: 'Summer marker associated with the Rehua star.',
    seasonalAssociation: 'Summer marker',
    source: STAR_MARKER_SOURCE,
    confidence: 'confirmed',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 16.4901,
      declinationDegrees: -26.432,
    },
  },
  {
    id: 'uruao',
    name: 'Uruao',
    type: 'sky-figure',
    englishName: 'Tail of Scorpion working marker',
    description:
      "Working project interpretation for Tamarereti's Canoe / Tail of Scorpion context.",
    seasonalAssociation: 'Provisional sky-figure marker',
    source: 'Project working interpretation',
    confidence: 'working',
    dawnRising: DEFAULT_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 17.5601,
      declinationDegrees: -37.1038,
    },
  },
];

export class AstronomyEngineProvider implements AstronomyProvider {
  private readonly enginePromise: Promise<AstronomyEngineModule>;

  constructor(engine?: AstronomyEngineModule) {
    this.enginePromise = engine
      ? Promise.resolve(engine)
      : import('astronomy-engine').then((module) =>
          this.normalizeEngineModule(module),
        );
  }

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    return this.calculate('moon phases', async (engine) => {
      const phases: MoonPhase[] = [];
      const start = new Date(Date.UTC(year, 0, 1));
      const end = new Date(Date.UTC(year + 1, 0, 1));
      let quarter = engine.SearchMoonQuarter(
        new Date(Date.UTC(year - 1, 11, 1)),
      );

      for (let guard = 0; guard < 80; guard += 1) {
        const occursAt = quarter.time.date;
        if (occursAt.getTime() >= end.getTime()) {
          break;
        }

        if (occursAt.getTime() >= start.getTime()) {
          phases.push({
            phase: this.quarterName(quarter.quarter),
            occursAt,
            source: ASTRONOMY_ENGINE_SOURCE,
          });
        }

        quarter = engine.NextMoonQuarter(quarter);
      }

      return phases;
    });
  }

  async getNewMoons(year: number): Promise<NewMoon[]> {
    return (await this.getMoonPhases(year))
      .filter((phase) => phase.phase === 'New Moon')
      .map((phase) => ({
        occursAt: phase.occursAt,
        source: phase.source,
      }));
  }

  async getFullMoons(year: number): Promise<FullMoon[]> {
    return (await this.getMoonPhases(year))
      .filter((phase) => phase.phase === 'Full Moon')
      .map((phase) => ({
        occursAt: phase.occursAt,
        source: phase.source,
      }));
  }

  async getMoonRise(date: string, location: Location): Promise<MoonRise> {
    return this.calculate('moonrise', async (engine) => {
      const observer = this.observer(engine, location);
      const dateRange = this.localDateRange(date, location);
      const moonrise = engine.SearchRiseSet(
        engine.Body.Moon,
        observer,
        1,
        dateRange.startsAt,
        dateRange.limitDays,
      );

      if (
        !moonrise ||
        formatIsoDateInTimezone(moonrise.date, location.timezone) !== date
      ) {
        throw this.dataUnavailable(`No moonrise data found for ${date}`);
      }

      return {
        date,
        risesAt: moonrise.date,
        source: ASTRONOMY_ENGINE_SOURCE,
      };
    });
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    return this.calculate('moonrise/moonset', async (engine) => {
      const moonrise = await this.getMoonRise(date, location);
      const moonset = engine.SearchRiseSet(
        engine.Body.Moon,
        this.observer(engine, location),
        -1,
        moonrise.risesAt,
        2,
      );

      if (!moonset || moonset.date.getTime() <= moonrise.risesAt.getTime()) {
        throw this.dataUnavailable(`No moonset found after moonrise on ${date}`);
      }

      return {
        date,
        risesAt: moonrise.risesAt,
        setsAt: moonset.date,
        source: ASTRONOMY_ENGINE_SOURCE,
      };
    });
  }

  async getMoonTransit(date: string, location: Location): Promise<MoonTransit> {
    return this.calculate('moon transit', async (engine) => {
      const dateRange = this.localDateRange(date, location);
      const transit = engine.SearchHourAngle(
        engine.Body.Moon,
        this.observer(engine, location),
        0,
        dateRange.startsAt,
        1,
      );

      if (
        !transit?.time ||
        formatIsoDateInTimezone(transit.time.date, location.timezone) !== date
      ) {
        throw this.dataUnavailable(`No moon transit data found for ${date}`);
      }

      return {
        date,
        transitsAt: transit.time.date,
        source: ASTRONOMY_ENGINE_SOURCE,
      };
    });
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    return this.calculate('moon details', async (engine) => {
      const detailsAt = this.localDateAtNoon(date, location);
      const angle = engine.MoonPhase(detailsAt);
      const illumination = engine.Illumination(engine.Body.Moon, detailsAt);
      const phases = await this.getMoonPhasesForSurroundingYears(detailsAt);
      const lunarAgeDays = calculateLunarAgeDays(detailsAt, phases);
      const [moonrise, moonset, transit] = await Promise.all([
        this.optional(() => this.getMoonRise(date, location)),
        this.optional(async () => {
          const moonRiseSet = await this.getMoonRiseSet(date, location);
          return {
            date,
            setsAt: moonRiseSet.setsAt,
            source: moonRiseSet.source,
          };
        }),
        this.optional(() => this.getMoonTransit(date, location)),
      ]);

      return {
        date,
        phase: this.phaseNameFromAngle(angle),
        fractionIlluminated: this.roundTo(illumination.phase_fraction, 4),
        ...(lunarAgeDays !== undefined
          ? {
              lunarAgeDays,
              lunarAgeSource: ASTRONOMY_ENGINE_LUNAR_AGE_SOURCE,
            }
          : {}),
        closestPhase: this.closestPhase(detailsAt, phases),
        moonrise,
        moonset,
        transit,
        source: ASTRONOMY_ENGINE_SOURCE,
      };
    });
  }

  async getStarMarkers(
    date: string,
    location: Location,
    markers = DEFAULT_STAR_MARKERS,
  ): Promise<StarMarker[]> {
    const dawnSky = await this.getDawnSky(date, location, markers);

    return dawnSky.starMarkers;
  }

  async getDawnSky(
    date: string,
    location: Location,
    markers = DEFAULT_STAR_MARKERS,
  ): Promise<DawnSky> {
    return this.calculate('star markers', async (engine) => {
      const observer = this.observer(engine, location);
      const observedAt = this.dawnObservationTime(
        date,
        location,
        engine,
        observer,
      );
      const calculation =
        'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.';
      const sunPath = this.dawnSunPath(date, location, engine, observer);
      const sunriseExtremes = this.calculateSunriseExtremes(
        Number.parseInt(date.slice(0, 4), 10),
        location,
        engine,
        observer,
      );
      const moon = this.dawnMoon(engine, observer, observedAt);

      return {
        starMarkers: markers
          .map((marker) =>
            this.calculateStarMarker(
              marker,
              engine,
              observer,
              observedAt,
              calculation,
            ),
          )
          .sort((a, b) => b.altitudeDegrees - a.altitudeDegrees),
        sunPath,
        sunriseExtremes,
        moon,
      };
    });
  }

  async getSunriseExtremes(
    year: number,
    location: Location,
  ): Promise<DawnSunriseExtremes> {
    return this.calculate('sunrise extremes', async (engine) => {
      const observer = this.observer(engine, location);

      return this.calculateSunriseExtremes(year, location, engine, observer);
    });
  }

  async getStarFirstAppearances(
    startDate: string,
    endDate: string,
    location: Location,
    markers = DEFAULT_STAR_MARKERS,
  ): Promise<StarMarker[]> {
    return this.calculate('star first appearances', async (engine) => {
      const observer = this.observer(engine, location);
      const dawnWindowCache: DawnRisingObservationWindowCache = new Map();
      const starEquatorCache: StarEquatorCache = new Map();
      const appearances: StarMarker[] = [];
      const remainingMarkers = new Map(
        markers.map((marker) => [marker.id, marker]),
      );
      let date = startDate;

      while (date < endDate && remainingMarkers.size > 0) {
        for (const marker of [...remainingMarkers.values()]) {
          const starMarker = this.findFirstDawnRisingAppearance(
            marker,
            date,
            location,
            engine,
            observer,
            dawnWindowCache,
            starEquatorCache,
          );

          if (starMarker) {
            appearances.push(starMarker);
            remainingMarkers.delete(marker.id);
          }
        }

        date = this.addIsoDateDays(date, 1);
      }

      return appearances.sort(
        (a, b) => a.observedAt.getTime() - b.observedAt.getTime(),
      );
    });
  }

  async getStarFirstAppearancesForWindows(
    windows: StarMarkerAppearanceWindow[],
    location: Location,
  ): Promise<StarMarkerWindowAppearance[]> {
    if (!windows.length) {
      return [];
    }

    return this.calculate('star first appearance windows', async (engine) => {
      const observer = this.observer(engine, location);
      const dawnWindowCache: DawnRisingObservationWindowCache = new Map();
      const starEquatorCache: StarEquatorCache = new Map();
      const appearances = new Map<string, StarMarker>();
      const pendingWindows = windows
        .filter((window) => window.startDate < window.endDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      if (!pendingWindows.length) {
        return windows.map((window) => ({ id: window.id }));
      }

      const activeWindows = new Map<string, StarMarkerAppearanceWindow>();
      const startDate = pendingWindows[0].startDate;
      const endDate = pendingWindows.reduce(
        (latest, window) => (window.endDate > latest ? window.endDate : latest),
        pendingWindows[0].endDate,
      );
      let date = startDate;
      let nextWindowIndex = 0;

      while (
        date < endDate &&
        (activeWindows.size > 0 || nextWindowIndex < pendingWindows.length)
      ) {
        while (
          nextWindowIndex < pendingWindows.length &&
          pendingWindows[nextWindowIndex].startDate <= date
        ) {
          const window = pendingWindows[nextWindowIndex];
          activeWindows.set(window.id, window);
          nextWindowIndex += 1;
        }

        for (const window of [...activeWindows.values()]) {
          if (date >= window.endDate) {
            activeWindows.delete(window.id);
            continue;
          }

          const starMarker = this.findFirstDawnRisingAppearance(
            window.marker,
            date,
            location,
            engine,
            observer,
            dawnWindowCache,
            starEquatorCache,
          );

          if (starMarker) {
            appearances.set(window.id, starMarker);
            activeWindows.delete(window.id);
          }
        }

        date = this.addIsoDateDays(date, 1);
      }

      return windows.map((window) => ({
        id: window.id,
        marker: appearances.get(window.id),
      }));
    });
  }

  async getStarNightInvisibilityPeriods(
    startDate: string,
    endDate: string,
    location: Location,
    markers = DEFAULT_STAR_MARKERS,
    sunAltitudeThresholdDegrees = ASTRONOMICAL_NIGHT_SUN_ALTITUDE_DEGREES,
  ): Promise<StarMarkerNightInvisibilityPeriod[]> {
    return this.calculate('star night invisibility periods', async (engine) => {
      const observer = this.observer(engine, location);
      const periods: StarMarkerNightInvisibilityPeriod[] = [];

      for (const marker of markers) {
        let currentStart: string | undefined;
        let currentEnd: string | undefined;
        let date = startDate;

        while (date < endDate) {
          const visibleAtNight = this.isMarkerVisibleAtNight(
            marker,
            date,
            location,
            engine,
            observer,
            sunAltitudeThresholdDegrees,
          );

          if (!visibleAtNight) {
            currentStart ??= date;
            currentEnd = date;
          } else if (currentStart && currentEnd) {
            periods.push(
              this.createStarNightInvisibilityPeriod(
                marker,
                currentStart,
                currentEnd,
                sunAltitudeThresholdDegrees,
              ),
            );
            currentStart = undefined;
            currentEnd = undefined;
          }

          date = this.addIsoDateDays(date, 1);
        }

        if (currentStart && currentEnd) {
          periods.push(
            this.createStarNightInvisibilityPeriod(
              marker,
              currentStart,
              currentEnd,
              sunAltitudeThresholdDegrees,
            ),
          );
        }
      }

      return periods;
    });
  }

  private dawnObservationTime(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): Date {
    const { astronomicalDawn, nauticalDawn } = this.dawnObservationWindow(
      date,
      location,
      engine,
      observer,
    );

    return new Date(
      (astronomicalDawn.getTime() + nauticalDawn.getTime()) / 2,
    );
  }

  private dawnObservationWindow(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): { astronomicalDawn: Date; nauticalDawn: Date; sunrise: Date } {
    const startsAt = this.localDateAtTime(date, location, 0, 0);
    const astronomicalDawn = engine.SearchAltitude(
      engine.Body.Sun,
      observer,
      1,
      startsAt,
      1,
      -18,
    )?.date;
    const nauticalDawn = astronomicalDawn
      ? engine.SearchAltitude(
          engine.Body.Sun,
          observer,
          1,
          astronomicalDawn,
          1,
          -12,
        )?.date
      : null;
    const sunrise = astronomicalDawn
      ? engine.SearchAltitude(
          engine.Body.Sun,
          observer,
          1,
          astronomicalDawn,
          1,
          0,
        )?.date
      : null;

    if (!astronomicalDawn || !nauticalDawn || !sunrise) {
      throw this.dataUnavailable(`No dawn data found for ${date}`);
    }

    return { astronomicalDawn, nauticalDawn, sunrise };
  }

  private dawnSunPath(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): DawnSunPath {
    const { astronomicalDawn, sunrise } = this.dawnObservationWindow(
      date,
      location,
      engine,
      observer,
    );
    const points: DawnSunPathPoint[] = [];
    const durationMs = sunrise.getTime() - astronomicalDawn.getTime();
    const sampleCount = 6;

    for (let index = 0; index <= sampleCount; index += 1) {
      const observedAt = new Date(
        astronomicalDawn.getTime() + (durationMs * index) / sampleCount,
      );
      points.push(this.sunPathPoint(observedAt, engine, observer));
    }

    return {
      startsAt: astronomicalDawn,
      sunriseAt: sunrise,
      points,
      calculation:
        'Sun path sampled from astronomical dawn, when the rising Sun crosses 18° below the horizon, through sunrise at 0° altitude.',
    };
  }

  private sunPathPoint(
    observedAt: Date,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): DawnSunPathPoint {
    const equator = engine.Equator(
      engine.Body.Sun,
      observedAt,
      observer,
      true,
      true,
    );
    const horizon = engine.Horizon(
      observedAt,
      observer,
      equator.ra,
      equator.dec,
      'normal',
    );

    return {
      observedAt,
      altitudeDegrees: this.roundTo(horizon.altitude, 1),
      azimuthDegrees: this.roundTo(horizon.azimuth, 1),
      direction: this.directionFromAzimuth(horizon.azimuth),
    };
  }

  private calculateSunriseExtremes(
    year: number,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): DawnSunriseExtremes {
    const startDate = `${year.toString().padStart(4, '0')}-01-01`;
    const endDate = `${(year + 1).toString().padStart(4, '0')}-01-01`;
    let localDate = startDate;
    let northernmost: DawnSunriseExtremePoint | undefined;
    let southernmost: DawnSunriseExtremePoint | undefined;

    while (localDate < endDate) {
      const point = this.sunrisePoint(localDate, location, engine, observer);

      if (!northernmost || point.azimuthDegrees < northernmost.azimuthDegrees) {
        northernmost = point;
      }

      if (!southernmost || point.azimuthDegrees > southernmost.azimuthDegrees) {
        southernmost = point;
      }

      localDate = this.addIsoDateDays(localDate, 1);
    }

    if (!northernmost || !southernmost) {
      throw this.dataUnavailable(`No sunrise extremes found for ${year}`);
    }

    return {
      year,
      northernmost,
      southernmost,
      calculation:
        'Northernmost and southernmost sunrise points found by scanning daily sunrise azimuths across the selected local calendar year.',
    };
  }

  private sunrisePoint(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): DawnSunriseExtremePoint {
    const startsAt = this.localDateAtTime(date, location, 0, 0);
    const sunriseAt = engine.SearchAltitude(
      engine.Body.Sun,
      observer,
      1,
      startsAt,
      1,
      0,
    )?.date;

    if (!sunriseAt) {
      throw this.dataUnavailable(`No sunrise data found for ${date}`);
    }

    return {
      date,
      ...this.sunPathPoint(sunriseAt, engine, observer),
    };
  }

  private dawnMoon(
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    observedAt: Date,
  ): DawnMoon {
    const equator = engine.Equator(
      engine.Body.Moon,
      observedAt,
      observer,
      true,
      true,
    );
    const horizon = engine.Horizon(
      observedAt,
      observer,
      equator.ra,
      equator.dec,
      'normal',
    );
    const moonPhaseAngle = engine.MoonPhase(observedAt);
    const illumination = engine.Illumination(engine.Body.Moon, observedAt);

    return {
      name: 'Moon',
      type: 'moon',
      observedAt,
      phase: this.phaseNameFromAngle(moonPhaseAngle),
      fractionIlluminated: this.roundTo(illumination.phase_fraction, 4),
      altitudeDegrees: this.roundTo(horizon.altitude, 1),
      azimuthDegrees: this.roundTo(horizon.azimuth, 1),
      direction: this.directionFromAzimuth(horizon.azimuth),
      visibility: this.visibilityFromAltitude(horizon.altitude),
      calculation:
        'Moon sky position sampled at the dawn marker observation time.',
      source: ASTRONOMY_ENGINE_SOURCE,
    };
  }

  private findFirstDawnRisingAppearance(
    marker: StarMarkerDefinition,
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    dawnWindowCache?: DawnRisingObservationWindowCache,
    starEquatorCache?: StarEquatorCache,
  ): StarMarker | undefined {
    const config = this.dawnRisingConfig(marker);
    const dawnWindow = this.cachedDawnRisingObservationWindow(
      date,
      location,
      engine,
      observer,
      config,
      dawnWindowCache,
    );
    const calculation = this.dawnRisingCalculation(config);
    let observedAt = dawnWindow.startsAt;

    while (observedAt.getTime() <= dawnWindow.endsAt.getTime()) {
      const starMarker = this.calculateStarMarker(
        marker,
        engine,
        observer,
        observedAt,
        calculation,
        starEquatorCache,
      );

      if (this.isDawnRisingAppearance(starMarker, config)) {
        return starMarker;
      }

      observedAt = new Date(
        observedAt.getTime() + config.sampleMinutes * MS_PER_MINUTE,
      );
    }

    return undefined;
  }

  private dawnRisingConfig(
    marker: StarMarkerDefinition,
  ): StarMarkerDawnRisingConfig {
    return marker.dawnRising ?? DEFAULT_DAWN_RISING_CONFIG;
  }

  private dawnRisingObservationWindow(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    config: StarMarkerDawnRisingConfig,
  ): DawnRisingObservationWindow {
    const localStart = this.localDateAtTime(date, location, 0, 0);
    const startsAt = engine.SearchAltitude(
      engine.Body.Sun,
      observer,
      1,
      localStart,
      1,
      config.startSunAltitudeDegrees,
    )?.date;
    const endsAt = startsAt
      ? engine.SearchAltitude(
          engine.Body.Sun,
          observer,
          1,
          startsAt,
          1,
          config.endSunAltitudeDegrees,
        )?.date
      : null;

    if (!startsAt || !endsAt) {
      throw this.dataUnavailable(`No dawn rising data found for ${date}`);
    }

    return { startsAt, endsAt };
  }

  private cachedDawnRisingObservationWindow(
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    config: StarMarkerDawnRisingConfig,
    cache?: DawnRisingObservationWindowCache,
  ): DawnRisingObservationWindow {
    if (!cache) {
      return this.dawnRisingObservationWindow(
        date,
        location,
        engine,
        observer,
        config,
      );
    }

    const key = this.dawnRisingObservationWindowCacheKey(date, config);
    const cachedWindow = cache.get(key);
    if (cachedWindow) {
      return cachedWindow;
    }

    const window = this.dawnRisingObservationWindow(
      date,
      location,
      engine,
      observer,
      config,
    );
    cache.set(key, window);
    return window;
  }

  private dawnRisingObservationWindowCacheKey(
    date: string,
    config: StarMarkerDawnRisingConfig,
  ): string {
    return [
      date,
      config.startSunAltitudeDegrees,
      config.endSunAltitudeDegrees,
    ].join(':');
  }

  private dawnRisingCalculation(config: StarMarkerDawnRisingConfig): string {
    if (
      config.startSunAltitudeDegrees ===
        DEFAULT_DAWN_RISING_CONFIG.startSunAltitudeDegrees &&
      config.endSunAltitudeDegrees ===
        DEFAULT_DAWN_RISING_CONFIG.endSunAltitudeDegrees &&
      config.minimumMarkerAltitudeDegrees ===
        DEFAULT_DAWN_RISING_CONFIG.minimumMarkerAltitudeDegrees &&
      config.minimumAzimuthDegrees ===
        DEFAULT_DAWN_RISING_CONFIG.minimumAzimuthDegrees &&
      config.maximumAzimuthDegrees ===
        DEFAULT_DAWN_RISING_CONFIG.maximumAzimuthDegrees
    ) {
      return 'First dawn-window sample between the rising Sun crossing 18° below the horizon and sunrise where the marker is above the eastern horizon.';
    }

    return `First dawn-rising sample where the Sun is between ${config.startSunAltitudeDegrees}° and ${config.endSunAltitudeDegrees}° altitude, the marker is at least ${config.minimumMarkerAltitudeDegrees}° altitude, and azimuth is between ${config.minimumAzimuthDegrees}° and ${config.maximumAzimuthDegrees}°.`;
  }

  private async getMoonPhasesForSurroundingYears(
    date: Date,
  ): Promise<MoonPhase[]> {
    const year = date.getUTCFullYear();
    const [previousYear, requestedYear, nextYear] = await Promise.all([
      this.getMoonPhases(year - 1),
      this.getMoonPhases(year),
      this.getMoonPhases(year + 1),
    ]);

    return [...previousYear, ...requestedYear, ...nextYear];
  }

  private async calculate<T>(
    label: string,
    calculateValue: (engine: AstronomyEngineModule) => Promise<T>,
  ): Promise<T> {
    try {
      return await calculateValue(await this.enginePromise);
    } catch (error) {
      if (error instanceof AstronomyProviderError) {
        throw error;
      }

      throw new AstronomyProviderError(
        ASTRONOMY_ENGINE_SOURCE,
        'request-failed',
        `Astronomy Engine ${label} calculation failed: ${this.getErrorMessage(error)}`,
        { cause: error },
      );
    }
  }

  private normalizeEngineModule(
    module: AstronomyEngineModule & { default?: AstronomyEngineModule },
  ): AstronomyEngineModule {
    return module.Body ? module : module.default ?? module;
  }

  private observer(
    engine: AstronomyEngineModule,
    location: Location,
  ): InstanceType<AstronomyEngineModule['Observer']> {
    return new engine.Observer(location.latitude, location.longitude, 0);
  }

  private markerCoordinates(
    marker: StarMarkerDefinition,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    observedAt: Date,
    starEquatorCache?: StarEquatorCache,
  ): StarEquatorResult {
    if (marker.representative.kind === 'fixed-equatorial') {
      const key = [
        marker.id,
        marker.representative.rightAscensionHours,
        marker.representative.declinationDegrees,
      ].join(':');
      const cachedCoordinates = starEquatorCache?.get(key);
      if (cachedCoordinates) {
        return cachedCoordinates;
      }

      const coordinates = {
        ra: marker.representative.rightAscensionHours,
        dec: marker.representative.declinationDegrees,
      };
      starEquatorCache?.set(key, coordinates);
      return coordinates;
    }

    const body = engine.Body[marker.representative.body];
    if (!body) {
      throw this.dataUnavailable(
        `Astronomy Engine body unavailable for ${marker.name}`,
      );
    }

    return engine.Equator(body, observedAt, observer, true, true);
  }

  private calculateStarMarker(
    marker: StarMarkerDefinition,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    observedAt: Date,
    calculation: string,
    starEquatorCache?: StarEquatorCache,
  ): StarMarker {
    const coordinates = this.markerCoordinates(
      marker,
      engine,
      observer,
      observedAt,
      starEquatorCache,
    );
    const horizon = engine.Horizon(
      observedAt,
      observer,
      coordinates.ra,
      coordinates.dec,
      'normal',
    );

    return {
      id: marker.id,
      name: marker.name,
      type: marker.type,
      englishName: marker.englishName,
      description: marker.description,
      seasonalAssociation: marker.seasonalAssociation,
      source: marker.source,
      sourceUrl: marker.sourceUrl,
      confidence: marker.confidence,
      observedAt,
      altitudeDegrees: this.roundTo(horizon.altitude, 1),
      azimuthDegrees: this.roundTo(horizon.azimuth, 1),
      direction: this.directionFromAzimuth(horizon.azimuth),
      visibility: this.visibilityFromAltitude(horizon.altitude),
      calculation,
    };
  }

  private createStarNightInvisibilityPeriod(
    marker: StarMarkerDefinition,
    startsOn: string,
    endsOn: string,
    sunAltitudeThresholdDegrees: number,
  ): StarMarkerNightInvisibilityPeriod {
    return {
      markerId: marker.id,
      markerName: marker.name,
      startsOn,
      endsOn,
      days: this.daysBetweenInclusive(startsOn, endsOn),
      sunAltitudeThresholdDegrees,
      calculation:
        'Consecutive local dates where the marker is never above the horizon while the Sun is below the configured night threshold.',
    };
  }

  private isMarkerVisibleAtNight(
    marker: StarMarkerDefinition,
    date: string,
    location: Location,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
    sunAltitudeThresholdDegrees: number,
  ): boolean {
    const range = this.localDateRange(date, location);
    const endsAt = new Date(
      range.startsAt.getTime() + range.limitDays * MS_PER_DAY,
    );
    let observedAt = range.startsAt;

    while (observedAt.getTime() < endsAt.getTime()) {
      const sunAltitude = this.sunAltitude(
        observedAt,
        engine,
        observer,
      );
      if (sunAltitude <= sunAltitudeThresholdDegrees) {
        const markerPosition = this.calculateStarMarker(
          marker,
          engine,
          observer,
          observedAt,
          'Night visibility sample.',
        );
        if (markerPosition.altitudeDegrees >= 0) {
          return true;
        }
      }

      observedAt = new Date(
        observedAt.getTime() +
          NIGHT_VISIBILITY_SAMPLE_MINUTES * MS_PER_MINUTE,
      );
    }

    return false;
  }

  private sunAltitude(
    observedAt: Date,
    engine: AstronomyEngineModule,
    observer: InstanceType<AstronomyEngineModule['Observer']>,
  ): number {
    const coordinates = engine.Equator(
      engine.Body.Sun,
      observedAt,
      observer,
      true,
      true,
    );
    const horizon = engine.Horizon(
      observedAt,
      observer,
      coordinates.ra,
      coordinates.dec,
      'normal',
    );

    return horizon.altitude;
  }

  private isDawnRisingAppearance(
    marker: StarMarker,
    config: StarMarkerDawnRisingConfig,
  ): boolean {
    return (
      marker.altitudeDegrees >= config.minimumMarkerAltitudeDegrees &&
      marker.azimuthDegrees >= config.minimumAzimuthDegrees &&
      marker.azimuthDegrees <= config.maximumAzimuthDegrees
    );
  }

  private localDateRange(
    date: string,
    location: Location,
  ): { startsAt: Date; limitDays: number } {
    const startsAt = this.localDateAtTime(date, location, 0, 0);
    const endsAt = this.localDateAtTime(
      this.addIsoDateDays(date, 1),
      location,
      0,
      0,
    );

    return {
      startsAt,
      limitDays: (endsAt.getTime() - startsAt.getTime()) / MS_PER_DAY,
    };
  }

  private localDateAtNoon(date: string, location: Location): Date {
    return this.localDateAtTime(date, location, 12, 0);
  }

  private localDateAtTime(
    date: string,
    location: Location,
    hour: number,
    minute: number,
  ): Date {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      throw new AstronomyProviderError(
        ASTRONOMY_ENGINE_SOURCE,
        'invalid-response',
        `Invalid local date: ${date}`,
      );
    }

    return parseLocalDateTimeInTimezone(
      {
        year,
        month,
        day,
        hour,
        minute,
      },
      location.timezone,
    );
  }

  private addIsoDateDays(date: string, days: number): string {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const result = new Date(
      Date.UTC(
        Number.parseInt(yearPart, 10),
        Number.parseInt(monthPart, 10) - 1,
        Number.parseInt(dayPart, 10) + days,
      ),
    );

    return result.toISOString().slice(0, 10);
  }

  private daysBetweenInclusive(startsOn: string, endsOn: string): number {
    const [startYear, startMonth, startDay] = startsOn
      .split('-')
      .map((part) => Number.parseInt(part, 10));
    const [endYear, endMonth, endDay] = endsOn
      .split('-')
      .map((part) => Number.parseInt(part, 10));
    const startsAt = Date.UTC(startYear, startMonth - 1, startDay);
    const endsAt = Date.UTC(endYear, endMonth - 1, endDay);

    return Math.floor((endsAt - startsAt) / MS_PER_DAY) + 1;
  }

  private quarterName(quarter: number): MoonPhaseName {
    const phases: MoonPhaseName[] = [
      'New Moon',
      'First Quarter',
      'Full Moon',
      'Last Quarter',
    ];
    const phase = phases[quarter];
    if (!phase) {
      throw new AstronomyProviderError(
        ASTRONOMY_ENGINE_SOURCE,
        'invalid-response',
        `Unknown Astronomy Engine moon quarter: ${quarter}`,
      );
    }

    return phase;
  }

  private phaseNameFromAngle(angle: number): MoonPhaseName {
    const normalizedAngle = ((angle % 360) + 360) % 360;

    if (normalizedAngle < 22.5 || normalizedAngle >= 337.5) {
      return 'New Moon';
    }
    if (normalizedAngle < 67.5) {
      return 'Waxing Crescent';
    }
    if (normalizedAngle < 112.5) {
      return 'First Quarter';
    }
    if (normalizedAngle < 157.5) {
      return 'Waxing Gibbous';
    }
    if (normalizedAngle < 202.5) {
      return 'Full Moon';
    }
    if (normalizedAngle < 247.5) {
      return 'Waning Gibbous';
    }
    if (normalizedAngle < 292.5) {
      return 'Last Quarter';
    }

    return 'Waning Crescent';
  }

  private visibilityFromAltitude(altitude: number): StarMarkerVisibility {
    if (altitude >= 20) {
      return 'prominent';
    }
    if (altitude >= 5) {
      return 'visible';
    }
    if (altitude >= 0) {
      return 'low';
    }

    return 'below-horizon';
  }

  private directionFromAzimuth(azimuth: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const normalized = ((azimuth % 360) + 360) % 360;
    const index = Math.round(normalized / 45) % directions.length;

    return directions[index];
  }

  private closestPhase(date: Date, phases: MoonPhase[]): MoonPhase | undefined {
    return [...phases].sort(
      (a, b) =>
        Math.abs(a.occursAt.getTime() - date.getTime()) -
        Math.abs(b.occursAt.getTime() - date.getTime()),
    )[0];
  }

  private async optional<T>(getValue: () => Promise<T>): Promise<T | undefined> {
    try {
      return await getValue();
    } catch (error) {
      if (error instanceof AstronomyProviderError) {
        if (error.code === 'data-unavailable') {
          return undefined;
        }
      }

      throw error;
    }
  }

  private dataUnavailable(message: string): AstronomyProviderError {
    return new AstronomyProviderError(
      ASTRONOMY_ENGINE_SOURCE,
      'data-unavailable',
      message,
    );
  }

  private roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;

    return Math.round(value * factor) / factor;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
