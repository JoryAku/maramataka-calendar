import {
  AstronomyProvider,
  AstronomyProviderError,
  findAstronomyProviderError,
  formatIsoDateInTimezone,
  Location,
  MoonDetails,
  FullMoon,
  MoonRise,
  NewMoon,
  parseLocalDateTimeInTimezone,
  StarMarker,
} from '@maramataka-calendar/astronomy';
import {
  CurrentMaramatakaNight,
  MaramatakaCycleAnchor,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaStarMonth,
  MaramatakaYear,
  MaramatakaYearMonth,
} from './maramataka';
import { Mata, MaramatakaVersion } from './mata';
import {
  MaramatakaRuleSet,
  summarizeRuleSet,
} from './maramataka-rule-set';
import { generateMaramatakaMonth } from './maramataka-month-generator';
import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';
import { calculateWhiroStart } from './whiro-calculator';

type WhiroCalculatorFn = typeof calculateWhiroStart;
type MonthGeneratorFn = typeof generateMaramatakaMonth;

interface CurrentMaramatakaNightContext extends CurrentMaramatakaNight {
  month: MaramatakaMonth;
}

export interface MaramatakaServiceDependencies {
  astronomyProvider: AstronomyProvider;
  calculateWhiroStartFn?: WhiroCalculatorFn;
  generateMaramatakaMonthFn?: MonthGeneratorFn;
  ruleSet?: MaramatakaRuleSet;
  mata?: Mata[];
  version?: MaramatakaVersion;
}

export class MaramatakaService {
  private readonly astronomyProvider: AstronomyProvider;
  private readonly calculateWhiroStartFn: WhiroCalculatorFn;
  private readonly generateMaramatakaMonthFn: MonthGeneratorFn;
  private readonly ruleSet: MaramatakaRuleSet;

  constructor(dependencies: MaramatakaServiceDependencies) {
    this.astronomyProvider = dependencies.astronomyProvider;
    this.calculateWhiroStartFn =
      dependencies.calculateWhiroStartFn ?? calculateWhiroStart;
    this.generateMaramatakaMonthFn =
      dependencies.generateMaramatakaMonthFn ?? generateMaramatakaMonth;
    this.ruleSet =
      dependencies.ruleSet ??
      this.createLegacyRuleSet(dependencies.mata, dependencies.version);
  }

