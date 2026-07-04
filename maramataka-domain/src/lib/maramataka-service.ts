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
  SolarSeasonEvent,
  StarMarker,
  StarMarkerDefinition,
  StarMarkerNightInvisibilityPeriod,
} from '@maramataka-calendar/astronomy';
import {
  CurrentMaramatakaNight,
  MaramatakaCycleAnchor,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaNight,
  MaramatakaStarMonth,
  MaramatakaYear,
  MaramatakaYearDiagnostic,
  MaramatakaYearEvent,
  MaramatakaYearMonth,
} from './maramataka';
import { Mata, MaramatakaVersion } from './mata';
import { MaramatakaRuleSet, summarizeRuleSet } from './maramataka-rule-set';
import { generateMaramatakaMonth } from './maramataka-month-generator';
import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';
import {
  LIVING_BY_THE_STARS_MATA,
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
} from './living-by-the-stars';
import {
  calculateWhiroStart,
  findMoonriseForObservationWindow,
  findWhiroMoonrise,
} from './whiro-calculator';

type WhiroCalculatorFn = typeof calculateWhiroStart;
type MonthGeneratorFn = typeof generateMaramatakaMonth;

interface CurrentMaramatakaNightContext extends CurrentMaramatakaNight {
  month: MaramatakaMonth;
}

interface PhaseFetchResult<T> {
  year: number;
  values: T[];
  error?: string;
}

type MonthScopedStarMarker = StarMarker & {
  monthSequence: number;
  monthName: string;
  scope: 'month';
};

type SeasonalStarMarker = StarMarker & {
  scope: 'seasonal';
  monthSequence?: undefined;
  monthName?: undefined;
};

const ASTRONOMICAL_NIGHT_SUN_ALTITUDE_DEGREES = -18;
const MATARIKI_PUBLIC_HOLIDAY_TARGET_MATA = new Set([
  'Tangaroa-ā-mua',
  'Tangaroa-ā-roto',
  'Tangaroa-whakapau',
  'Tangaroa whāriki kio-kio',
]);
// Calibrated from the Living by the Stars 2021/2022-2023/2024 examples:
// early Matariki return keeps Te Tahi o Pipiri and inserts Ruhanui; later
// return shifts Te Tahi o Pipiri to the next Whiro.
const RUHANUI_EARLY_MATARIKI_AFTER_WHIRO_MAX_DAYS = 11;

