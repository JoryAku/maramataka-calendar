import {
  AstronomyProvider,
  AstronomyProviderError,
  findAstronomyProviderError,
  formatIsoDateInTimezone,
  Location,
  MoonDetails,
  MoonRise,
  NewMoon,
} from '@maramataka-calendar/astronomy';
import { MaramatakaMonth, MaramatakaNightOverlap } from './maramataka';
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

    const [previousYearNewMoons, requestedYearNewMoons, nextYearNewMoons] =
      await Promise.all([
        this.astronomyProvider.getNewMoons(requestedYear - 1),
        this.astronomyProvider.getNewMoons(requestedYear),
        this.astronomyProvider.getNewMoons(requestedYear + 1),
      ]);

    const relevantNewMoon = this.findRelevantNewMoon(
      [...previousYearNewMoons, ...requestedYearNewMoons, ...nextYearNewMoons],
      requestedTime,
    );

    if (!relevantNewMoon) {
      throw new Error('No New Moon found for requested period');
    }

    const whiroDate = this.formatIsoDateForLocation(
      relevantNewMoon.occursAt,
      location,
    );
    const moonRises = await this.fetchMoonRisesForMonth(whiroDate, location);

    let whiroStartsAt: Date;
    try {
      whiroStartsAt = this.calculateWhiroStartFn({
        newMoonAt: relevantNewMoon.occursAt,
        newMoonLocalDate: whiroDate,
        moonRises,
      });
    } catch (error) {
      throw new Error(
        `Failed to calculate Whiro start: ${this.getErrorMessage(error)}`,
      );
    }

    const whiroStartIndex = moonRises.findIndex(
      (moonRise) => moonRise.risesAt.getTime() === whiroStartsAt.getTime(),
    );

    if (whiroStartIndex === -1) {
      throw new Error(
        'Calculated Whiro start does not match retrieved moonrise intervals',
      );
    }

    const monthMoonRises = moonRises.slice(
      whiroStartIndex,
      whiroStartIndex + this.mata.length + 1,
    );
    const nextNewMoon = this.findNextNewMoon(
      [...previousYearNewMoons, ...requestedYearNewMoons, ...nextYearNewMoons],
      relevantNewMoon.occursAt.getTime(),
    );
    const overlaps = this.buildNewMoonOverlaps(
      nextNewMoon,
      monthMoonRises,
      location,
    );

    try {
      return this.generateMaramatakaMonthFn({
        version: this.version,
        whiroStartsAt,
        mata: this.mata,
        moonRises: monthMoonRises,
        overlaps,
      });
    } catch (error) {
      throw new Error(
        `Failed to generate Maramataka month: ${this.getErrorMessage(error)}`,
      );
    }
  }

  async getMoonDetails(location: Location, date: Date): Promise<MoonDetails> {
    const localDate = this.formatIsoDateForLocation(date, location);

    return this.astronomyProvider.getMoonDetails(localDate, location);
  }

  private findRelevantNewMoon(
    newMoons: NewMoon[],
    requestedTime: number,
  ): NewMoon | undefined {
    return newMoons
      .filter((newMoon) => newMoon.occursAt.getTime() <= requestedTime)
      .sort((a, b) => b.occursAt.getTime() - a.occursAt.getTime())[0];
  }

  private findNextNewMoon(
    newMoons: NewMoon[],
    currentNewMoonTime: number,
  ): NewMoon | undefined {
    return newMoons
      .filter((newMoon) => newMoon.occursAt.getTime() > currentNewMoonTime)
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private buildNewMoonOverlaps(
    nextNewMoon: NewMoon | undefined,
    moonRises: MoonRise[],
    location: Location,
  ): { intervalDate: string; overlap: MaramatakaNightOverlap }[] | undefined {
    if (!nextNewMoon) {
      return undefined;
    }

    const nextWhiroDate = this.formatIsoDateForLocation(
      nextNewMoon.occursAt,
      location,
    );
    const nextWhiroMoonRise =
      moonRises.find((moonRise) => moonRise.date === nextWhiroDate) ??
      moonRises
        .filter(
          (moonRise) =>
            moonRise.risesAt.getTime() > nextNewMoon.occursAt.getTime(),
        )
        .sort((a, b) => a.risesAt.getTime() - b.risesAt.getTime())[0];

    if (!nextWhiroMoonRise) {
      return undefined;
    }

    return [
      {
        intervalDate: nextWhiroMoonRise.date,
        overlap: {
          mata: this.mata[0],
          cycleStartsAt: nextWhiroMoonRise.risesAt,
          reason: 'new-moon-anchor',
        },
      },
    ];
  }

  private async fetchMoonRisesForMonth(
    startDate: string,
    location: Location,
  ): Promise<MoonRise[]> {
    const datesToFetch = Array.from(
      { length: this.mata.length + 3 },
      (_, offset) => this.addIsoDateDays(startDate, offset),
    );

    try {
      const moonRises = await Promise.all(
        datesToFetch.map(async (date) => {
          try {
            return await this.astronomyProvider.getMoonRise(date, location);
          } catch (error) {
            if (this.isMissingMoonriseError(error)) {
              return undefined;
            }

            throw error;
          }
        }),
      );

      return moonRises
        .filter((moonRise): moonRise is MoonRise => Boolean(moonRise))
        .sort((a, b) => a.risesAt.getTime() - b.risesAt.getTime());
    } catch (error) {
      const astronomyError = findAstronomyProviderError(error);
      if (astronomyError) {
        throw new AstronomyProviderError(
          astronomyError.provider,
          astronomyError.code,
          `Failed to retrieve moonrise data: ${astronomyError.message}`,
          { cause: astronomyError },
        );
      }

      throw new Error(
        `Failed to retrieve moonrise data: ${this.getErrorMessage(error)}`,
      );
    }
  }

  private isMissingMoonriseError(error: unknown): boolean {
    return this.getErrorMessage(error).startsWith(
      'No moonrise data found for ',
    );
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

  private formatIsoDateForLocation(date: Date, location: Location): string {
    return formatIsoDateInTimezone(date, location.timezone);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
