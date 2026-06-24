import { AstronomyProvider, Location, NewMoon } from '@maramataka-calendar/astronomy';
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
    this.calculateWhiroStartFn = dependencies.calculateWhiroStartFn ?? calculateWhiroStart;
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
      requestedTime
    );

    if (!relevantNewMoon) {
      throw new Error('No New Moon found for requested period');
    }

    const sunsets = await this.fetchSunsetsForMonth(relevantNewMoon.occursAt, location);

    let whiroStartsAt: Date;
    try {
      whiroStartsAt = this.calculateWhiroStartFn({
        newMoonAt: relevantNewMoon.occursAt,
        sunsets,
      });
    } catch (error) {
      throw new Error(`Failed to calculate Whiro start: ${this.getErrorMessage(error)}`);
    }

    const whiroStartIndex = sunsets.findIndex(
      (sunset) => sunset.getTime() === whiroStartsAt.getTime()
    );

    if (whiroStartIndex === -1) {
      throw new Error('Calculated Whiro start does not match retrieved sunsets');
    }

    const monthSunsets = sunsets.slice(
      whiroStartIndex,
      whiroStartIndex + this.mata.length + 1
    );

    try {
      return this.generateMaramatakaMonthFn({
        version: this.version,
        whiroStartsAt,
        mata: this.mata,
        sunsets: monthSunsets,
      });
    } catch (error) {
      throw new Error(`Failed to generate Maramataka month: ${this.getErrorMessage(error)}`);
    }
  }

  private findRelevantNewMoon(newMoons: NewMoon[], requestedTime: number): NewMoon | undefined {
    return newMoons
      .filter((newMoon) => newMoon.occursAt.getTime() <= requestedTime)
      .sort((a, b) => b.occursAt.getTime() - a.occursAt.getTime())[0];
  }

  private async fetchSunsetsForMonth(startAt: Date, location: Location): Promise<Date[]> {
    const sunsetDaysToFetch = this.mata.length + 2;
    const datesToFetch = Array.from({ length: sunsetDaysToFetch }, (_, offset) =>
      this.formatIsoDateUtc(this.addUtcDays(startAt, offset))
    );

    try {
      const sunsets = await Promise.all(
        datesToFetch.map(async (date) => {
          const sunset = await this.astronomyProvider.getSunset(date, location);
          return sunset.occursAt;
        })
      );

      return sunsets.sort((a, b) => a.getTime() - b.getTime());
    } catch (error) {
      throw new Error(`Failed to retrieve sunset data: ${this.getErrorMessage(error)}`);
    }
  }

  private addUtcDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private formatIsoDateUtc(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}