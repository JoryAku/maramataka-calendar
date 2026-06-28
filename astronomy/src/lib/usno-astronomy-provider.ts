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
import {
  getTimezoneOffsetHours,
  parseLocalDateTimeInTimezone,
} from './timezone';
import { AstronomyProviderError } from './astronomy-provider-error';
import {
  calculateLunarAgeDays,
  LUNAR_AGE_SOURCE,
} from './moon-metrics';

type FetchFn = typeof fetch;

export interface UsnoAstronomyProviderOptions {
  timeoutMs?: number;
}

const DEFAULT_USNO_TIMEOUT_MS = 10_000;

interface UsnoRiseSetTransitItem {
  phen: string;
  time: string;
}

interface UsnoRiseSetTransitData {
  properties?: {
    data?: {
      closestphase?: UsnoMoonPhase;
      curphase?: string;
      fracillum?: string;
      sundata?: UsnoRiseSetTransitItem[];
      moondata?: UsnoRiseSetTransitItem[];
    };
  };
}

interface UsnoMoonPhase {
  phase: string;
  year: number | string;
  month: number | string;
  day: number | string;
  time: string;
}

interface UsnoMoonPhaseData {
  phasedata?: UsnoMoonPhase[];
}

export class UsnoAstronomyProvider implements AstronomyProvider {
  private readonly timeoutMs: number;

  constructor(
    private readonly fetchFn: FetchFn = fetch,
    options: UsnoAstronomyProviderOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_USNO_TIMEOUT_MS;
  }

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    const data = await this.fetchJson<UsnoMoonPhaseData>(
      `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`,
      'moon phases',
    );

