import {
  AstronomyProvider,
  Location,
  MoonRiseSet,
  NewMoon,
} from '@maramataka-calendar/astronomy';
import { MaramatakaMonth } from './maramataka';
import { Mata, MaramatakaVersion } from './mata';
import { generateMaramatakaMonth } from './maramataka-month-generator';
import { MITA_TE_TAI_BEST_MATA } from './mita-te-tai-best';
import { calculateWhiroStart } from './whiro-calculator';

type WhiroCalculatorFn = typeof calculateWhiroStart;
type MonthGeneratorFn = typeof generateMaramatakaMonth;

export interface MaramatakaServiceDependencies {
  astronomyProvider: AstronomyProvider;
  calculateWhiroStartFn?: WhiroCalculatorFn;
  generateMaramatakaMonthFn?: MonthGeneratorFn;
  mata?: Mata[];
  version?: MaramatakaVersion;
}

export class MaramatakaService {
  private readonly astronomyProvider: AstronomyProvider;
  private readonly calculateWhiroStartFn: WhiroCalculatorFn;
  private readonly generateMaramatakaMonthFn: MonthGeneratorFn;
  private readonly mata: Mata[];
  private readonly version: MaramatakaVersion;

  constructor(dependencies: MaramatakaServiceDependencies) {
    this.astronomyProvider = dependencies.astronomyProvider;
    this.calculateWhiroStartFn =
      dependencies.calculateWhiroStartFn ?? calculateWhiroStart;
    this.generateMaramatakaMonthFn =
      dependencies.generateMaramatakaMonthFn ?? generateMaramatakaMonth;
    this.mata = dependencies.mata ?? MITA_TE_TAI_BEST_MATA;
    this.version = dependencies.version ?? 'mita-te-tai-best';
  }

  async getMonth(location: Location, date: Date): Promise<MaramatakaMonth> {
    const requestedYear = date.getUTCFullYear();
    const requestedTime = date.getTime();

    const [previousYearNewMoons, requestedYearNewMoons] = await Promise.all([
      this.astronomyProvider.getNewMoons(requestedYear - 1),
      this.astronomyProvider.getNewMoons(requestedYear),
    ]);

    const relevantNewMoon = this.findRelevantNewMoon(
      [...previousYearNewMoons, ...requestedYearNewMoons],
      requestedTime,
    );

    if (!relevantNewMoon) {
      throw new Error('No New Moon found for requested period');
    }

    const whiroDate = this.formatIsoDateForLocation(
      relevantNewMoon.occursAt,
      location.timezoneOffset,
    );
    const moonRiseSets = await this.fetchMoonRiseSetsForMonth(
      whiroDate,
      location,
    );

    let whiroStartsAt: Date;
    try {
      whiroStartsAt = this.calculateWhiroStartFn({
        newMoonAt: relevantNewMoon.occursAt,
        newMoonLocalDate: whiroDate,
        moonRiseSets,
      });
    } catch (error) {
      throw new Error(
        `Failed to calculate Whiro start: ${this.getErrorMessage(error)}`,
      );
    }

    const whiroStartIndex = moonRiseSets.findIndex(
      (moonRiseSet) =>
        moonRiseSet.risesAt.getTime() === whiroStartsAt.getTime(),
    );

    if (whiroStartIndex === -1) {
      throw new Error(
        'Calculated Whiro start does not match retrieved moonrise intervals',
      );
    }

    const monthMoonRiseSets = moonRiseSets.slice(
      whiroStartIndex,
      whiroStartIndex + this.mata.length,
    );

    try {
      return this.generateMaramatakaMonthFn({
        version: this.version,
        whiroStartsAt,
        mata: this.mata,
        moonRiseSets: monthMoonRiseSets,
      });
    } catch (error) {
      throw new Error(
        `Failed to generate Maramataka month: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private findRelevantNewMoon(
    newMoons: NewMoon[],
    requestedTime: number,
  ): NewMoon | undefined {
    return newMoons
      .filter((newMoon) => newMoon.occursAt.getTime() <= requestedTime)
      .sort((a, b) => b.occursAt.getTime() - a.occursAt.getTime())[0];
  }

  private async fetchMoonRiseSetsForMonth(
    startDate: string,
    location: Location,
  ): Promise<MoonRiseSet[]> {
    const datesToFetch = Array.from({ length: this.mata.length }, (_, offset) =>
      this.addIsoDateDays(startDate, offset),
    );

    try {
      const moonRiseSets = await Promise.all(
        datesToFetch.map(async (date) => {
          return this.astronomyProvider.getMoonRiseSet(date, location);
        }),
      );

      return moonRiseSets.sort(
        (a, b) => a.risesAt.getTime() - b.risesAt.getTime(),
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve moonrise/moonset data: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private addIsoDateDays(date: string, days: number): string {
    const [yearPart, monthPart, dayPart] = date.split('-');
    const result = new Date(
      Date.UTC(Number(yearPart), Number(monthPart) - 1, Number(dayPart) + days),
    );

    return [
      result.getUTCFullYear(),
      String(result.getUTCMonth() + 1).padStart(2, '0'),
      String(result.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  private formatIsoDateForLocation(date: Date, timezoneOffset: number): string {
    const localizedDate = new Date(
      date.getTime() + timezoneOffset * 60 * 60 * 1000,
    );
    const year = localizedDate.getUTCFullYear();
    const month = String(localizedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localizedDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
