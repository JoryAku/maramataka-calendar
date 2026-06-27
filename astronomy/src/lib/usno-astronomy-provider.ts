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
  Sunset,
} from './astronomy-provider';

type FetchFn = typeof fetch;

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
  constructor(private readonly fetchFn: FetchFn = fetch) {}

  async getMoonPhases(year: number): Promise<MoonPhase[]> {
    const response = await this.fetchFn(
      `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`,
    );
    if (!response.ok) {
      throw new Error(`USNO moon phases request failed: ${response.status}`);
    }
    const data = (await response.json()) as UsnoMoonPhaseData;

    return (data.phasedata ?? []).map((phase) => this.parseMoonPhase(phase));
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

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const data = await this.getRiseSetTransitData(date, location, 'sunset');
    const sunset = data.properties?.data?.sundata?.find(
      (item) => item.phen === 'Set',
    );

    if (!sunset) {
      throw new Error('No sunset data found');
    }

    const occursAt = this.parseLocalUsnoTime(
      date,
      sunset.time,
      location,
      'sunset',
    );

    return {
      date,
      occursAt,
      source: 'usno',
    };
  }

  async getMoonRise(date: string, location: Location): Promise<MoonRise> {
    const data = await this.getRiseSetTransitData(date, location, 'moonrise');
    const moonrise = data.properties?.data?.moondata?.find(
      (item) => item.phen === 'Rise',
    );

    if (!moonrise) {
      throw new Error(`No moonrise data found for ${date}`);
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
      throw new Error(`No moon transit data found for ${date}`);
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
      throw new Error(`No moon phase data found for ${date}`);
    }

    const moonrise = details.moondata?.find((item) => item.phen === 'Rise');
    const moonset = details.moondata?.find((item) => item.phen === 'Set');
    const transit = details.moondata?.find(
      (item) => item.phen === 'Upper Transit',
    );

    return {
      date,
      phase: this.parseMoonPhaseName(details.curphase),
      fractionIlluminated: this.parseFractionIlluminated(
        details.fracillum,
        date,
      ),
      closestPhase: details.closestphase
        ? this.parseMoonPhase(details.closestphase, location.timezoneOffset)
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
      throw new Error(`No moonrise data found for ${date}`);
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
      throw new Error(`No moonset found after moonrise on ${date}`);
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
    const response = await this.fetchFn(
      `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${location.latitude},${location.longitude}&tz=${location.timezoneOffset}`,
    );

    if (!response.ok) {
      throw new Error(`USNO ${label} request failed: ${response.status}`);
    }

    return response.json();
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
      throw new Error(
        `Invalid USNO ${label} date/time: ${date} ${String(time)}`,
      );
    }

    const occursAtUtcMs = Date.UTC(
      year,
      month - 1,
      day,
      hour - location.timezoneOffset,
      minute,
    );

    return new Date(occursAtUtcMs);
  }

  private parseMoonPhase(phase: UsnoMoonPhase, timezoneOffset = 0): MoonPhase {
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
      throw new Error(
        `Invalid USNO moon phase date/time: ${JSON.stringify(phase)}`,
      );
    }

    return {
      phase: this.parseMoonPhaseName(phase.phase),
      occursAt: new Date(
        Date.UTC(
          moonYear,
          moonMonth - 1,
          moonDay,
          moonHour - timezoneOffset,
          moonMinute,
        ),
      ),
      source: 'usno',
    };
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
      throw new Error(`Unknown USNO moon phase: ${phase}`);
    }

    return phase as MoonPhaseName;
  }

  private parseFractionIlluminated(
    value: string | undefined,
    date: string,
  ): number {
    const match = value?.match(/^(\d+(?:\.\d+)?)%$/);
    if (!match) {
      throw new Error(
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
}