interface YearMonthResult {
  month: MaramatakaYearMonth;
  events: MaramatakaYearEvent[];
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
    ] = await Promise.all([
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

    const relevantNewMoon = this.findRelevantNewMoon(newMoons, requestedTime);

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
    const monthMata = this.selectMataForMoonRiseIntervals(
      this.ruleSet.mata,
      monthMoonRises,
    );

    try {
      return {
        ...this.generateMaramatakaMonthFn({
          version: this.version,
          ruleSet: summarizeRuleSet(this.ruleSet),
          whiroStartsAt,
          mata: monthMata,
          moonRises: monthMoonRises,
        }),
        starMonthSequence: await this.calculateStarMonthSequence(
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
    const requestedLocalDate = this.formatIsoDateForLocation(date, location);
    const localYear = Number(requestedLocalDate.slice(0, 4));
    const localMonth = Number(requestedLocalDate.slice(5, 7));
    let starYear = localMonth >= 6 ? localYear : localYear - 1;
    const diagnostics: MaramatakaYearDiagnostic[] = [];
    const newMoonResults = await Promise.all(
      [starYear - 1, starYear, starYear + 1, starYear + 2].map((year) =>
        this.getOptionalNewMoons(year),
      ),
    );
    diagnostics.push(
      ...newMoonResults
        .filter((result) => result.error)
        .map((result) => ({
          type: 'phase-provider' as const,
          name: `${result.year} New Moon anchors`,
          reason: result.error!,
        })),
    );
    const newMoons = newMoonResults
      .flatMap((result) => result.values)
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
    const candidateYearStartsAt = await this.findStarYearStartNewMoon(
      newMoons,
      starYear,
      location,
    );
    if (
      candidateYearStartsAt &&
      date.getTime() < candidateYearStartsAt.occursAt.getTime()
    ) {
      starYear -= 1;
    } else {
      const nextYearStartsAt = await this.findStarYearStartNewMoon(
        newMoons,
        starYear + 1,
        location,
      );
      if (
        nextYearStartsAt &&
        date.getTime() >= nextYearStartsAt.occursAt.getTime()
      ) {
        starYear += 1;
      }
    }
    const fullMoonResults = await Promise.all(
      [starYear - 1, starYear, starYear + 1, starYear + 2].map((year) =>
        this.getOptionalFullMoons(year),
      ),
    );
    diagnostics.push(
      ...fullMoonResults
        .filter((result) => result.error)
        .map((result) => ({
          type: 'phase-provider' as const,
          name: `${result.year} Full Moon anchors`,
          reason: result.error!,
        })),
    );
    const fullMoons = fullMoonResults
      .flatMap((result) => result.values)
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
    const yearStartsAt =
      (await this.findStarYearStartNewMoon(newMoons, starYear, location)) ??
      newMoons.find(
        (newMoon) =>
          this.formatIsoDateForLocation(newMoon.occursAt, location) >=
          `${starYear}-06-01`,
      );
    const yearEndsAt =
      (await this.findStarYearStartNewMoon(newMoons, starYear + 1, location)) ??
      (yearStartsAt
        ? newMoons.find(
            (newMoon) =>
              newMoon.occursAt.getTime() > yearStartsAt.occursAt.getTime() &&
              this.formatIsoDateForLocation(newMoon.occursAt, location) >=
                `${starYear + 1}-06-01`,
          )
        : undefined);
    const yearNewMoonAnchors =
      yearStartsAt && yearEndsAt
        ? newMoons.filter(
            (newMoon) =>
              newMoon.occursAt.getTime() >= yearStartsAt.occursAt.getTime() &&
              newMoon.occursAt.getTime() < yearEndsAt.occursAt.getTime(),
          )
        : [];
    const months: MaramatakaYearMonth[] = [];
    const yearSpecificEvents: MaramatakaYearEvent[] = [];
    for (const [index, newMoon] of yearNewMoonAnchors.entries()) {
      const monthResult = await this.createYearMonthSafe({
        newMoon,
        nextNewMoon: this.findNextNewMoon(newMoons, newMoon.occursAt.getTime()),
        fullMoons,
        location,
        sequence: index + 1,
        allNewMoons: newMoons,
      });

      if (monthResult) {
        const { month } = monthResult;
        months.push(month);
        yearSpecificEvents.push(...monthResult.events);
        if (month.isEstimated && month.unavailableReason) {
          diagnostics.push({
            type: 'estimated-month',
            sequence: month.sequence,
            name: month.name,
            anchorDate:
              month.anchors.whiro.astronomicalOccursAt ??
              month.anchors.whiro.occursAt,
            reason: month.unavailableReason,
          });
        }
      } else {
        diagnostics.push({
          type: 'skipped-month',
          sequence: index + 1,
          name: `Marama ${index + 1}`,
          anchorDate: newMoon.occursAt,
          reason:
            'No following New Moon anchor was available to close this marama.',
        });
      }
    }
    const timelineStartsAt =
      months[0]?.startsAt ??
      yearStartsAt?.occursAt ??
      this.localYearBoundary(starYear, location, 5);
    const timelineEndsAt =
      yearEndsAt?.occursAt ??
      months[months.length - 1]?.anchors.nextWhiro.occursAt ??
      this.localYearBoundary(starYear + 1, location, 5);
    const monthScopedStarFirstAppearances =
      months.length > 0
        ? await this.getMonthScopedStarFirstAppearances(location, months)
        : [];
    const seasonalStarFirstAppearances =
      months.length > 0
        ? await this.getSeasonalStarFirstAppearances(
            location,
            this.formatIsoDateForLocation(timelineStartsAt, location),
            this.formatIsoDateForLocation(timelineEndsAt, location),
            monthScopedStarFirstAppearances,
          )
        : [];
    const starFirstAppearances = [
      ...monthScopedStarFirstAppearances,
      ...seasonalStarFirstAppearances,
    ];
    const starInvisibilityEvents =
      months.length > 0
        ? await this.createStarInvisibilityEvents(
            location,
            this.formatIsoDateForLocation(timelineStartsAt, location),
            this.formatIsoDateForLocation(timelineEndsAt, location),
          )
        : [];
    const solarSeasonEvents = await this.createSolarSeasonEvents(
      starYear,
      timelineStartsAt,
      timelineEndsAt,
    );

    return {
      version: this.version,
      ruleSet: summarizeRuleSet(this.ruleSet),
      year: starYear,
      timezone: location.timezone,
      startsAt: timelineStartsAt,
      endsAt: timelineEndsAt,
      months,
      events: this.createYearEvents(
        months,
        yearStartsAt,
        yearEndsAt,
        starFirstAppearances,
        [
          ...yearSpecificEvents,
          ...starInvisibilityEvents,
          ...solarSeasonEvents,
        ],
      ),
      diagnostics,
    };
  }

  async getStarMarkers(location: Location, date: Date): Promise<StarMarker[]> {
    const localDate = this.formatIsoDateForLocation(date, location);

    return (
      this.astronomyProvider.getStarMarkers?.(
        localDate,
        location,
        this.getRuleSetMarkerDefinitions(),
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
      ? this.findPhaseNight(month.nights, fullMoon.occursAt)
      : undefined;
    const fullMoonAnchorAt = fullMoonNight?.startsAt ?? fullMoon?.occursAt;
    const nextWhiroStartsAt = month.nights[month.nights.length - 1]?.endsAt;
    if (!nextWhiroStartsAt) {
      return undefined;
    }
    const starMarkers = await this.getOptionalStarMarkers(
      location,
      month.whiroStartsAt,
    );
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
                label: 'Rākaunui / Full Moon',
                occursAt: fullMoonAnchorAt!,
                location,
                source: `${fullMoon.source} observation moonrise`,
                mata: fullMoonNight?.mata,
                astronomicalOccursAt: fullMoon.occursAt,
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

    return starMarkers.filter(
      (marker) => marker.visibility !== 'below-horizon',
    );
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
      ? starMarkers.find((candidate) => note.markerIds.includes(candidate.id))
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

    if (starMonthSequence <= 0) {
      return starMonthNaming.months.find(
        (month) => month.sequence === starMonthSequence,
      );
    }

    const positiveMonths = starMonthNaming.months.filter(
      (month) => month.sequence > 0,
    );
    if (starMonthSequence > positiveMonths.length) {
      return starMonthNaming.months.find((month) => month.sequence === 0);
    }

    const wrappedSequence =
      ((starMonthSequence - 1) % positiveMonths.length) + 1;

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

  private async createYearMonth(input: {
    newMoon: NewMoon;
    nextNewMoon: NewMoon | undefined;
    fullMoons: FullMoon[];
    location: Location;
    sequence: number;
    allNewMoons: NewMoon[];
  }): Promise<YearMonthResult | undefined> {
    const { newMoon, nextNewMoon, fullMoons, location, sequence, allNewMoons } =
      input;
    let month: MaramatakaMonth;
    try {
      month = await this.getMonth(location, newMoon.occursAt);
    } catch (error) {
      // The year view is an annual rhythm map, not the source of truth for the
      // current mata. If a detailed moonrise-to-moonrise marama cannot be
      // resolved, keep the New Moon / Full Moon / next New Moon anchors visible.
      return this.createEstimatedYearMonth({
        newMoon,
        nextNewMoon,
        fullMoons,
        location,
        sequence,
        allNewMoons,
        unavailableReason: this.getErrorMessage(error),
      });
    }

    const nextWhiroStartsAt = month.nights[month.nights.length - 1]?.endsAt;
    if (!nextWhiroStartsAt) {
      return undefined;
    }

    const fullMoon = nextNewMoon
      ? this.findRelevantFullMoon(fullMoons, newMoon, nextNewMoon)
      : undefined;
    const fullMoonNight = fullMoon
      ? this.findPhaseNight(month.nights, fullMoon.occursAt)
      : undefined;
    const fullMoonAnchorAt = fullMoonNight?.startsAt ?? fullMoon?.occursAt;

    const starMarkers = await this.getOptionalStarMarkers(
      location,
      month.whiroStartsAt,
    );
    const starMonthSequence = await this.calculateStarMonthSequence(
      allNewMoons,
      newMoon,
      location,
    );
    const starMonth = this.selectStarMonth(starMarkers, starMonthSequence);
    const isMatarikiHolidayMonth = await this.isMatarikiPublicHolidayStarMonth(
      allNewMoons,
      newMoon,
      starMonthSequence,
      location,
    );

    const yearMonth: MaramatakaYearMonth = {
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
          astronomicalOccursAt: newMoon.occursAt,
        }),
        ...(fullMoon
          ? {
              fullMoon: this.createCycleAnchor({
                type: 'full-moon',
                label: 'Rākaunui / Full Moon',
                occursAt: fullMoonAnchorAt!,
                location,
                source: `${fullMoon.source} observation moonrise`,
                mata: fullMoonNight?.mata,
                astronomicalOccursAt: fullMoon.occursAt,
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
          astronomicalOccursAt: nextNewMoon?.occursAt,
        }),
      },
    };

    return {
      month: yearMonth,
      events: this.createMatarikiPublicHolidayEvents(
        month,
        yearMonth,
        isMatarikiHolidayMonth,
        location,
      ),
    };
  }

  private createMatarikiPublicHolidayEvents(
    month: MaramatakaMonth,
    yearMonth: MaramatakaYearMonth,
    isMatarikiHolidayMonth: boolean,
    location: Location,
  ): MaramatakaYearEvent[] {
    if (!isMatarikiHolidayMonth) {
      return [];
    }

    const targetNights = month.nights
      .filter((night) => this.isMatarikiPublicHolidayTargetNight(night))
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
    const firstTargetNight = targetNights[0];
    const lastTargetNight = targetNights[targetNights.length - 1];
    if (!firstTargetNight || !lastTargetNight) {
      return [];
    }

    const holidayDate = this.closestFridayInDateRangeToInterval(
      this.formatIsoDateForLocation(yearMonth.startsAt, location),
      this.formatIsoDateForLocation(yearMonth.endsAt, location),
      firstTargetNight.startsAt,
      lastTargetNight.endsAt,
      location,
    );

    return [
      {
        type: 'public-holiday',
        name: 'Matariki public holiday',
        occursAt: this.localDateStart(holidayDate, location),
        monthSequence: yearMonth.sequence,
        monthName: yearMonth.name,
        description:
          'Estimated as the Friday within the selected holiday marama closest to the four-night Tangaroa period from Tangaroa-ā-mua through Tangaroa whāriki kio-kio.',
        source: 'Matariki public holiday maramataka rule',
      },
    ];
  }

  private isMatarikiPublicHolidayTargetNight(night: MaramatakaNight): boolean {
    return MATARIKI_PUBLIC_HOLIDAY_TARGET_MATA.has(night.mata.name);
  }

  private async createStarInvisibilityEvents(
    location: Location,
    startDate: string,
    endDate: string,
  ): Promise<MaramatakaYearEvent[]> {
    const yearStartMarker = this.getYearStartMarkerDefinition();
    if (!yearStartMarker) {
      return [];
    }

    const periods = await this.getOptionalStarNightInvisibilityPeriods(
      location,
      startDate,
      endDate,
      [yearStartMarker],
    );
    const longestPeriod = periods
      .filter((period) => period.markerId === yearStartMarker.id)
      .sort((a, b) => b.days - a.days)[0];
    if (!longestPeriod) {
      return [];
    }

    return [
      {
        type: 'star-invisibility',
        name: `${yearStartMarker.name} disappears`,
        occursAt: this.localDateStart(longestPeriod.startsOn, location),
        description: `${yearStartMarker.name} is not visible during astronomical night until ${longestPeriod.endsOn} (${longestPeriod.days} days).`,
        source: longestPeriod.calculation,
      },
    ];
  }

  private async createSolarSeasonEvents(
    starYear: number,
    timelineStartsAt: Date,
    timelineEndsAt: Date,
  ): Promise<MaramatakaYearEvent[]> {
    const solarSeasons = (
      await Promise.all(
        [starYear, starYear + 1].map((year) =>
          this.getOptionalSolarSeasons(year),
        ),
      )
    )
      .flatMap((result) => result.values)
      .filter(
        (event) =>
          event.occursAt.getTime() >= timelineStartsAt.getTime() &&
          event.occursAt.getTime() < timelineEndsAt.getTime(),
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());

    return solarSeasons.map((event) => ({
      type: 'solar-season',
      name: event.name,
      occursAt: event.occursAt,
      description:
        'Astronomical equinox or solstice anchor from the solar year.',
      source: event.source,
    }));
  }

  private createYearEvents(
    months: MaramatakaYearMonth[],
    yearStartsAt?: NewMoon,
    yearEndsAt?: NewMoon,
    starFirstAppearances: (MonthScopedStarMarker | SeasonalStarMarker)[] = [],
    yearSpecificEvents: MaramatakaYearEvent[] = [],
  ): MaramatakaYearEvent[] {
    const events = months.flatMap((month) => {
      const monthEvents: MaramatakaYearEvent[] = [
        {
          type: 'month-start',
          name: month.name,
          occursAt: month.startsAt,
          monthSequence: month.sequence,
          monthName: month.name,
          description: 'Maramataka month begins at Whiro.',
          source: month.anchors.whiro.source,
        },
      ];

      const newMoonAt =
        month.anchors.whiro.astronomicalOccursAt ??
        month.anchors.whiro.occursAt;
      monthEvents.push({
        type: 'new-moon',
        name: 'New Moon',
        occursAt: newMoonAt,
        monthSequence: month.sequence,
        monthName: month.name,
        description: 'Astronomical New Moon anchor for Whiro.',
        source: month.anchors.whiro.source,
      });

      if (month.anchors.fullMoon) {
        monthEvents.push({
          type: 'full-moon',
          name: 'Full Moon',
          occursAt:
            month.anchors.fullMoon.astronomicalOccursAt ??
            month.anchors.fullMoon.occursAt,
          monthSequence: month.sequence,
          monthName: month.name,
          description: 'Astronomical Full Moon anchor for Rākaunui.',
          source: month.anchors.fullMoon.source,
        });
      }

      return monthEvents;
    });

    for (const marker of starFirstAppearances) {
      events.push({
        type: 'star-marker',
        name: marker.name,
        occursAt: marker.observedAt,
        monthSequence: marker.monthSequence,
        monthName: marker.monthName,
        starMarkerScope: marker.scope,
        description: marker.seasonalAssociation,
        source: marker.source,
      });
    }

    events.push(...yearSpecificEvents);

    const yearStartBoundary = months[0]
      ? {
          occursAt: months[0].startsAt,
          source: months[0].anchors.whiro.source,
        }
      : yearStartsAt;

    if (
      yearStartBoundary &&
      !events.some(
        (event) =>
          event.type === 'month-start' &&
          event.occursAt.getTime() === yearStartBoundary.occursAt.getTime(),
      )
    ) {
      events.push({
        type: 'month-start',
        name: 'Te Tahi o Pipiri',
        occursAt: yearStartBoundary.occursAt,
        monthSequence: 1,
        monthName: 'Te Tahi o Pipiri',
        description: 'The maramataka year begins.',
        source: yearStartBoundary.source,
      });
    }

    if (yearEndsAt) {
      events.push({
        type: 'month-start',
        name: 'Next Te Tahi o Pipiri',
        occursAt: yearEndsAt.occursAt,
        description: 'The next maramataka year begins.',
        source: yearEndsAt.source,
      });
    }

    return events.sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime());
  }

  private async createYearMonthSafe(input: {
    newMoon: NewMoon;
    nextNewMoon: NewMoon | undefined;
    fullMoons: FullMoon[];
    location: Location;
    sequence: number;
    allNewMoons: NewMoon[];
  }): Promise<YearMonthResult | undefined> {
    try {
      return await this.createYearMonth(input);
    } catch (error) {
      return this.createEstimatedYearMonth({
        ...input,
        unavailableReason: this.getErrorMessage(error),
      });
    }
  }

  private async createEstimatedYearMonth(input: {
    newMoon: NewMoon;
    nextNewMoon: NewMoon | undefined;
    fullMoons: FullMoon[];
    location: Location;
    sequence: number;
    allNewMoons: NewMoon[];
    unavailableReason: string;
  }): Promise<YearMonthResult | undefined> {
    const {
      newMoon,
      nextNewMoon,
      fullMoons,
      location,
      sequence,
      allNewMoons,
      unavailableReason,
    } = input;
    if (!nextNewMoon) {
      return undefined;
    }

    const starMonthSequence = await this.calculateStarMonthSequence(
      allNewMoons,
      newMoon,
      location,
    );
    const starMarkers = await this.getOptionalStarMarkers(
      location,
      newMoon.occursAt,
    );
    const starMonth = this.selectStarMonth(starMarkers, starMonthSequence);
    const fullMoon = this.findRelevantFullMoon(fullMoons, newMoon, nextNewMoon);

    return {
      month: {
        sequence,
        name: starMonth?.name ?? `Marama ${sequence}`,
        starMonth,
        starMarkers: this.selectRelevantStarMarkers(starMarkers, starMonth),
        isEstimated: true,
        unavailableReason,
        startsAt: newMoon.occursAt,
        endsAt: nextNewMoon.occursAt,
        durationDays: this.roundTo(
          (nextNewMoon.occursAt.getTime() - newMoon.occursAt.getTime()) /
            (24 * 60 * 60 * 1000),
          2,
        ),
        nightsCount: 0,
        repeatedMata: [],
        anchors: {
          whiro: this.createCycleAnchor({
            type: 'whiro',
            label: 'Whiro / Kohititanga',
            occursAt: newMoon.occursAt,
            location,
            source: newMoon.source,
            mata: this.ruleSet.mata[0],
            astronomicalOccursAt: newMoon.occursAt,
          }),
          ...(fullMoon
            ? {
                fullMoon: this.createCycleAnchor({
                  type: 'full-moon',
                  label: 'Rākaunui / Full Moon',
                  occursAt: fullMoon.occursAt,
                  location,
                  source: fullMoon.source,
                  astronomicalOccursAt: fullMoon.occursAt,
                }),
              }
            : {}),
          nextWhiro: this.createCycleAnchor({
            type: 'next-whiro',
            label: 'Next Whiro / Kohititanga',
            occursAt: nextNewMoon.occursAt,
            location,
            source: nextNewMoon.source,
            mata: this.ruleSet.mata[0],
          }),
        },
      },
      events: [],
    };
  }

  private async getOptionalStarMarkers(
    location: Location,
    date: Date,
    markers?: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    try {
      if (markers) {
        return (
          this.astronomyProvider.getStarMarkers?.(
            this.formatIsoDateForLocation(date, location),
            location,
            markers,
          ) ?? []
        );
      }

      return await this.getStarMarkers(location, date);
    } catch {
      return [];
    }
  }

  private async getMonthScopedStarFirstAppearances(
    location: Location,
    months: MaramatakaYearMonth[],
  ): Promise<MonthScopedStarMarker[]> {
    const markerDefinitions = this.ruleSet.starMonthNaming?.markers ?? [];
    const appearances = await Promise.all(
      months.map(async (month) => {
        const markerIds = month.starMonth?.note?.markerIds ?? [];
        const monthMarkers = markerDefinitions.filter((marker) =>
          markerIds.includes(marker.id),
        );

        if (!monthMarkers.length) {
          return [];
        }

        const markers = await this.getOptionalStarFirstAppearances(
          location,
          this.formatIsoDateForLocation(month.startsAt, location),
          this.formatIsoDateForLocation(month.endsAt, location),
          monthMarkers,
        );

        return markers.map((marker) => ({
          ...marker,
          monthSequence: month.sequence,
          monthName: month.name,
          scope: 'month' as const,
        }));
      }),
    );

    return appearances.flat();
  }

  private async getSeasonalStarFirstAppearances(
    location: Location,
    startDate: string,
    endDate: string,
    monthScopedMarkers: MonthScopedStarMarker[],
  ): Promise<SeasonalStarMarker[]> {
    const alreadyPlacedMarkerIds = new Set(
      monthScopedMarkers.map((marker) => marker.id),
    );
    const seasonalMarkers = (
      this.ruleSet.starMonthNaming?.markers ?? []
    ).filter((marker) => !alreadyPlacedMarkerIds.has(marker.id));

    if (!seasonalMarkers.length) {
      return [];
    }

    const markers = await this.getOptionalStarFirstAppearances(
      location,
      startDate,
      endDate,
      seasonalMarkers,
    );

    return markers.map((marker) => ({
      ...marker,
      scope: 'seasonal' as const,
    }));
  }

  private async getOptionalStarFirstAppearances(
    location: Location,
    startDate: string,
    endDate: string,
    markers: StarMarkerDefinition[],
  ): Promise<StarMarker[]> {
    try {
      return await (this.astronomyProvider.getStarFirstAppearances?.(
        startDate,
        endDate,
        location,
        markers,
      ) ?? []);
    } catch {
      return [];
    }
  }

  private async getOptionalFullMoons(
    year: number,
  ): Promise<PhaseFetchResult<FullMoon>> {
    try {
      return {
        year,
        values: this.asArray(await this.astronomyProvider.getFullMoons(year)),
      };
    } catch (error) {
      return {
        year,
        values: [],
        error: this.getErrorMessage(error),
      };
    }
  }

  private async getOptionalNewMoons(
    year: number,
  ): Promise<PhaseFetchResult<NewMoon>> {
    try {
      return {
        year,
        values: this.asArray(await this.astronomyProvider.getNewMoons(year)),
      };
    } catch (error) {
      return {
        year,
        values: [],
        error: this.getErrorMessage(error),
      };
    }
  }

  private async getOptionalSolarSeasons(
    year: number,
  ): Promise<PhaseFetchResult<SolarSeasonEvent>> {
    try {
      return {
        year,
        values: this.asArray(
          (await this.astronomyProvider.getSolarSeasons?.(year)) ?? [],
        ),
      };
    } catch (error) {
      return {
        year,
        values: [],
        error: this.getErrorMessage(error),
      };
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

  private findNextNewMoon(
    newMoons: NewMoon[],
    currentNewMoonTime: number,
  ): NewMoon | undefined {
    return newMoons
      .filter((newMoon) => newMoon.occursAt.getTime() > currentNewMoonTime)
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private async calculateStarMonthSequence(
    newMoons: NewMoon[],
    relevantNewMoon: NewMoon,
    location: Location,
  ): Promise<number | undefined> {
    const starMonthNaming = this.ruleSet.starMonthNaming;
    if (!starMonthNaming?.months.length) {
      return undefined;
    }

    const relevantLocalDate = this.formatIsoDateForLocation(
      relevantNewMoon.occursAt,
      location,
    );
    const relevantYear = Number(relevantLocalDate.slice(0, 4));
    const starYearBounds = await this.findStarYearBoundsForNewMoon(
      newMoons,
      relevantNewMoon,
      relevantYear,
      location,
    );
    const yearStart = starYearBounds?.start;
    if (!yearStart) {
      return undefined;
    }

    const rawSequence = newMoons.filter(
      (newMoon) =>
        newMoon.occursAt.getTime() >= yearStart.occursAt.getTime() &&
        newMoon.occursAt.getTime() <= relevantNewMoon.occursAt.getTime(),
    ).length;
    const regularMonthCount = this.regularStarMonthCount();
    const ruhanuiStart = await this.findRuhanuiStartNewMoon(
      newMoons,
      starYearBounds.year,
      yearStart,
      location,
    );
    const ruhanuiTime = ruhanuiStart?.occursAt.getTime();

    if (ruhanuiTime !== undefined) {
      if (relevantNewMoon.occursAt.getTime() === ruhanuiTime) {
        return 0;
      }

      if (relevantNewMoon.occursAt.getTime() > ruhanuiTime) {
        const shiftedSequence = rawSequence - 1;

        return ((shiftedSequence - 1) % regularMonthCount) + 1;
      }
    }

    if (rawSequence > regularMonthCount) {
      return ((rawSequence - 1) % regularMonthCount) + 1;
    }

    return rawSequence;
  }

  private async isMatarikiPublicHolidayStarMonth(
    newMoons: NewMoon[],
    relevantNewMoon: NewMoon,
    starMonthSequence: number | undefined,
    location: Location,
  ): Promise<boolean> {
    if (starMonthSequence !== 0 && starMonthSequence !== 1) {
      return false;
    }

    const relevantLocalDate = this.formatIsoDateForLocation(
      relevantNewMoon.occursAt,
      location,
    );
    const relevantYear = Number(relevantLocalDate.slice(0, 4));
    const starYearBounds = await this.findStarYearBoundsForNewMoon(
      newMoons,
      relevantNewMoon,
      relevantYear,
      location,
    );
    const yearStart = starYearBounds?.start;
    if (!yearStart) {
      return false;
    }

    const ruhanuiStart = await this.findRuhanuiStartNewMoon(
      newMoons,
      starYearBounds.year,
      yearStart,
      location,
    );

    if (!ruhanuiStart) {
      return starMonthSequence === 1;
    }

    return (
      starMonthSequence === 0 &&
      relevantNewMoon.occursAt.getTime() === ruhanuiStart.occursAt.getTime()
    );
  }

  private async findStarYearBoundsForNewMoon(
    newMoons: NewMoon[],
    relevantNewMoon: NewMoon,
    relevantYear: number,
    location: Location,
  ): Promise<{ year: number; start: NewMoon; end?: NewMoon } | undefined> {
    for (const candidateYear of [relevantYear, relevantYear - 1]) {
      const start = await this.findStarYearStartNewMoon(
        newMoons,
        candidateYear,
        location,
      );
      if (
        !start ||
        relevantNewMoon.occursAt.getTime() < start.occursAt.getTime()
      ) {
        continue;
      }

      const end = await this.findStarYearStartNewMoon(
        newMoons,
        candidateYear + 1,
        location,
      );
      if (!end || relevantNewMoon.occursAt.getTime() < end.occursAt.getTime()) {
        return {
          year: candidateYear,
          start,
          end,
        };
      }
    }

    return undefined;
  }

  private async findStarYearStartNewMoon(
    newMoons: NewMoon[],
    year: number,
    location: Location,
  ): Promise<NewMoon | undefined> {
    let pipiriStart = await this.findPipiriStartNewMoon(
      newMoons,
      year,
      location,
    );
    if (!pipiriStart) {
      return undefined;
    }

    if (
      await this.shouldSkipPipiriStartForDelayedYearStartMarker(
        newMoons,
        year,
        pipiriStart,
        location,
      )
    ) {
      pipiriStart = this.findNextNewMoon(
        newMoons,
        pipiriStart.occursAt.getTime(),
      );
      if (!pipiriStart) {
        return undefined;
      }
    }

    const previousPipiriStart = await this.findPipiriStartNewMoon(
      newMoons,
      year - 1,
      location,
    );
    const previousRuhanuiStart = previousPipiriStart
      ? await this.findRuhanuiStartNewMoon(
          newMoons,
          year - 1,
          previousPipiriStart,
          location,
        )
      : undefined;
    if (
      previousRuhanuiStart?.occursAt.getTime() ===
      pipiriStart.occursAt.getTime()
    ) {
      return this.findNextNewMoon(newMoons, pipiriStart.occursAt.getTime());
    }

    return pipiriStart;
  }

  private async findPipiriStartNewMoon(
    newMoons: NewMoon[],
    year: number,
    location: Location,
  ): Promise<NewMoon | undefined> {
    const pipiriMarker = await this.getPipiriMarkerFirstAppearance(
      year,
      location,
    );
    if (pipiriMarker) {
      return newMoons
        .filter(
          (newMoon) =>
            newMoon.occursAt.getTime() > pipiriMarker.observedAt.getTime(),
        )
        .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
    }

    const earliestStartDate = `${year}-01-01`;
    return newMoons
      .filter(
        (newMoon) =>
          this.formatIsoDateForLocation(newMoon.occursAt, location) >=
          earliestStartDate,
      )
      .sort((a, b) => a.occursAt.getTime() - b.occursAt.getTime())[0];
  }

  private async findRuhanuiStartNewMoon(
    newMoons: NewMoon[],
    year: number,
    pipiriStart: NewMoon,
    location: Location,
  ): Promise<NewMoon | undefined> {
    const ruhanuiCandidate = this.findNextNewMoon(
      newMoons,
      pipiriStart.occursAt.getTime(),
    );
    if (!ruhanuiCandidate) {
      return undefined;
    }

    const yearStartMarker = await this.getYearStartMarkerFirstAppearance(
      year,
      location,
    );
    if (!yearStartMarker) {
      return undefined;
    }

    const pipiriWhiroStartsAt = await this.getWhiroStartsAt(
      pipiriStart,
      location,
    );
    if (!pipiriWhiroStartsAt) {
      return undefined;
    }

    if (yearStartMarker.observedAt.getTime() <= pipiriWhiroStartsAt.getTime()) {
      return undefined;
    }

    if (
      this.localDaysBetween(
        pipiriWhiroStartsAt,
        yearStartMarker.observedAt,
        location,
      ) > RUHANUI_EARLY_MATARIKI_AFTER_WHIRO_MAX_DAYS
    ) {
      return undefined;
    }

    return ruhanuiCandidate;
  }

  private async shouldSkipPipiriStartForDelayedYearStartMarker(
    newMoons: NewMoon[],
    year: number,
    pipiriStart: NewMoon,
    location: Location,
  ): Promise<boolean> {
    if (!this.findNextNewMoon(newMoons, pipiriStart.occursAt.getTime())) {
      return false;
    }

    const yearStartMarker = await this.getYearStartMarkerFirstAppearance(
      year,
      location,
    );
    if (!yearStartMarker) {
      return false;
    }

    const pipiriWhiroStartsAt = await this.getWhiroStartsAt(
      pipiriStart,
      location,
    );
    if (
      !pipiriWhiroStartsAt ||
      yearStartMarker.observedAt.getTime() <= pipiriWhiroStartsAt.getTime()
    ) {
      return false;
    }

    return (
      this.localDaysBetween(
        pipiriWhiroStartsAt,
        yearStartMarker.observedAt,
        location,
      ) > RUHANUI_EARLY_MATARIKI_AFTER_WHIRO_MAX_DAYS
    );
  }

  private regularStarMonthCount(): number {
    return (
      this.ruleSet.starMonthNaming?.months.filter((month) => month.sequence > 0)
        .length ?? 12
    );
  }

  private async getOptionalStarNightInvisibilityPeriods(
    location: Location,
    startDate: string,
    endDate: string,
    markers: StarMarkerDefinition[],
  ): Promise<StarMarkerNightInvisibilityPeriod[]> {
    try {
      return (
        (await this.astronomyProvider.getStarNightInvisibilityPeriods?.(
          startDate,
          endDate,
          location,
          markers,
          ASTRONOMICAL_NIGHT_SUN_ALTITUDE_DEGREES,
        )) ?? []
      );
    } catch {
      return [];
    }
  }

  private async getYearStartMarkerFirstAppearance(
    year: number,
    location: Location,
  ): Promise<StarMarker | undefined> {
    const marker = this.getYearStartMarkerDefinition();
    if (!marker) {
      return undefined;
    }

    const [appearance] = await this.getOptionalStarFirstAppearances(
      location,
      `${year}-01-01`,
      `${year + 1}-01-01`,
      [marker],
    );

    return appearance;
  }

  private async getPipiriMarkerFirstAppearance(
    year: number,
    location: Location,
  ): Promise<StarMarker | undefined> {
    const marker = this.getPipiriMarkerDefinition();
    if (!marker) {
      return undefined;
    }

    const [appearance] = await this.getOptionalStarFirstAppearances(
      location,
      `${year}-01-01`,
      `${year + 1}-01-01`,
      [marker],
    );

    return appearance;
  }

  private async getWhiroStartsAt(
    newMoon: NewMoon,
    location: Location,
  ): Promise<Date | undefined> {
    const whiroDate = this.formatIsoDateForLocation(newMoon.occursAt, location);
    const moonRises = await this.fetchMoonRisesForMonth(whiroDate, location);

    try {
      return this.calculateWhiroStartFn({
        newMoonAt: newMoon.occursAt,
        newMoonLocalDate: whiroDate,
        moonRises,
      });
    } catch {
      return undefined;
    }
  }

  private getPipiriMarkerDefinition(): StarMarkerDefinition | undefined {
    const markerIds = this.ruleSet.starMonthNaming?.months.find(
      (month) => month.sequence === 1,
    )?.markerIds;
    const markers = this.ruleSet.starMonthNaming?.markers ?? [];

    return (
      markerIds
        ?.map((markerId) => markers.find((marker) => marker.id === markerId))
        .find((marker): marker is StarMarkerDefinition => Boolean(marker)) ??
      markers[0]
    );
  }

  private getYearStartMarkerDefinition(): StarMarkerDefinition | undefined {
    return this.ruleSet.yearStartRule?.marker;
  }

  private getRuleSetMarkerDefinitions(): StarMarkerDefinition[] {
    const markers = [
      ...(this.ruleSet.yearStartRule
        ? [this.ruleSet.yearStartRule.marker]
        : []),
      ...(this.ruleSet.starMonthNaming?.markers ?? []),
    ];
    const seen = new Set<string>();

    return markers.filter((marker) => {
      if (seen.has(marker.id)) {
        return false;
      }

      seen.add(marker.id);
      return true;
    });
  }

  private async fetchMoonRisesForMonth(
    startDate: string,
    location: Location,
  ): Promise<MoonRise[]> {
    const datesToFetch = Array.from(
      { length: this.ruleSet.mata.length + 5 },
      (_, offset) => this.addIsoDateDays(startDate, offset - 1),
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

  private closestFridayInDateRangeToInterval(
    candidateStartsOn: string,
    candidateEndsOn: string,
    startsAt: Date,
    endsAt: Date,
    location: Location,
  ): string {
    const candidateStartDay = this.localDateOrdinal(candidateStartsOn);
    const candidateEndDay = this.localDateOrdinal(candidateEndsOn);
    let closestFriday: number | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let day = candidateStartDay; day < candidateEndDay; day += 1) {
      if (this.weekdayForOrdinal(day) !== 5) {
        continue;
      }

      const fridayDate = this.localDateFromOrdinal(day);
      const fridayStartsAt = this.localDateStart(fridayDate, location);
      const fridayEndsAt = this.localDateStart(
        this.addIsoDateDays(fridayDate, 1),
        location,
      );
      const distanceToRange = this.intervalDistanceMs(
        fridayStartsAt,
        fridayEndsAt,
        startsAt,
        endsAt,
      );
      if (
        distanceToRange < closestDistance ||
        (distanceToRange === closestDistance &&
          (closestFriday === undefined || day < closestFriday))
      ) {
        closestFriday = day;
        closestDistance = distanceToRange;
      }
    }

    return this.localDateFromOrdinal(closestFriday ?? candidateStartDay);
  }

  private intervalDistanceMs(
    firstStartsAt: Date,
    firstEndsAt: Date,
    secondStartsAt: Date,
    secondEndsAt: Date,
  ): number {
    if (firstEndsAt.getTime() <= secondStartsAt.getTime()) {
      return secondStartsAt.getTime() - firstEndsAt.getTime();
    }

    if (firstStartsAt.getTime() >= secondEndsAt.getTime()) {
      return firstStartsAt.getTime() - secondEndsAt.getTime();
    }

    return 0;
  }

  private localDateStart(localDate: string, location: Location): Date {
    const [year, month, day] = localDate
      .split('-')
      .map((part) => Number.parseInt(part, 10));

    return parseLocalDateTimeInTimezone(
      {
        year,
        month,
        day,
        hour: 0,
        minute: 0,
        second: 0,
      },
      location.timezone,
    );
  }

  private localDateOrdinal(localDate: string): number {
    const [year, month, day] = localDate
      .split('-')
      .map((part) => Number.parseInt(part, 10));

    return Math.floor(Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000));
  }

  private localDateFromOrdinal(ordinal: number): string {
    return new Date(ordinal * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  private localDaysBetween(
    startsAt: Date,
    endsAt: Date,
    location: Location,
  ): number {
    return (
      this.localDateOrdinal(this.formatIsoDateForLocation(endsAt, location)) -
      this.localDateOrdinal(this.formatIsoDateForLocation(startsAt, location))
    );
  }

  private weekdayForOrdinal(ordinal: number): number {
    return new Date(ordinal * 24 * 60 * 60 * 1000).getUTCDay();
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
    astronomicalOccursAt?: Date;
  }): MaramatakaCycleAnchor {
    return {
      type: input.type,
      label: input.label,
      occursAt: input.occursAt,
      astronomicalOccursAt: input.astronomicalOccursAt,
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

  private findPhaseNight(
    nights: MaramatakaNight[],
    phaseAt: Date,
  ): MaramatakaNight | undefined {
    return this.findNightForDate(nights, phaseAt);
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
    const nextWhiro = findWhiroMoonrise({
      newMoonAt: nextNewMoon.occursAt,
      newMoonLocalDate: nextWhiroDate,
      moonRises,
    });
    const nextWhiroIndex = nextWhiro
      ? moonRises.findIndex(
          (moonRise) =>
            moonRise.risesAt.getTime() === nextWhiro.risesAt.getTime(),
        )
      : moonRises.findIndex((moonRise) => moonRise.date === nextWhiroDate);

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

  private selectMataForMoonRiseIntervals(
    mata: Mata[],
    moonRises: MoonRise[],
  ): Mata[] {
    return mata.slice(0, Math.max(moonRises.length - 1, 0));
  }

  private asArray<T>(value: T[] | undefined): T[] {
    return value ?? [];
  }

  private get version(): MaramatakaVersion {
    return this.ruleSet.mataVersion;
  }

  private createLegacyRuleSet(
    mata = LIVING_BY_THE_STARS_MATA,
    version: MaramatakaVersion = 'mita-te-tai-best',
  ): MaramatakaRuleSet {
    if (mata === LIVING_BY_THE_STARS_MATA && version === 'mita-te-tai-best') {
      return LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET;
    }

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