  async getMonth(location: Location, date: Date): Promise<MaramatakaMonth> {
    const requestedYear = date.getUTCFullYear();
    const requestedTime = date.getTime();

    const [
      previousYearNewMoons,
      requestedYearNewMoons,
      nextYearNewMoons,
      previousYearFullMoons,
      requestedYearFullMoons,
      nextYearFullMoons,
    ] =
      await Promise.all([
        this.astronomyProvider.getNewMoons(requestedYear - 1),
        this.astronomyProvider.getNewMoons(requestedYear),
        this.astronomyProvider.getNewMoons(requestedYear + 1),
        this.astronomyProvider.getFullMoons(requestedYear - 1),
        this.astronomyProvider.getFullMoons(requestedYear),
        this.astronomyProvider.getFullMoons(requestedYear + 1),
      ]);
    const newMoons = [
      ...this.asArray(previousYearNewMoons),
      ...this.asArray(requestedYearNewMoons),
      ...this.asArray(nextYearNewMoons),
    ];
    const fullMoons = [
      ...this.asArray(previousYearFullMoons),
      ...this.asArray(requestedYearFullMoons),
      ...this.asArray(nextYearFullMoons),
    ];

    const relevantNewMoon = this.findRelevantNewMoon(
      newMoons,
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
      this.findMonthEndMoonRiseIndex(
        moonRises,
        whiroStartIndex,
        newMoons,
        relevantNewMoon,
        location,
      ) + 1,
    );
    const nextNewMoon = this.findNextNewMoon(
      newMoons,
      relevantNewMoon.occursAt.getTime(),
    );
    const fullMoon = this.findRelevantFullMoon(
      fullMoons,
      relevantNewMoon,
      nextNewMoon,
    );
    const balancedMata = this.balanceMataForFullMoon(
      this.ruleSet.mata,
      monthMoonRises,
      fullMoon,
    );

    try {
      return {
        ...this.generateMaramatakaMonthFn({
          version: this.version,
          ruleSet: summarizeRuleSet(this.ruleSet),
          whiroStartsAt,
          mata: balancedMata,
          moonRises: monthMoonRises,
        }),
        starMonthSequence: this.calculateStarMonthSequence(
          newMoons,
          relevantNewMoon,
          location,
        ),
      };
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

  async getYear(location: Location, date: Date): Promise<MaramatakaYear> {
    const localYear = Number(
      this.formatIsoDateForLocation(date, location).slice(0, 4),
    );
    const [previousYearNewMoons, yearNewMoons, nextYearNewMoons] =
      await Promise.all([
        this.astronomyProvider.getNewMoons(localYear - 1),
        this.astronomyProvider.getNewMoons(localYear),
        this.astronomyProvider.getNewMoons(localYear + 1),
      ]);
    const newMoons = [
      ...this.asArray(previousYearNewMoons),
      ...this.asArray(yearNewMoons),
      ...this.asArray(nextYearNewMoons),
    ].sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
    const months = (
      await Promise.all(
        newMoons
          .filter(
            (newMoon) =>
              this.formatIsoDateForLocation(newMoon.occursAt, location).slice(
                0,
                4,
              ) === String(localYear),
          )
          .map((newMoon, index) =>
            this.createYearMonth(newMoon, location, index + 1),
          ),
      )
    ).filter(
      (month): month is MaramatakaYearMonth => Boolean(month),
    );

    return {
      version: this.version,
      ruleSet: summarizeRuleSet(this.ruleSet),
      year: localYear,
      timezone: location.timezone,
      startsAt: this.localYearBoundary(localYear, location, 0),
      endsAt: this.localYearBoundary(localYear + 1, location, 0),
      months,
    };
  }

  async getStarMarkers(location: Location, date: Date): Promise<StarMarker[]> {
    const localDate = this.formatIsoDateForLocation(date, location);

    return (
      this.astronomyProvider.getStarMarkers?.(
        localDate,
        location,
        this.ruleSet.starMonthNaming?.markers,
      ) ?? []
    );
  }

  async getCurrentNight(
    location: Location,
    date: Date,
  ): Promise<CurrentMaramatakaNight | undefined> {
    const context = await this.getCurrentNightContext(location, date);

    return context
      ? {
          version: context.version,
          ruleSet: context.ruleSet,
          night: context.night,
        }
      : undefined;
  }

  async getCycleDetails(
    location: Location,
    date: Date,
  ): Promise<MaramatakaCycleDetails | undefined> {
    const currentNight = await this.getCurrentNightContext(location, date);
    if (!currentNight) {
      return undefined;
    }

    const { month } = currentNight;
    const currentMataIndex =
      month.nights.findIndex(
        (night) =>
          night.startsAt.getTime() === currentNight.night.startsAt.getTime() &&
          night.endsAt.getTime() === currentNight.night.endsAt.getTime(),
      ) + 1;
    if (currentMataIndex === 0) {
      return undefined;
    }

    const fullMoon = await this.findFullMoonForCycle(month, date);
    const fullMoonNight = fullMoon
      ? this.findNightForDate(month.nights, fullMoon.occursAt)
      : undefined;
    const nextWhiroStartsAt = month.nights[month.nights.length - 1]?.endsAt;
    if (!nextWhiroStartsAt) {
      return undefined;
    }
    const starMarkers = await this.getStarMarkers(location, month.whiroStartsAt);
    const starMonth = this.selectStarMonth(
      starMarkers,
      month.starMonthSequence,
    );

    return {
      version: month.version,
      ruleSet: month.ruleSet,
      timezone: location.timezone,
      currentMataIndex,
      currentNight: currentNight.night,
      anchors: {
        whiro: this.createCycleAnchor({
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: month.whiroStartsAt,
          location,
          source: 'astronomy-engine moonrise',
          mata: month.nights[0]?.mata,
        }),
        ...(fullMoon
          ? {
              fullMoon: this.createCycleAnchor({
                type: 'full-moon',
                label: 'Rakaunui / Full Moon',
                occursAt: fullMoon.occursAt,
                location,
                source: fullMoon.source,
                mata: fullMoonNight?.mata,
              }),
            }
          : {}),
        nextWhiro: this.createCycleAnchor({
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: nextWhiroStartsAt,
          location,
          source: 'astronomy-engine moonrise',
          mata: this.ruleSet.mata[0],
        }),
      },
      nights: month.nights,
      starMonth,
      starMarkers: this.selectRelevantStarMarkers(starMarkers, starMonth),
    };
  }

  private selectRelevantStarMarkers(
    starMarkers: StarMarker[],
    starMonth: MaramatakaStarMonth | undefined,
  ): StarMarker[] {
    const markerIds = starMonth?.note?.markerIds;
    if (markerIds) {
      // Once a named marama is selected, show the current details for its
      // mentioned markers. Do not hide them merely because they are below the
      // horizon or away from the eastern dawn sky at the sample time.
      return starMarkers.filter((marker) => markerIds.includes(marker.id));
    }

    if (starMonth?.marker) {
      return [starMonth.marker];
    }

    return starMarkers.filter((marker) => marker.visibility !== 'below-horizon');
  }

  private selectStarMonth(
    starMarkers: StarMarker[],
    starMonthSequence: number | undefined,
  ): MaramatakaStarMonth | undefined {
    const starMonthNaming = this.ruleSet.starMonthNaming;
    if (!starMonthNaming) {
      return undefined;
    }

    const visibleEasternMarkers = starMarkers.filter(
      (candidate) =>
        candidate.visibility !== 'below-horizon' &&
        ['NE', 'E', 'SE'].includes(candidate.direction),
    );
    const note = this.findStarMonthNote(starMonthSequence);
    // Month naming follows the rule-set sequence from the star-year start.
    // Visible eastern markers are only a fallback when there is no sequence
    // note, not the primary naming rule.
    const marker = note
      ? starMarkers.find((candidate) =>
          note.markerIds.includes(candidate.id),
        )
      : visibleEasternMarkers[0];
    if (!note && !marker) {
      return undefined;
    }

    return {
      name: note?.name ?? marker!.name,
      marker,
      rule: starMonthNaming.strategy,
      source: starMonthNaming.source,
      sourceUrl: starMonthNaming.sourceUrl,
      note,
    };
  }

  private findStarMonthNote(starMonthSequence: number | undefined) {
    const starMonthNaming = this.ruleSet.starMonthNaming;
    if (
      !starMonthNaming ||
      !starMonthNaming.months.length ||
      starMonthSequence === undefined
    ) {
      return undefined;
    }

    const wrappedSequence =
      ((starMonthSequence - 1) % starMonthNaming.months.length) + 1;

    return starMonthNaming.months.find(
      (month) => month.sequence === wrappedSequence,
    );
  }

  private async getCurrentNightContext(
    location: Location,
    date: Date,
  ): Promise<CurrentMaramatakaNightContext | undefined> {
    const month = await this.getMonth(location, date);
    const night = this.findNightForDate(month.nights, date);

    if (night) {
      return {
        version: month.version,
        ruleSet: month.ruleSet,
        month,
        night,
      };
    }

    const firstNight = month.nights[0];
    const lastNight = month.nights[month.nights.length - 1];
    if (!firstNight || !lastNight) {
      return undefined;
    }

    const requestedTime = date.getTime();
    const adjacentDate =
      requestedTime < firstNight.startsAt.getTime()
        ? this.addMilliseconds(date, -24 * 60 * 60 * 1000)
        : requestedTime >= lastNight.endsAt.getTime()
          ? this.addMilliseconds(date, 24 * 60 * 60 * 1000)
          : undefined;

    if (!adjacentDate) {
      return undefined;
    }

    const adjacentMonth = await this.getMonth(location, adjacentDate);
    const adjacentNight = this.findNightForDate(adjacentMonth.nights, date);

    return adjacentNight
      ? {
          version: adjacentMonth.version,
          ruleSet: adjacentMonth.ruleSet,
          month: adjacentMonth,
          night: adjacentNight,
        }
      : undefined;
  }

  private async createYearMonth(
    newMoon: NewMoon,
    location: Location,
    sequence: number,
  ): Promise<MaramatakaYearMonth | undefined> {
    const month = await this.getMonth(location, newMoon.occursAt);
    const nextWhiroStartsAt = month.nights[month.nights.length - 1]?.endsAt;
    if (!nextWhiroStartsAt) {
      return undefined;
    }

    const fullMoon = await this.findFullMoonForCycle(
      month,
      month.whiroStartsAt,
    );
    const fullMoonNight = fullMoon
      ? this.findNightForDate(month.nights, fullMoon.occursAt)
      : undefined;

    const starMarkers = await this.getStarMarkers(location, month.whiroStartsAt);
    const starMonth = this.selectStarMonth(
      starMarkers,
      month.starMonthSequence,
    );

    return {
      sequence,
      name: starMonth?.name ?? `Marama ${sequence}`,
      starMonth,
      starMarkers: this.selectRelevantStarMarkers(starMarkers, starMonth),
      startsAt: month.whiroStartsAt,
      endsAt: nextWhiroStartsAt,
      durationDays: this.roundTo(
        (nextWhiroStartsAt.getTime() - month.whiroStartsAt.getTime()) /
          (24 * 60 * 60 * 1000),
        2,
      ),
      nightsCount: month.nights.length,
      repeatedMata: this.repeatedMataNames(month),
      anchors: {
        whiro: this.createCycleAnchor({
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: month.whiroStartsAt,
          location,
          source: 'astronomy-engine moonrise',
          mata: month.nights[0]?.mata,
        }),
        ...(fullMoon
          ? {
              fullMoon: this.createCycleAnchor({
                type: 'full-moon',
                label: 'Rakaunui / Full Moon',
                occursAt: fullMoon.occursAt,
                location,
                source: fullMoon.source,
                mata: fullMoonNight?.mata,
              }),
            }
          : {}),
        nextWhiro: this.createCycleAnchor({
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: nextWhiroStartsAt,
          location,
          source: 'astronomy-engine moonrise',
          mata: this.ruleSet.mata[0],
        }),
      },
    };
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

  private calculateStarMonthSequence(
    newMoons: NewMoon[],
    relevantNewMoon: NewMoon,
    location: Location,
  ): number | undefined {
    const starMonthNaming = this.ruleSet.starMonthNaming;
    if (!starMonthNaming?.months.length) {
      return undefined;
    }

    const relevantLocalDate = this.formatIsoDateForLocation(
      relevantNewMoon.occursAt,
      location,
    );
    const relevantYear = Number(relevantLocalDate.slice(0, 4));
    const relevantMonth = Number(relevantLocalDate.slice(5, 7));
    const yearStart = this.findStarYearStartNewMoon(
      newMoons,
      relevantMonth >= 6 ? relevantYear : relevantYear - 1,
      location,
    );
    if (!yearStart) {
      return undefined;
    }

    return newMoons.filter(
      (newMoon) =>
        newMoon.occursAt.getTime() >= yearStart.occursAt.getTime() &&
        newMoon.occursAt.getTime() <= relevantNewMoon.occursAt.getTime(),
    ).length;
  }

  private findStarYearStartNewMoon(
    newMoons: NewMoon[],
    year: number,
    location: Location,
  ): NewMoon | undefined {
    const earliestStartDate = `${year}-06-01`;

    return newMoons
      .filter(
        (newMoon) =>
          this.formatIsoDateForLocation(newMoon.occursAt, location) >=
          earliestStartDate,
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private async fetchMoonRisesForMonth(
    startDate: string,
    location: Location,
  ): Promise<MoonRise[]> {
    const datesToFetch = Array.from(
      { length: this.ruleSet.mata.length + 3 },
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

  private async findFullMoonForCycle(
    month: MaramatakaMonth,
    date: Date,
  ): Promise<FullMoon | undefined> {
    const requestedYear = date.getUTCFullYear();
    const [previousYearFullMoons, requestedYearFullMoons, nextYearFullMoons] =
      await Promise.all([
        this.astronomyProvider.getFullMoons(requestedYear - 1),
        this.astronomyProvider.getFullMoons(requestedYear),
        this.astronomyProvider.getFullMoons(requestedYear + 1),
      ]);
    const cycleStartsAt = month.whiroStartsAt.getTime();
    const cycleEndsAt = month.nights[month.nights.length - 1]?.endsAt.getTime();

    if (!cycleEndsAt) {
      return undefined;
    }

    return [
      ...this.asArray(previousYearFullMoons),
      ...this.asArray(requestedYearFullMoons),
      ...this.asArray(nextYearFullMoons),
    ]
      .filter(
        (fullMoon) =>
          fullMoon.occursAt.getTime() >= cycleStartsAt &&
          fullMoon.occursAt.getTime() < cycleEndsAt,
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private createCycleAnchor(input: {
    type: MaramatakaCycleAnchor['type'];
    label: string;
    occursAt: Date;
    location: Location;
    source: string;
    mata?: Mata;
  }): MaramatakaCycleAnchor {
    return {
      type: input.type,
      label: input.label,
      occursAt: input.occursAt,
      ...this.formatLocalDateTime(input.occursAt, input.location),
      timezone: input.location.timezone,
      source: input.source,
      ...(input.mata ? { mata: input.mata } : {}),
    };
  }

  private formatLocalDateTime(
    date: Date,
    location: Location,
  ): { localDate: string; localTime: string } {
    const parts = new Intl.DateTimeFormat('en-NZ', {
      timeZone: location.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const valueFor = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === type)?.value ?? '00';
    const hour = valueFor('hour');

    return {
      localDate: `${valueFor('year')}-${valueFor('month')}-${valueFor('day')}`,
      localTime: `${hour === '24' ? '00' : hour}:${valueFor('minute')}:${valueFor('second')}`,
    };
  }

  private findNightForDate(
    nights: MaramatakaNight[],
    date: Date,
  ): MaramatakaNight | undefined {
    const requestedTime = date.getTime();

    return nights.find(
      (night) =>
        night.startsAt.getTime() <= requestedTime &&
        requestedTime < night.endsAt.getTime(),
    );
  }

  private addMilliseconds(date: Date, milliseconds: number): Date {
    return new Date(date.getTime() + milliseconds);
  }

  private localYearBoundary(
    year: number,
    location: Location,
    monthIndex: number,
  ): Date {
    return parseLocalDateTimeInTimezone(
      {
        year,
        month: monthIndex + 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0,
      },
      location.timezone,
    );
  }

  private repeatedMataNames(month: MaramatakaMonth): string[] {
    const counts = new Map<string, number>();
    for (const night of month.nights) {
      counts.set(night.mata.name, (counts.get(night.mata.name) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([name, count]) => `${name} x${count}`);
  }

  private roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;

    return Math.round(value * factor) / factor;
  }

  private findMonthEndMoonRiseIndex(
    moonRises: MoonRise[],
    whiroStartIndex: number,
    newMoons: NewMoon[],
    relevantNewMoon: NewMoon,
    location: Location,
  ): number {
    const nextNewMoon = this.findNextNewMoon(
      newMoons,
      relevantNewMoon.occursAt.getTime(),
    );

    if (!nextNewMoon) {
      return whiroStartIndex + this.ruleSet.mata.length;
    }

    const nextWhiroDate = this.formatIsoDateForLocation(
      nextNewMoon.occursAt,
      location,
    );
    const nextWhiroIndex = moonRises.findIndex(
      (moonRise) =>
        moonRise.date === nextWhiroDate ||
        moonRise.risesAt.getTime() > nextNewMoon.occursAt.getTime(),
    );

    if (nextWhiroIndex > whiroStartIndex) {
      return nextWhiroIndex;
    }

    return whiroStartIndex + this.ruleSet.mata.length;
  }

  private findRelevantFullMoon(
    fullMoons: FullMoon[],
    relevantNewMoon: NewMoon,
    nextNewMoon: NewMoon | undefined,
  ): FullMoon | undefined {
    return fullMoons
      .filter(
        (fullMoon) =>
          fullMoon.occursAt.getTime() > relevantNewMoon.occursAt.getTime() &&
          (!nextNewMoon ||
            fullMoon.occursAt.getTime() < nextNewMoon.occursAt.getTime()),
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private balanceMataForFullMoon(
    mata: Mata[],
    moonRises: MoonRise[],
    fullMoon: FullMoon | undefined,
  ): Mata[] {
    const intervalCount = moonRises.length - 1;
    const ohuaIndex = mata.findIndex((entry) => entry.name === 'Ohua');
    if (!fullMoon || ohuaIndex === -1) {
      return mata.slice(0, intervalCount);
    }

    const fullMoonIntervalIndex = moonRises.findIndex((moonRise, index) => {
      const nextMoonRise = moonRises[index + 1];
      return (
        Boolean(nextMoonRise) &&
        fullMoon.occursAt.getTime() >= moonRise.risesAt.getTime() &&
        fullMoon.occursAt.getTime() < nextMoonRise.risesAt.getTime()
      );
    });

    if (
      fullMoonIntervalIndex <= ohuaIndex ||
      fullMoonIntervalIndex > ohuaIndex + 2
    ) {
      return mata.slice(0, intervalCount);
    }

    const duplicatedOhua = Array.from(
      { length: fullMoonIntervalIndex - ohuaIndex + 1 },
      () => mata[ohuaIndex],
    );

    return [
      ...mata.slice(0, ohuaIndex),
      ...duplicatedOhua,
      ...mata.slice(ohuaIndex + 1),
    ].slice(0, intervalCount);
  }

  private asArray<T>(value: T[] | undefined): T[] {
    return value ?? [];
  }

  private get version(): MaramatakaVersion {
    return this.ruleSet.mataVersion;
  }

  private createLegacyRuleSet(
    mata = MITA_TE_TAI_BEST_MATA,
    version: MaramatakaVersion = 'mita-te-tai-best',
  ): MaramatakaRuleSet {
    if (mata === MITA_TE_TAI_BEST_MATA && version === 'mita-te-tai-best') {
      return MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET;
    }

    return {
      ...MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
      id: 'mita-te-tai-best-observational-v1',
      name: `${MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.name} (custom mata)`,
      mata,
      mataVersion: version,
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
