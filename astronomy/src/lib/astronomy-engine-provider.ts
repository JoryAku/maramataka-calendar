import {
  AstronomyProvider,
  FullMoon,
  Location,
  MoonDetails,
  MoonPhase,
  MoonPhaseName,
  MoonRise,
  MoonRiseSet,
  MoonTransit,
  NewMoon,
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

type AstronomyEngineModule = typeof import('astronomy-engine');

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
        moonrise: await this.optional(() => this.getMoonRise(date, location)),
        moonset: await this.optional(async () => {
          const moonRiseSet = await this.getMoonRiseSet(date, location);
          return {
            date,
            setsAt: moonRiseSet.setsAt,
            source: moonRiseSet.source,
          };
        }),
        transit: await this.optional(() => this.getMoonTransit(date, location)),
        source: ASTRONOMY_ENGINE_SOURCE,
      };
    });
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