    if (!this.isMoonPhaseData(data)) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        'USNO moon phases response did not match the expected shape',
      );
    }

    return data.phasedata.map((phase) => this.parseMoonPhase(phase));
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
    const data = await this.getRiseSetTransitData(date, location, 'moonrise');
    const moonrise = data.properties?.data?.moondata?.find(
      (item) => item.phen === 'Rise',
    );

    if (!moonrise) {
      throw new AstronomyProviderError(
        'usno',
        'data-unavailable',
        `No moonrise data found for ${date}`,
      );
    }

    return {
      date,
      risesAt: this.parseLocalUsnoTime(
        date,
        moonrise.time,
        location,
        'moonrise',
      ),
      source: 'usno',
    };
  }

  async getMoonTransit(date: string, location: Location): Promise<MoonTransit> {
    const data = await this.getRiseSetTransitData(
      date,
      location,
      'moon transit',
    );
    const transit = data.properties?.data?.moondata?.find(
      (item) => item.phen === 'Upper Transit',
    );

    if (!transit) {
      throw new AstronomyProviderError(
        'usno',
        'data-unavailable',
        `No moon transit data found for ${date}`,
      );
    }

    return {
      date,
      transitsAt: this.parseLocalUsnoTime(
        date,
        transit.time,
        location,
        'moon transit',
      ),
      source: 'usno',
    };
  }

  async getMoonDetails(date: string, location: Location): Promise<MoonDetails> {
    const data = await this.getRiseSetTransitData(
      date,
      location,
      'moon details',
    );
    const details = data.properties?.data;

    if (!details?.curphase) {
      throw new AstronomyProviderError(
        'usno',
        'data-unavailable',
        `No moon phase data found for ${date}`,
      );
    }

    const moonrise = details.moondata?.find((item) => item.phen === 'Rise');
    const moonset = details.moondata?.find((item) => item.phen === 'Set');
    const transit = details.moondata?.find(
      (item) => item.phen === 'Upper Transit',
    );
    const detailsAt = this.parseLocalDateAtNoon(date, location);
    const phases = await this.getMoonPhasesForSurroundingYears(detailsAt);
    const lunarAgeDays = calculateLunarAgeDays(detailsAt, phases);

    return {
      date,
      phase: this.parseMoonPhaseName(details.curphase),
      fractionIlluminated: this.parseFractionIlluminated(
        details.fracillum,
        date,
      ),
      ...(lunarAgeDays !== undefined
        ? {
            lunarAgeDays,
            lunarAgeSource: LUNAR_AGE_SOURCE,
          }
        : {}),
      closestPhase: details.closestphase
        ? this.parseMoonPhase(details.closestphase, location.timezone)
        : undefined,
      moonrise: moonrise
        ? {
            date,
            risesAt: this.parseLocalUsnoTime(
              date,
              moonrise.time,
              location,
              'moonrise',
            ),
            source: 'usno',
          }
        : undefined,
      moonset: moonset
        ? {
            date,
            setsAt: this.parseLocalUsnoTime(
              date,
              moonset.time,
              location,
              'moonset',
            ),
            source: 'usno',
          }
        : undefined,
      transit: transit
        ? {
            date,
            transitsAt: this.parseLocalUsnoTime(
              date,
              transit.time,
              location,
              'moon transit',
            ),
            source: 'usno',
          }
        : undefined,
      source: 'usno',
    };
  }

  async getMoonRiseSet(date: string, location: Location): Promise<MoonRiseSet> {
    const todayData = await this.getRiseSetTransitData(
      date,
      location,
      'moonrise/moonset',
    );
    const moonrise = todayData.properties?.data?.moondata?.find(
      (item) => item.phen === 'Rise',
    );

    if (!moonrise) {
      throw new AstronomyProviderError(
        'usno',
        'data-unavailable',
        `No moonrise data found for ${date}`,
      );
    }

    const risesAt = this.parseLocalUsnoTime(
      date,
      moonrise.time,
      location,
      'moonrise',
    );
    const sameDaySet = todayData.properties?.data?.moondata
      ?.filter((item) => item.phen === 'Set')
      .map((item) =>
        this.parseLocalUsnoTime(date, item.time, location, 'moonset'),
      )
      .find((setsAt) => setsAt.getTime() > risesAt.getTime());

    if (sameDaySet) {
      return {
        date,
        risesAt,
        setsAt: sameDaySet,
        source: 'usno',
      };
    }

    const nextDate = this.addIsoDateDays(date, 1);
    const nextDayData = await this.getRiseSetTransitData(
      nextDate,
      location,
      'moonrise/moonset',
    );
    const nextSet = nextDayData.properties?.data?.moondata
      ?.filter((item) => item.phen === 'Set')
      .map((item) =>
        this.parseLocalUsnoTime(nextDate, item.time, location, 'moonset'),
      )
      .find((setsAt) => setsAt.getTime() > risesAt.getTime());

    if (!nextSet) {
      throw new AstronomyProviderError(
        'usno',
        'data-unavailable',
        `No moonset found after moonrise on ${date}`,
      );
    }

    return {
      date,
      risesAt,
      setsAt: nextSet,
      source: 'usno',
    };
  }

  private async getRiseSetTransitData(
    date: string,
    location: Location,
    label: string,
  ): Promise<UsnoRiseSetTransitData> {
    const timezoneOffset = this.getTimezoneOffsetForLocalDate(date, location);
    const data = await this.fetchJson<UsnoRiseSetTransitData>(
      `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${location.latitude},${location.longitude}&tz=${timezoneOffset}`,
      label,
    );

    if (!this.isRiseSetTransitData(data)) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `USNO ${label} response did not match the expected shape`,
      );
    }

    return data;
  }

  private async fetchJson<T>(url: string, label: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, { signal: controller.signal });
      if (!response.ok) {
        throw new AstronomyProviderError(
          'usno',
          'request-failed',
          `USNO ${label} request failed: ${response.status}`,
        );
      }

      try {
        return (await response.json()) as T;
      } catch (error) {
        throw new AstronomyProviderError(
          'usno',
          'invalid-response',
          `USNO ${label} response was not valid JSON`,
          { cause: error },
        );
      }
    } catch (error) {
      if (error instanceof AstronomyProviderError) {
        throw error;
      }

      if (this.isAbortError(error)) {
        throw new AstronomyProviderError(
          'usno',
          'request-timeout',
          `USNO ${label} request timed out after ${this.timeoutMs}ms`,
          { cause: error },
        );
      }

      throw new AstronomyProviderError(
        'usno',
        'request-failed',
        `USNO ${label} request failed: ${this.getErrorMessage(error)}`,
        { cause: error },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseLocalUsnoTime(
    date: string,
    time: string,
    location: Location,
    label: string,
  ): Date {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const [hoursPart, minutesPart] = String(time).split(':');
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);
    const hour = Number.parseInt(hoursPart, 10);
    const minute = Number.parseInt(minutesPart, 10);

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    ) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO ${label} date/time: ${date} ${String(time)}`,
      );
    }

    try {
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
    } catch (error) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO ${label} local date/time for ${location.timezone}: ${this.getErrorMessage(error)}`,
        { cause: error },
      );
    }
  }

  private parseLocalDateAtNoon(date: string, location: Location): Date {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO local date: ${date}`,
      );
    }

    return parseLocalDateTimeInTimezone(
      {
        year,
        month,
        day,
        hour: 12,
        minute: 0,
      },
      location.timezone,
    );
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

  private parseMoonPhase(phase: UsnoMoonPhase, timezone?: string): MoonPhase {
    const moonYear = Number.parseInt(String(phase.year), 10);
    const moonMonth = Number.parseInt(String(phase.month), 10);
    const moonDay = Number.parseInt(String(phase.day), 10);
    const [hoursPart, minutesPart] = String(phase.time).split(':');
    const moonHour = Number.parseInt(hoursPart, 10);
    const moonMinute = Number.parseInt(minutesPart, 10);

    if (
      Number.isNaN(moonYear) ||
      Number.isNaN(moonMonth) ||
      Number.isNaN(moonDay) ||
      Number.isNaN(moonHour) ||
      Number.isNaN(moonMinute)
    ) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO moon phase date/time: ${JSON.stringify(phase)}`,
      );
    }

    return {
      phase: this.parseMoonPhaseName(phase.phase),
      occursAt: timezone
        ? parseLocalDateTimeInTimezone(
            {
              year: moonYear,
              month: moonMonth,
              day: moonDay,
              hour: moonHour,
              minute: moonMinute,
            },
            timezone,
          )
        : new Date(
            Date.UTC(moonYear, moonMonth - 1, moonDay, moonHour, moonMinute),
          ),
      source: 'usno',
    };
  }

  private getTimezoneOffsetForLocalDate(
    date: string,
    location: Location,
  ): number {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO local date: ${date}`,
      );
    }

    const localNoon = parseLocalDateTimeInTimezone(
      {
        year,
        month,
        day,
        hour: 12,
        minute: 0,
      },
      location.timezone,
    );

    return getTimezoneOffsetHours(location.timezone, localNoon);
  }

  private parseMoonPhaseName(phase: string): MoonPhaseName {
    const validPhases: MoonPhaseName[] = [
      'New Moon',
      'Waxing Crescent',
      'First Quarter',
      'Waxing Gibbous',
      'Full Moon',
      'Waning Gibbous',
      'Last Quarter',
      'Waning Crescent',
    ];

    if (!validPhases.includes(phase as MoonPhaseName)) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Unknown USNO moon phase: ${phase}`,
      );
    }

    return phase as MoonPhaseName;
  }

  private parseFractionIlluminated(
    value: string | undefined,
    date: string,
  ): number {
    const match = value?.match(/^(\d+(?:\.\d+)?)%$/);
    if (!match) {
      throw new AstronomyProviderError(
        'usno',
        'invalid-response',
        `Invalid USNO moon illumination for ${date}: ${String(value)}`,
      );
    }

    return Number(match[1]) / 100;
  }

  private addIsoDateDays(date: string, days: number): string {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);
    const result = new Date(Date.UTC(year, month - 1, day + days));

    return [
      result.getUTCFullYear(),
      String(result.getUTCMonth() + 1).padStart(2, '0'),
      String(result.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isMoonPhaseData(data: unknown): data is Required<UsnoMoonPhaseData> {
    if (!this.isRecord(data) || !Array.isArray(data['phasedata'])) {
      return false;
    }

    return data['phasedata'].every((phase) => this.isMoonPhase(phase));
  }

  private isMoonPhase(phase: unknown): phase is UsnoMoonPhase {
    return (
      this.isRecord(phase) &&
      typeof phase['phase'] === 'string' &&
      (typeof phase['year'] === 'number' ||
        typeof phase['year'] === 'string') &&
      (typeof phase['month'] === 'number' ||
        typeof phase['month'] === 'string') &&
      (typeof phase['day'] === 'number' || typeof phase['day'] === 'string') &&
      typeof phase['time'] === 'string'
    );
  }

  private isRiseSetTransitData(data: unknown): data is UsnoRiseSetTransitData {
    if (!this.isRecord(data)) {
      return false;
    }

    const properties = data['properties'];
    if (!this.isRecord(properties)) {
      return false;
    }

    const dayData = properties['data'];
    if (!this.isRecord(dayData)) {
      return false;
    }

    return (
      this.isOptionalMoonPhase(dayData['closestphase']) &&
      this.isOptionalString(dayData['curphase']) &&
      this.isOptionalString(dayData['fracillum']) &&
      this.isOptionalRiseSetTransitItems(dayData['moondata']) &&
      this.isOptionalRiseSetTransitItems(dayData['sundata'])
    );
  }

  private isOptionalMoonPhase(value: unknown): boolean {
    return value === undefined || this.isMoonPhase(value);
  }

  private isOptionalRiseSetTransitItems(value: unknown): boolean {
    return (
      value === undefined ||
      (Array.isArray(value) &&
        value.every(
          (item) =>
            this.isRecord(item) &&
            typeof item['phen'] === 'string' &&
            typeof item['time'] === 'string',
        ))
    );
  }

  private isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === 'string';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}
