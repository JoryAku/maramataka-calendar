import {
  AstronomyProvider,
  AstronomyEngineProvider,
  CachedAstronomyProvider,
  FileAstronomyCacheStore,
  Location,
  MoonPhase,
  PersistentCachedAstronomyProvider,
  StarMarker,
  StarMarkerDefinition,
} from '@maramataka-calendar/astronomy';
import {
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaService,
  MaramatakaYearMonth,
} from '@maramataka-calendar/maramataka-domain';
import { join } from 'node:path';

type AstronomyEngineModule = typeof import('astronomy-engine');

const officialDates = new Map<
  number,
  {
    tangaroaStartsOn: string;
    tangaroaEndsOn: string;
    holiday: string;
  }
>([
  [
    2022,
    {
      tangaroaStartsOn: '2022-06-21',
      tangaroaEndsOn: '2022-06-24',
      holiday: '2022-06-24',
    },
  ],
  [
    2023,
    {
      tangaroaStartsOn: '2023-07-10',
      tangaroaEndsOn: '2023-07-13',
      holiday: '2023-07-14',
    },
  ],
  [
    2024,
    {
      tangaroaStartsOn: '2024-06-29',
      tangaroaEndsOn: '2024-07-02',
      holiday: '2024-06-28',
    },
  ],
  [
    2025,
    {
      tangaroaStartsOn: '2025-06-19',
      tangaroaEndsOn: '2025-06-22',
      holiday: '2025-06-20',
    },
  ],
  [
    2026,
    {
      tangaroaStartsOn: '2026-07-08',
      tangaroaEndsOn: '2026-07-11',
      holiday: '2026-07-10',
    },
  ],
  [
    2027,
    {
      tangaroaStartsOn: '2027-06-27',
      tangaroaEndsOn: '2027-06-30',
      holiday: '2027-06-25',
    },
  ],
  [
    2028,
    {
      tangaroaStartsOn: '2028-07-15',
      tangaroaEndsOn: '2028-07-18',
      holiday: '2028-07-14',
    },
  ],
  [
    2029,
    {
      tangaroaStartsOn: '2029-07-04',
      tangaroaEndsOn: '2029-07-07',
      holiday: '2029-07-06',
    },
  ],
  [
    2030,
    {
      tangaroaStartsOn: '2030-06-23',
      tangaroaEndsOn: '2030-06-26',
      holiday: '2030-06-21',
    },
  ],
  [
    2031,
    {
      tangaroaStartsOn: '2031-07-11',
      tangaroaEndsOn: '2031-07-14',
      holiday: '2031-07-11',
    },
  ],
  [
    2032,
    {
      tangaroaStartsOn: '2032-06-30',
      tangaroaEndsOn: '2032-07-02',
      holiday: '2032-07-02',
    },
  ],
  [
    2033,
    {
      tangaroaStartsOn: '2033-06-20',
      tangaroaEndsOn: '2033-06-23',
      holiday: '2033-06-24',
    },
  ],
  [
    2034,
    {
      tangaroaStartsOn: '2034-07-09',
      tangaroaEndsOn: '2034-07-12',
      holiday: '2034-07-07',
    },
  ],
  [
    2035,
    {
      tangaroaStartsOn: '2035-06-29',
      tangaroaEndsOn: '2035-07-01',
      holiday: '2035-06-29',
    },
  ],
  [
    2036,
    {
      tangaroaStartsOn: '2036-07-17',
      tangaroaEndsOn: '2036-07-20',
      holiday: '2036-07-18',
    },
  ],
  [
    2037,
    {
      tangaroaStartsOn: '2037-07-06',
      tangaroaEndsOn: '2037-07-09',
      holiday: '2037-07-10',
    },
  ],
  [
    2038,
    {
      tangaroaStartsOn: '2038-06-25',
      tangaroaEndsOn: '2038-06-28',
      holiday: '2038-06-25',
    },
  ],
  [
    2039,
    {
      tangaroaStartsOn: '2039-07-13',
      tangaroaEndsOn: '2039-07-16',
      holiday: '2039-07-15',
    },
  ],
  [
    2040,
    {
      tangaroaStartsOn: '2040-07-01',
      tangaroaEndsOn: '2040-07-04',
      holiday: '2040-07-06',
    },
  ],
  [
    2041,
    {
      tangaroaStartsOn: '2041-07-21',
      tangaroaEndsOn: '2041-07-24',
      holiday: '2041-07-19',
    },
  ],
  [
    2042,
    {
      tangaroaStartsOn: '2042-07-10',
      tangaroaEndsOn: '2042-07-14',
      holiday: '2042-07-11',
    },
  ],
  [
    2043,
    {
      tangaroaStartsOn: '2043-06-30',
      tangaroaEndsOn: '2043-07-03',
      holiday: '2043-07-03',
    },
  ],
  [
    2044,
    {
      tangaroaStartsOn: '2044-06-19',
      tangaroaEndsOn: '2044-06-22',
      holiday: '2044-06-24',
    },
  ],
  [
    2045,
    {
      tangaroaStartsOn: '2045-07-07',
      tangaroaEndsOn: '2045-07-10',
      holiday: '2045-07-07',
    },
  ],
  [
    2046,
    {
      tangaroaStartsOn: '2046-06-26',
      tangaroaEndsOn: '2046-06-29',
      holiday: '2046-06-29',
    },
  ],
  [
    2047,
    {
      tangaroaStartsOn: '2047-07-15',
      tangaroaEndsOn: '2047-07-18',
      holiday: '2047-07-19',
    },
  ],
  [
    2048,
    {
      tangaroaStartsOn: '2048-07-03',
      tangaroaEndsOn: '2048-07-06',
      holiday: '2048-07-03',
    },
  ],
  [
    2049,
    {
      tangaroaStartsOn: '2049-06-22',
      tangaroaEndsOn: '2049-06-25',
      holiday: '2049-06-25',
    },
  ],
  [
    2050,
    {
      tangaroaStartsOn: '2050-07-11',
      tangaroaEndsOn: '2050-07-14',
      holiday: '2050-07-15',
    },
  ],
  [
    2051,
    {
      tangaroaStartsOn: '2051-07-01',
      tangaroaEndsOn: '2051-07-04',
      holiday: '2051-06-30',
    },
  ],
  [
    2052,
    {
      tangaroaStartsOn: '2052-06-20',
      tangaroaEndsOn: '2052-06-23',
      holiday: '2052-06-21',
    },
  ],
]);

const sourceCalendarFixtures = [
  {
    label: '2021/2022',
    date: '2021-07-01',
    pipiriStartsOn: '2021-06-10',
    ruhanuiStartsOn: 'none',
    matarikiPeriod: '2021-07-02..2021-07-09',
  },
  {
    label: '2022/2023',
    date: '2022-07-01',
    pipiriStartsOn: '2022-05-30',
    ruhanuiStartsOn: 'none',
    matarikiPeriod: '2022-06-21..2022-06-28',
  },
  {
    label: '2023/2024',
    date: '2023-07-01',
    pipiriStartsOn: '2023-05-20',
    ruhanuiStartsOn: '2023-06-18',
    matarikiPeriod: '2023-07-10..2023-07-17',
  },
];

type OfficialDate = {
  tangaroaStartsOn: string;
  tangaroaEndsOn: string;
  holiday: string;
};

type DetailedMonthEntry = {
  yearMonth: MaramatakaYearMonth;
  month: MaramatakaMonth;
};

type OfficialYearContext = {
  year: number;
  official: OfficialDate;
  maramatakaYear: Awaited<ReturnType<MaramatakaService['getYear']>>;
  detailedMonths: DetailedMonthEntry[];
  calculatedHoliday: string;
  holidayYearMonth: MaramatakaYearMonth | undefined;
  bestCandidate: ReturnType<typeof bestTangaroaCandidate>;
};

const holidayTangaroaTargetMata = new Set([
  'Tangaroa-ā-mua',
  'Tangaroa-ā-roto',
  'Tangaroa-whakapau',
  'Tangaroa whāriki kio-kio',
]);

const tangaroaBoundaryPatterns = {
  exact: [
    'Tangaroa-ā-mua',
    'Tangaroa-ā-roto',
    'Tangaroa-whakapau',
    'Tangaroa whāriki kio-kio',
  ],
  oneMataEarly: [
    'Korekore whakapiri',
    'Tangaroa-ā-mua',
    'Tangaroa-ā-roto',
    'Tangaroa-whakapau',
  ],
  twoMataEarly: [
    'Korekore Rawea',
    'Korekore whakapiri',
    'Tangaroa-ā-mua',
    'Tangaroa-ā-roto',
  ],
};

const location = {
  id: 'wellington',
  name: 'Wellington',
  latitude: -41.2865,
  longitude: 174.7762,
  timezone: 'Pacific/Auckland',
};

const localDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: location.timezone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function localDate(date: Date): string {
  const parts = Object.fromEntries(
    localDateFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localDateOrdinal(date: string): number {
  const [year, month, day] = date
    .split('-')
    .map((part) => Number.parseInt(part, 10));

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function addLocalDateDays(date: string, days: number): string {
  return new Date((localDateOrdinal(date) + days) * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function dateRange(start: string, end: string): string {
  return `${start}..${end}`;
}

function datesInRange(start: string, end: string): string[] {
  const dates = [];
  for (
    let ordinal = localDateOrdinal(start);
    ordinal <= localDateOrdinal(end);
    ordinal += 1
  ) {
    dates.push(new Date(ordinal * 86_400_000).toISOString().slice(0, 10));
  }

  return dates;
}

function dateRangeDelta(
  calculatedStart: string,
  calculatedEnd: string,
  officialStart: string,
  officialEnd: string,
): string {
  return `${
    localDateOrdinal(calculatedStart) - localDateOrdinal(officialStart)
  }/${localDateOrdinal(calculatedEnd) - localDateOrdinal(officialEnd)}`;
}

function dateDelta(calculated: string, official: string): number {
  return localDateOrdinal(calculated) - localDateOrdinal(official);
}

function localMidday(date: string): Date {
  return new Date(`${date}T12:00:00+12:00`);
}

function formatNumber(value: number | undefined): number | string {
  return value === undefined ? 'missing' : Number(value.toFixed(1));
}

function sunAltitudeAt(
  engine: AstronomyEngineModule,
  observedAt: Date,
): number {
  const observer = new engine.Observer(
    location.latitude,
    location.longitude,
    0,
  );
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

function ruhanuiRuleSignal(hamalYearNewMoonCount: number): string {
  return hamalYearNewMoonCount > 12
    ? `insert Ruhanui: ${hamalYearNewMoonCount} Hamal-year New Moons`
    : `no Ruhanui: ${hamalYearNewMoonCount} Hamal-year New Moons`;
}

function markerFirstAppearanceDate(marker: StarMarker | undefined): string {
  return marker ? localDate(marker.observedAt) : 'missing';
}

async function sampledDawnFirstAppearance(
  provider: AstronomyProvider,
  startDate: string,
  endDate: string,
  location: Location,
  marker: StarMarkerDefinition,
): Promise<StarMarker | undefined> {
  const [firstDawnWindowAppearance] =
    (await provider.getStarFirstAppearances?.(startDate, endDate, location, [
      marker,
    ])) ?? [];
  let date = firstDawnWindowAppearance
    ? localDate(firstDawnWindowAppearance.observedAt)
    : startDate;

  while (date < endDate) {
    const sampledMarkers =
      (await provider.getStarMarkers?.(date, location, [marker])) ?? [];
    const sampledMarker = sampledMarkers.find(
      (candidate) =>
        candidate.id === marker.id &&
        candidate.visibility !== 'below-horizon' &&
        candidate.altitudeDegrees >= 0,
    );

    if (sampledMarker) {
      return sampledMarker;
    }

    date = addLocalDateDays(date, 1);
  }

  return undefined;
}

function phaseLocalDate(phase: MoonPhase | undefined): string {
  return phase ? localDate(phase.occursAt) : 'missing';
}

function phasesOnOrAfter(phases: MoonPhase[], date: string): MoonPhase[] {
  if (date === 'missing') {
    return [];
  }

  const dateOrdinal = localDateOrdinal(date);
  return phases
    .filter(
      (phase) => localDateOrdinal(localDate(phase.occursAt)) >= dateOrdinal,
    )
    .sort(
      (first, second) => first.occursAt.getTime() - second.occursAt.getTime(),
    );
}

function phasesBefore(phases: MoonPhase[], date: string): MoonPhase[] {
  if (date === 'missing') {
    return [];
  }

  const dateOrdinal = localDateOrdinal(date);
  return phases
    .filter(
      (phase) => localDateOrdinal(localDate(phase.occursAt)) < dateOrdinal,
    )
    .sort(
      (first, second) => first.occursAt.getTime() - second.occursAt.getTime(),
    );
}

function phaseCountBetween(
  phases: MoonPhase[],
  startDate: string,
  endDate: string,
): number | string {
  if (startDate === 'missing' || endDate === 'missing') {
    return 'missing';
  }

  const startOrdinal = localDateOrdinal(startDate);
  const endOrdinal = localDateOrdinal(endDate);

  return phases.filter((phase) => {
    const ordinal = localDateOrdinal(localDate(phase.occursAt));
    return ordinal >= startOrdinal && ordinal <= endOrdinal;
  }).length;
}

function markerMinusReferenceDays(
  marker: StarMarker | undefined,
  referenceDate: string,
): number | string {
  if (!marker || referenceDate === 'missing') {
    return 'missing';
  }

  return dateDelta(localDate(marker.observedAt), referenceDate);
}

function dateMinusReferenceDays(
  date: string,
  referenceDate: string,
): number | string {
  if (date === 'missing' || referenceDate === 'missing') {
    return 'missing';
  }

  return dateDelta(date, referenceDate);
}

function numericValues(
  rows: Array<Record<string, unknown>>,
  key: string,
): number[] {
  return rows
    .map((row) => row[key])
    .filter((value): value is number => typeof value === 'number');
}

function rangeSummary(
  rows: Array<Record<string, unknown>>,
  key: string,
): {
  metric: string;
  min: number | string;
  max: number | string;
  count: number;
} {
  const values = numericValues(rows, key);

  return {
    metric: key,
    min: values.length ? Math.min(...values) : 'missing',
    max: values.length ? Math.max(...values) : 'missing',
    count: values.length,
  };
}

function containsDateRange(
  containerStart: string,
  containerEnd: string,
  containedStart: string,
  containedEnd: string,
): boolean {
  return (
    localDateOrdinal(containerStart) <= localDateOrdinal(containedStart) &&
    localDateOrdinal(containerEnd) >= localDateOrdinal(containedEnd)
  );
}

function overlapsDateRange(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): boolean {
  return (
    localDateOrdinal(firstStart) <= localDateOrdinal(secondEnd) &&
    localDateOrdinal(firstEnd) >= localDateOrdinal(secondStart)
  );
}

function overlapDays(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): number {
  const overlapStart = Math.max(
    localDateOrdinal(firstStart),
    localDateOrdinal(secondStart),
  );
  const overlapEnd = Math.min(
    localDateOrdinal(firstEnd),
    localDateOrdinal(secondEnd),
  );

  return Math.max(0, overlapEnd - overlapStart + 1);
}

function isFriday(date: string): boolean {
  return new Date(`${date}T12:00:00+12:00`).getUTCDay() === 5;
}

function midpointTime(start: Date, end: Date): number {
  return start.getTime() + (end.getTime() - start.getTime()) / 2;
}

function closestFridayInDateRangeToInterval(
  startDate: string,
  endDate: string,
  intervalStartsAt: Date,
  intervalEndsAt: Date,
): string {
  const intervalMidpoint = midpointTime(intervalStartsAt, intervalEndsAt);
  const fridays = datesInRange(startDate, endDate).filter((date) =>
    isFriday(date),
  );

  return (
    fridays
      .map((date) => ({
        date,
        distance: Math.abs(localMidday(date).getTime() - intervalMidpoint),
      }))
      .sort(
        (first, second) =>
          first.distance - second.distance ||
          localDateOrdinal(first.date) - localDateOrdinal(second.date),
      )[0]?.date ?? 'missing'
  );
}

function isPrefixMatch(actual: string[], expected: string[]): boolean {
  return actual.every((mata, index) => mata === expected[index]);
}

function boundaryPattern(generatedMata: string[]): string {
  if (generatedMata.every((mata) => holidayTangaroaTargetMata.has(mata))) {
    return 'exact-target';
  }

  if (isPrefixMatch(generatedMata, tangaroaBoundaryPatterns.oneMataEarly)) {
    return 'one-mata-early';
  }

  if (isPrefixMatch(generatedMata, tangaroaBoundaryPatterns.twoMataEarly)) {
    return 'two-mata-early';
  }

  return 'other';
}

function likelyDifference(
  pattern: string,
  holidayMonthOverlapsOfficial: boolean,
  holidayStatus: string,
): string {
  if (!holidayMonthOverlapsOfficial) {
    return 'holiday-marama-placement';
  }

  if (pattern === 'exact-target') {
    return holidayStatus === 'MATCH'
      ? 'aligned'
      : 'holiday-friday-or-marama-selection';
  }

  if (pattern === 'one-mata-early') {
    return 'boundary-convention-one-mata-early';
  }

  if (pattern === 'two-mata-early') {
    return 'mata-or-month-alignment-two-mata-early';
  }

  return 'mixed';
}

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => ({
      ...counts,
      [value]: (counts[value] ?? 0) + 1,
    }),
    {} as Record<T, number>,
  );
}

async function detailedMonthForYearMonth(
  service: MaramatakaService,
  yearMonth: {
    anchors: {
      whiro: {
        astronomicalOccursAt?: Date;
        occursAt: Date;
      };
    };
  },
): Promise<MaramatakaMonth> {
  const cycle = await service.getCycleDetails(
    location,
    yearMonth.anchors.whiro.astronomicalOccursAt ??
      yearMonth.anchors.whiro.occursAt,
  );

  if (!cycle) {
    throw new Error('No cycle details found for generated marama');
  }

  return monthFromCycle(cycle);
}

function monthFromCycle(cycle: MaramatakaCycleDetails): MaramatakaMonth {
  return {
    version: cycle.version,
    ruleSet: cycle.ruleSet,
    whiroStartsAt: cycle.anchors.whiro.occursAt,
    starMonthSequence: cycle.starMonth?.note?.sequence,
    nights: cycle.nights,
  };
}

async function detailedMonthsForYear(
  service: MaramatakaService,
  months: MaramatakaYearMonth[],
): Promise<DetailedMonthEntry[]> {
  return Promise.all(
    months.map(async (yearMonth) => ({
      yearMonth,
      month: await detailedMonthForYearMonth(service, yearMonth),
    })),
  );
}

async function officialYearContexts(
  service: MaramatakaService,
): Promise<OfficialYearContext[]> {
  const contexts = [];

  for (const [year, official] of officialDates) {
    const maramatakaYear = await service.getYear(
      location,
      new Date(`${year}-07-01T12:00:00+12:00`),
    );
    const detailedMonths = await detailedMonthsForYear(
      service,
      maramatakaYear.months,
    );
    const holiday = maramatakaYear.events.find(
      (event) =>
        event.type === 'public-holiday' &&
        event.name === 'Matariki public holiday',
    );
    const calculatedHoliday = holiday ? localDate(holiday.occursAt) : 'missing';
    const holidayYearMonth = holiday?.monthSequence
      ? maramatakaYear.months.find(
          (month) => month.sequence === holiday.monthSequence,
        )
      : undefined;
    const bestCandidate = bestTangaroaCandidate(
      detailedMonths,
      official.tangaroaStartsOn,
      official.tangaroaEndsOn,
    );

    contexts.push({
      year,
      official,
      maramatakaYear,
      detailedMonths,
      calculatedHoliday,
      holidayYearMonth,
      bestCandidate,
    });
  }

  return contexts;
}

function tangaroaPeriod(month: MaramatakaMonth):
  | {
      startsOn: string;
      endsOn: string;
    }
  | undefined {
  const targetNights = month.nights.filter((night) =>
    holidayTangaroaTargetMata.has(night.mata.name),
  );

  if (!targetNights.length) {
    return undefined;
  }

  return {
    startsOn: localDate(targetNights[0].startsAt),
    endsOn: localDate(targetNights[targetNights.length - 1].startsAt),
  };
}

function tangaroaInterval(month: MaramatakaMonth):
  | {
      startsAt: Date;
      endsAt: Date;
      startsOn: string;
      endsOn: string;
    }
  | undefined {
  const targetNights = month.nights
    .filter((night) => holidayTangaroaTargetMata.has(night.mata.name))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const firstTargetNight = targetNights[0];
  const lastTargetNight = targetNights[targetNights.length - 1];

  if (!firstTargetNight || !lastTargetNight) {
    return undefined;
  }

  return {
    startsAt: firstTargetNight.startsAt,
    endsAt: lastTargetNight.endsAt,
    startsOn: localDate(firstTargetNight.startsAt),
    endsOn: localDate(lastTargetNight.startsAt),
  };
}

function bestTangaroaCandidate(
  detailedMonths: Array<{
    yearMonth: MaramatakaYearMonth;
    month: MaramatakaMonth;
  }>,
  officialStart: string,
  officialEnd: string,
):
  | {
      yearMonth: MaramatakaYearMonth;
      tangaroa: {
        startsAt: Date;
        endsAt: Date;
        startsOn: string;
        endsOn: string;
      };
      overlapDays: number;
      startDelta: number;
      endDelta: number;
      candidateHoliday: string;
    }
  | undefined {
  return detailedMonths
    .map(({ yearMonth, month }) => {
      const tangaroa = tangaroaInterval(month);
      if (!tangaroa) {
        return undefined;
      }

      const candidateHoliday = closestFridayInDateRangeToInterval(
        localDate(yearMonth.startsAt),
        localDate(yearMonth.endsAt),
        tangaroa.startsAt,
        tangaroa.endsAt,
      );

      return {
        yearMonth,
        tangaroa,
        overlapDays: overlapDays(
          tangaroa.startsOn,
          tangaroa.endsOn,
          officialStart,
          officialEnd,
        ),
        startDelta: dateDelta(tangaroa.startsOn, officialStart),
        endDelta: dateDelta(tangaroa.endsOn, officialEnd),
        candidateHoliday,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is {
        yearMonth: MaramatakaYearMonth;
        tangaroa: {
          startsAt: Date;
          endsAt: Date;
          startsOn: string;
          endsOn: string;
        };
        overlapDays: number;
        startDelta: number;
        endDelta: number;
        candidateHoliday: string;
      } => Boolean(candidate),
    )
    .sort(
      (first, second) =>
        second.overlapDays - first.overlapDays ||
        Math.abs(first.startDelta) - Math.abs(second.startDelta) ||
        Math.abs(first.endDelta) - Math.abs(second.endDelta),
    )[0];
}

function generatedCoverageForOfficialTangaroa(
  detailedMonths: Array<{
    yearMonth: MaramatakaYearMonth;
    month: MaramatakaMonth;
  }>,
  officialStart: string,
  officialEnd: string,
): {
  generatedMarama: string;
  generatedMata: string;
  generatedMataByDate: Array<{
    officialDate: string;
    generatedMarama: string;
    generatedMata: string;
    isTangaroa: boolean;
  }>;
  generatedMataAreTangaroa: boolean;
  boundaryPattern: string;
} {
  const coverage = datesInRange(officialStart, officialEnd).map((date) => {
    const officialDateMidday = localMidday(date).getTime();

    for (const { yearMonth, month } of detailedMonths) {
      const night = month.nights.find(
        (candidate) =>
          candidate.startsAt.getTime() <= officialDateMidday &&
          candidate.endsAt.getTime() > officialDateMidday,
      );

      if (night) {
        return {
          date,
          marama: yearMonth.name,
          mata: night.mata.name,
          isTangaroa: holidayTangaroaTargetMata.has(night.mata.name),
        };
      }
    }

    return {
      date,
      marama: 'missing',
      mata: 'missing',
      isTangaroa: false,
    };
  });
  const generatedMarama = [
    ...new Set(coverage.map((entry) => entry.marama)),
  ].join('; ');
  const generatedMata = coverage.map((entry) => entry.mata).join(' -> ');
  const generatedMataNames = coverage.map((entry) => entry.mata);

  return {
    generatedMarama,
    generatedMata,
    generatedMataByDate: coverage.map((entry) => ({
      officialDate: entry.date,
      generatedMarama: entry.marama,
      generatedMata: entry.mata,
      isTangaroa: entry.isTangaroa,
    })),
    generatedMataAreTangaroa: coverage.every((entry) => entry.isTangaroa),
    boundaryPattern: boundaryPattern(generatedMataNames),
  };
}

function officialComparisonRows(contexts: OfficialYearContext[]): {
  rows: Array<{
    year: number;
    officialHoliday: string;
    calculatedHoliday: string;
    holidayStatus: string;
    officialTangaroa: string;
    holidayMonth: string;
    holidayMonthTangaroa: string;
    holidayMonthDelta: string;
    holidayMonthContainsOfficial: boolean;
    holidayMonthOverlapsOfficial: boolean;
    officialTangaroaGeneratedMarama: string;
    officialTangaroaGeneratedMata: string;
    officialTangaroaGeneratedMataAreTarget: boolean;
    officialTangaroaBoundaryPattern: string;
    bestOverlapMarama: string;
    bestOverlapTangaroa: string;
    bestOverlapDays: number;
    monthSelectionDelta: number | string;
    candidateHolidayIfBestOverlap: string;
    candidateHolidayStatus: string;
    likelyDifference: string;
  }>;
  details: Array<{
    year: number;
    officialDate: string;
    generatedMarama: string;
    generatedMata: string;
    isTangaroaTarget: boolean;
  }>;
} {
  const rows = [];
  const details = [];

  for (const {
    year,
    official,
    detailedMonths,
    calculatedHoliday,
    holidayYearMonth,
    bestCandidate,
  } of contexts) {
    const holidayMonth = detailedMonths.find(
      ({ yearMonth }) => yearMonth.sequence === holidayYearMonth?.sequence,
    )?.month;
    const holidayTangaroa = holidayMonth
      ? tangaroaPeriod(holidayMonth)
      : undefined;
    const holidayTangaroaStart = holidayTangaroa?.startsOn ?? 'missing';
    const holidayTangaroaEnd = holidayTangaroa?.endsOn ?? 'missing';
    const officialCoverage = generatedCoverageForOfficialTangaroa(
      detailedMonths,
      official.tangaroaStartsOn,
      official.tangaroaEndsOn,
    );
    const holidayMonthOverlapsOfficial =
      holidayTangaroaStart !== 'missing' &&
      overlapsDateRange(
        holidayTangaroaStart,
        holidayTangaroaEnd,
        official.tangaroaStartsOn,
        official.tangaroaEndsOn,
      );

    rows.push({
      year,
      officialHoliday: official.holiday,
      calculatedHoliday,
      holidayStatus: calculatedHoliday === official.holiday ? 'MATCH' : 'DIFF',
      officialTangaroa: dateRange(
        official.tangaroaStartsOn,
        official.tangaroaEndsOn,
      ),
      holidayMonth: holidayYearMonth?.name ?? 'missing',
      holidayMonthTangaroa: dateRange(holidayTangaroaStart, holidayTangaroaEnd),
      holidayMonthDelta:
        holidayTangaroaStart === 'missing'
          ? 'missing'
          : dateRangeDelta(
              holidayTangaroaStart,
              holidayTangaroaEnd,
              official.tangaroaStartsOn,
              official.tangaroaEndsOn,
            ),
      holidayMonthContainsOfficial:
        holidayTangaroaStart !== 'missing' &&
        containsDateRange(
          holidayTangaroaStart,
          holidayTangaroaEnd,
          official.tangaroaStartsOn,
          official.tangaroaEndsOn,
        ),
      holidayMonthOverlapsOfficial: holidayMonthOverlapsOfficial,
      officialTangaroaGeneratedMarama: officialCoverage.generatedMarama,
      officialTangaroaGeneratedMata: officialCoverage.generatedMata,
      officialTangaroaGeneratedMataAreTarget:
        officialCoverage.generatedMataAreTangaroa,
      officialTangaroaBoundaryPattern: officialCoverage.boundaryPattern,
      bestOverlapMarama: bestCandidate?.yearMonth.name ?? 'missing',
      bestOverlapTangaroa: bestCandidate
        ? dateRange(
            bestCandidate.tangaroa.startsOn,
            bestCandidate.tangaroa.endsOn,
          )
        : 'missing',
      bestOverlapDays: bestCandidate?.overlapDays ?? 0,
      monthSelectionDelta:
        bestCandidate && holidayYearMonth
          ? bestCandidate.yearMonth.sequence - holidayYearMonth.sequence
          : 'missing',
      candidateHolidayIfBestOverlap:
        bestCandidate?.candidateHoliday ?? 'missing',
      candidateHolidayStatus:
        bestCandidate?.candidateHoliday === official.holiday ? 'MATCH' : 'DIFF',
      likelyDifference: likelyDifference(
        officialCoverage.boundaryPattern,
        holidayMonthOverlapsOfficial,
        calculatedHoliday === official.holiday ? 'MATCH' : 'DIFF',
      ),
    });
    details.push(
      ...officialCoverage.generatedMataByDate.map((entry) => ({
        year,
        officialDate: entry.officialDate,
        generatedMarama: entry.generatedMarama,
        generatedMata: entry.generatedMata,
        isTangaroaTarget: entry.isTangaroa,
      })),
    );
  }

  return { rows, details };
}

async function officialMatarikiBehaviourRows(
  contexts: OfficialYearContext[],
  provider: CachedAstronomyProvider,
): Promise<
  Array<{
    year: number;
    officialHoliday: string;
    holidayStatus: string;
    selectedMarama: string;
    bestOfficialTangaroaMarama: string;
    monthSelectionDelta: number | string;
    pipiriWhiro: string;
    secondWhiro: string;
    ruhanui: string;
    teTahiTangaroa: string;
    officialTangaroa: string;
    pipiriFirstAppearance: string;
    pipiriMinusWhiroDays: number | string;
    pipiriAltitude: number | string;
    pipiriAzimuth: number | string;
    sunAltitudeAtPipiri: number | string;
    matarikiFirstAppearance: string;
    appearanceMinusPipiriDays: number | string;
    appearanceMinusTeTahiTangaroaEndDays: number | string;
    matarikiMinusOfficialTangaroaStartDays: number | string;
    matarikiMinusOfficialTangaroaEndDays: number | string;
    matarikiMinusOfficialHolidayDays: number | string;
    appearanceAltitude: number | string;
    appearanceAzimuth: number | string;
    sunAltitudeAtAppearance: number | string;
    matarikiMinusSecondWhiroDays: number | string;
    ruhanuiFirstAppearance: string;
    ruhanuiMinusWhiroDays: number | string;
    ruhanuiMinusSecondWhiroDays: number | string;
    ruhanuiAltitude: number | string;
    ruhanuiAzimuth: number | string;
    sunAltitudeAtRuhanui: number | string;
    newMoonsMatarikiToOfficialTangaroaStart: number | string;
    fullMoonsMatarikiToOfficialTangaroaStart: number | string;
    firstNewMoonAfterMatariki: string;
    secondNewMoonAfterMatariki: string;
    thirdNewMoonAfterMatariki: string;
    firstFullMoonAfterMatariki: string;
    secondFullMoonAfterMatariki: string;
    thirdFullMoonAfterMatariki: string;
    lastNewMoonBeforeOfficialTangaroa: string;
    lastFullMoonBeforeOfficialTangaroa: string;
    officialTangaroaStartMinusSecondNewMoon: number | string;
    officialTangaroaStartMinusSecondFullMoon: number | string;
    officialTangaroaStartMinusThirdNewMoon: number | string;
    officialTangaroaStartMinusThirdFullMoon: number | string;
    currentRuhanuiSignal: string;
  }>
> {
  const rows = [];
  const engine = await import('astronomy-engine');
  const matarikiMarker =
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday
      ?.calibrationMarker;
  const pipiriMarkerId =
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months.find(
      (month) => month.sequence === 1,
    )?.markerIds[0];
  const pipiriMarker =
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.find(
      (marker) => marker.id === pipiriMarkerId,
    );
  const ruhanuiMarkerId =
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months.find(
      (month) => month.sequence === 0,
    )?.markerIds[0];
  const ruhanuiMarker =
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.find(
      (marker) => marker.id === ruhanuiMarkerId,
    );

  if (!matarikiMarker || !pipiriMarker || !ruhanuiMarker) {
    return [];
  }

  for (const {
    year,
    official,
    maramatakaYear,
    detailedMonths,
    calculatedHoliday,
    holidayYearMonth,
    bestCandidate,
  } of contexts) {
    const pipiri = maramatakaYear.months.find(
      (month) =>
        month.name === 'Te Tahi o Pipiri' ||
        month.starMonth?.note?.sequence === 1,
    );
    const secondMonth = pipiri
      ? maramatakaYear.months.find(
          (month) => month.sequence === pipiri.sequence + 1,
        )
      : undefined;
    const ruhanui = maramatakaYear.months.find(
      (month) => month.name === 'Ruhanui',
    );
    const pipiriMonth = detailedMonths.find(
      ({ yearMonth }) => yearMonth.sequence === pipiri?.sequence,
    )?.month;
    const teTahiTangaroa = pipiriMonth
      ? tangaroaPeriod(pipiriMonth)
      : undefined;
    const searchStart = `${year}-01-01`;
    const searchEnd = `${year + 1}-01-01`;
    const [
      firstAppearance,
      pipiriAppearance,
      ruhanuiAppearance,
      moonPhases,
    ] = await Promise.all([
      sampledDawnFirstAppearance(
        provider,
        searchStart,
        searchEnd,
        location,
        matarikiMarker,
      ),
      sampledDawnFirstAppearance(
        provider,
        searchStart,
        searchEnd,
        location,
        pipiriMarker,
      ),
      sampledDawnFirstAppearance(
        provider,
        searchStart,
        searchEnd,
        location,
        ruhanuiMarker,
      ),
      provider.getMoonPhases(year),
    ]);
    const firstAppearanceDate = markerFirstAppearanceDate(firstAppearance);
    const pipiriAppearanceDate = markerFirstAppearanceDate(pipiriAppearance);
    const ruhanuiAppearanceDate = markerFirstAppearanceDate(ruhanuiAppearance);
    const newMoons = moonPhases.filter((phase) => phase.phase === 'New Moon');
    const fullMoons = moonPhases.filter((phase) => phase.phase === 'Full Moon');
    const newMoonsAfterMatariki = phasesOnOrAfter(
      newMoons,
      firstAppearanceDate,
    );
    const fullMoonsAfterMatariki = phasesOnOrAfter(
      fullMoons,
      firstAppearanceDate,
    );
    const lastNewMoonBeforeOfficialTangaroa = phasesBefore(
      newMoons,
      official.tangaroaStartsOn,
    ).at(-1);
    const lastFullMoonBeforeOfficialTangaroa = phasesBefore(
      fullMoons,
      official.tangaroaStartsOn,
    ).at(-1);
    const firstNewMoonAfterMatariki = phaseLocalDate(newMoonsAfterMatariki[0]);
    const secondNewMoonAfterMatariki = phaseLocalDate(newMoonsAfterMatariki[1]);
    const thirdNewMoonAfterMatariki = phaseLocalDate(newMoonsAfterMatariki[2]);
    const firstFullMoonAfterMatariki = phaseLocalDate(
      fullMoonsAfterMatariki[0],
    );
    const secondFullMoonAfterMatariki = phaseLocalDate(
      fullMoonsAfterMatariki[1],
    );
    const thirdFullMoonAfterMatariki = phaseLocalDate(
      fullMoonsAfterMatariki[2],
    );
    const pipiriWhiro = pipiri ? localDate(pipiri.startsAt) : 'missing';
    const secondWhiro = secondMonth
      ? localDate(secondMonth.startsAt)
      : 'missing';
    const teTahiTangaroaEnd = teTahiTangaroa?.endsOn ?? 'missing';
    const hamalYearNewMoonCount = maramatakaYear.months.length;

    rows.push({
      year,
      officialHoliday: official.holiday,
      holidayStatus: calculatedHoliday === official.holiday ? 'MATCH' : 'DIFF',
      selectedMarama: holidayYearMonth?.name ?? 'missing',
      bestOfficialTangaroaMarama: bestCandidate?.yearMonth.name ?? 'missing',
      monthSelectionDelta:
        bestCandidate && holidayYearMonth
          ? bestCandidate.yearMonth.sequence - holidayYearMonth.sequence
          : 'missing',
      pipiriWhiro,
      secondWhiro,
      ruhanui: ruhanui ? localDate(ruhanui.startsAt) : 'none',
      teTahiTangaroa: teTahiTangaroa
        ? dateRange(teTahiTangaroa.startsOn, teTahiTangaroa.endsOn)
        : 'missing',
      officialTangaroa: dateRange(
        official.tangaroaStartsOn,
        official.tangaroaEndsOn,
      ),
      pipiriFirstAppearance: pipiriAppearanceDate,
      pipiriMinusWhiroDays: markerMinusReferenceDays(
        pipiriAppearance,
        pipiriWhiro,
      ),
      pipiriAltitude: formatNumber(pipiriAppearance?.altitudeDegrees),
      pipiriAzimuth: formatNumber(pipiriAppearance?.azimuthDegrees),
      sunAltitudeAtPipiri: pipiriAppearance
        ? formatNumber(sunAltitudeAt(engine, pipiriAppearance.observedAt))
        : 'missing',
      matarikiFirstAppearance: firstAppearanceDate,
      appearanceMinusPipiriDays:
        firstAppearanceDate === 'missing' || pipiriWhiro === 'missing'
          ? 'missing'
          : dateDelta(firstAppearanceDate, pipiriWhiro),
      appearanceMinusTeTahiTangaroaEndDays:
        firstAppearanceDate === 'missing' || teTahiTangaroaEnd === 'missing'
          ? 'missing'
          : dateDelta(firstAppearanceDate, teTahiTangaroaEnd),
      matarikiMinusOfficialTangaroaStartDays: dateMinusReferenceDays(
        firstAppearanceDate,
        official.tangaroaStartsOn,
      ),
      matarikiMinusOfficialTangaroaEndDays: dateMinusReferenceDays(
        firstAppearanceDate,
        official.tangaroaEndsOn,
      ),
      matarikiMinusOfficialHolidayDays: dateMinusReferenceDays(
        firstAppearanceDate,
        official.holiday,
      ),
      appearanceAltitude: formatNumber(firstAppearance?.altitudeDegrees),
      appearanceAzimuth: formatNumber(firstAppearance?.azimuthDegrees),
      sunAltitudeAtAppearance: firstAppearance
        ? formatNumber(sunAltitudeAt(engine, firstAppearance.observedAt))
        : 'missing',
      matarikiMinusSecondWhiroDays:
        firstAppearanceDate === 'missing' || secondWhiro === 'missing'
          ? 'missing'
          : dateDelta(firstAppearanceDate, secondWhiro),
      ruhanuiFirstAppearance: ruhanuiAppearanceDate,
      ruhanuiMinusWhiroDays: markerMinusReferenceDays(
        ruhanuiAppearance,
        pipiriWhiro,
      ),
      ruhanuiMinusSecondWhiroDays: markerMinusReferenceDays(
        ruhanuiAppearance,
        secondWhiro,
      ),
      ruhanuiAltitude: formatNumber(ruhanuiAppearance?.altitudeDegrees),
      ruhanuiAzimuth: formatNumber(ruhanuiAppearance?.azimuthDegrees),
      sunAltitudeAtRuhanui: ruhanuiAppearance
        ? formatNumber(sunAltitudeAt(engine, ruhanuiAppearance.observedAt))
        : 'missing',
      newMoonsMatarikiToOfficialTangaroaStart: phaseCountBetween(
        newMoons,
        firstAppearanceDate,
        official.tangaroaStartsOn,
      ),
      fullMoonsMatarikiToOfficialTangaroaStart: phaseCountBetween(
        fullMoons,
        firstAppearanceDate,
        official.tangaroaStartsOn,
      ),
      firstNewMoonAfterMatariki,
      secondNewMoonAfterMatariki,
      thirdNewMoonAfterMatariki,
      firstFullMoonAfterMatariki,
      secondFullMoonAfterMatariki,
      thirdFullMoonAfterMatariki,
      lastNewMoonBeforeOfficialTangaroa: phaseLocalDate(
        lastNewMoonBeforeOfficialTangaroa,
      ),
      lastFullMoonBeforeOfficialTangaroa: phaseLocalDate(
        lastFullMoonBeforeOfficialTangaroa,
      ),
      officialTangaroaStartMinusSecondNewMoon: dateMinusReferenceDays(
        official.tangaroaStartsOn,
        secondNewMoonAfterMatariki,
      ),
      officialTangaroaStartMinusSecondFullMoon: dateMinusReferenceDays(
        official.tangaroaStartsOn,
        secondFullMoonAfterMatariki,
      ),
      officialTangaroaStartMinusThirdNewMoon: dateMinusReferenceDays(
        official.tangaroaStartsOn,
        thirdNewMoonAfterMatariki,
      ),
      officialTangaroaStartMinusThirdFullMoon: dateMinusReferenceDays(
        official.tangaroaStartsOn,
        thirdFullMoonAfterMatariki,
      ),
      currentRuhanuiSignal: ruhanuiRuleSignal(hamalYearNewMoonCount),
    });
  }

  return rows;
}

async function sourceCalendarRows(service: MaramatakaService): Promise<
  Array<{
    label: string;
    expectedPipiri: string;
    calculatedPipiri: string;
    expectedRuhanui: string;
    calculatedRuhanui: string;
    sourceMatarikiPeriod: string;
    calculatedHoliday: string;
    matchesSourceMonthPlacement: boolean;
  }>
> {
  const rows = [];

  for (const fixture of sourceCalendarFixtures) {
    const maramatakaYear = await service.getYear(
      location,
      new Date(`${fixture.date}T12:00:00+12:00`),
    );
    const pipiri = maramatakaYear.months.find(
      (month) =>
        month.name === 'Te Tahi o Pipiri' ||
        month.starMonth?.note?.sequence === 1,
    );
    const ruhanui = maramatakaYear.months.find(
      (month) => month.name === 'Ruhanui',
    );
    const holiday = maramatakaYear.events.find(
      (event) =>
        event.type === 'public-holiday' &&
        event.name === 'Matariki public holiday',
    );
    const calculatedPipiri = pipiri ? localDate(pipiri.startsAt) : 'missing';
    const calculatedRuhanui = ruhanui ? localDate(ruhanui.startsAt) : 'none';

    rows.push({
      label: fixture.label,
      expectedPipiri: fixture.pipiriStartsOn,
      calculatedPipiri,
      expectedRuhanui: fixture.ruhanuiStartsOn,
      calculatedRuhanui,
      sourceMatarikiPeriod: fixture.matarikiPeriod,
      calculatedHoliday: holiday ? localDate(holiday.occursAt) : 'missing',
      matchesSourceMonthPlacement:
        calculatedPipiri === fixture.pipiriStartsOn &&
        calculatedRuhanui === fixture.ruhanuiStartsOn,
    });
  }

  return rows;
}

async function main(): Promise<void> {
  const focus = process.argv
    .find((arg) => arg.startsWith('--focus='))
    ?.slice('--focus='.length);
  const provider = new CachedAstronomyProvider(
    new PersistentCachedAstronomyProvider(
      new AstronomyEngineProvider(),
      new FileAstronomyCacheStore(
        join(process.cwd(), '.cache', 'astronomy.json'),
      ),
    ),
  );
  const service = new MaramatakaService({ astronomyProvider: provider });
  const yearContexts = await officialYearContexts(service);
  const matarikiBehaviourRows = await officialMatarikiBehaviourRows(
    yearContexts,
    provider,
  );

  if (focus === 'matariki-visibility') {
    const markerOfficialDateRows = matarikiBehaviourRows.map((row) => ({
      year: row.year,
      status: row.holidayStatus,
      monthDelta: row.monthSelectionDelta,
      officialTangaroa: row.officialTangaroa,
      officialHoliday: row.officialHoliday,
      pipiriWhiro: row.pipiriWhiro,
      secondWhiro: row.secondWhiro,
      ruhanuiMonth: row.ruhanui,
      pipiriVisible: row.pipiriFirstAppearance,
      pipiriVsTangaroaStart: dateMinusReferenceDays(
        row.pipiriFirstAppearance,
        officialDates.get(row.year)?.tangaroaStartsOn ?? 'missing',
      ),
      matarikiVisible: row.matarikiFirstAppearance,
      matarikiVsTangaroaStart: row.matarikiMinusOfficialTangaroaStartDays,
      ruhanuiVisible: row.ruhanuiFirstAppearance,
      ruhanuiVsTangaroaStart: dateMinusReferenceDays(
        row.ruhanuiFirstAppearance,
        officialDates.get(row.year)?.tangaroaStartsOn ?? 'missing',
      ),
      currentRuhanuiSignal: row.currentRuhanuiSignal,
    }));
    const matarikiOfficialDateRows = matarikiBehaviourRows.map((row) => ({
      year: row.year,
      status: row.holidayStatus,
      monthDelta: row.monthSelectionDelta,
      officialTangaroa: row.officialTangaroa,
      officialHoliday: row.officialHoliday,
      matarikiVisible: row.matarikiFirstAppearance,
      vsTangaroaStart: row.matarikiMinusOfficialTangaroaStartDays,
      vsTangaroaEnd: row.matarikiMinusOfficialTangaroaEndDays,
      vsHoliday: row.matarikiMinusOfficialHolidayDays,
    }));
    const lunarAnchorRows = matarikiBehaviourRows.map((row) => ({
      year: row.year,
      status: row.holidayStatus,
      monthDelta: row.monthSelectionDelta,
      officialTangaroa: row.officialTangaroa,
      matarikiVisible: row.matarikiFirstAppearance,
      newMoonsToOfficialStart: row.newMoonsMatarikiToOfficialTangaroaStart,
      fullMoonsToOfficialStart: row.fullMoonsMatarikiToOfficialTangaroaStart,
      secondNewAfterMatariki: row.secondNewMoonAfterMatariki,
      startVsSecondNew: row.officialTangaroaStartMinusSecondNewMoon,
      thirdNewAfterMatariki: row.thirdNewMoonAfterMatariki,
      startVsThirdNew: row.officialTangaroaStartMinusThirdNewMoon,
      secondFullAfterMatariki: row.secondFullMoonAfterMatariki,
      startVsSecondFull: row.officialTangaroaStartMinusSecondFullMoon,
      thirdFullAfterMatariki: row.thirdFullMoonAfterMatariki,
      startVsThirdFull: row.officialTangaroaStartMinusThirdFullMoon,
      lastNewBeforeOfficial: row.lastNewMoonBeforeOfficialTangaroa,
      lastFullBeforeOfficial: row.lastFullMoonBeforeOfficialTangaroa,
    }));
    const outlierOfficialDateRows = matarikiOfficialDateRows.filter(
      (row) => row.monthDelta === 1,
    );
    const outlierMarkerRows = markerOfficialDateRows.filter(
      (row) => row.monthDelta === 1,
    );
    const outlierLunarAnchorRows = lunarAnchorRows.filter(
      (row) => row.monthDelta === 1,
    );

    console.log(
      'Pipiri / Matariki / Ruhanui visibility against official dates',
    );
    console.table(markerOfficialDateRows);
    console.log('Visibility ranges against official Tangaroa start');
    console.table([
      rangeSummary(markerOfficialDateRows, 'pipiriVsTangaroaStart'),
      rangeSummary(markerOfficialDateRows, 'matarikiVsTangaroaStart'),
      rangeSummary(markerOfficialDateRows, 'ruhanuiVsTangaroaStart'),
    ]);
    console.log('Visibility ranges for month-placement outliers');
    console.table(outlierMarkerRows);
    console.table([
      rangeSummary(outlierMarkerRows, 'pipiriVsTangaroaStart'),
      rangeSummary(outlierMarkerRows, 'matarikiVsTangaroaStart'),
      rangeSummary(outlierMarkerRows, 'ruhanuiVsTangaroaStart'),
    ]);
    console.log('Lunar anchors after Matariki against official Tangaroa');
    console.table(lunarAnchorRows);
    console.log('Lunar anchor ranges against official Tangaroa start');
    console.table([
      rangeSummary(lunarAnchorRows, 'newMoonsToOfficialStart'),
      rangeSummary(lunarAnchorRows, 'fullMoonsToOfficialStart'),
      rangeSummary(lunarAnchorRows, 'startVsSecondNew'),
      rangeSummary(lunarAnchorRows, 'startVsThirdNew'),
      rangeSummary(lunarAnchorRows, 'startVsSecondFull'),
      rangeSummary(lunarAnchorRows, 'startVsThirdFull'),
    ]);
    console.log('Potential second-Full-Moon trigger years');
    console.table(
      lunarAnchorRows.filter(
        (row) =>
          typeof row.startVsSecondFull === 'number' &&
          row.startVsSecondFull >= 7,
      ),
    );
    console.log('Lunar anchors for month-placement outliers');
    console.table(outlierLunarAnchorRows);
    console.table([
      rangeSummary(outlierLunarAnchorRows, 'newMoonsToOfficialStart'),
      rangeSummary(outlierLunarAnchorRows, 'fullMoonsToOfficialStart'),
      rangeSummary(outlierLunarAnchorRows, 'startVsSecondNew'),
      rangeSummary(outlierLunarAnchorRows, 'startVsThirdNew'),
      rangeSummary(outlierLunarAnchorRows, 'startVsSecondFull'),
      rangeSummary(outlierLunarAnchorRows, 'startVsThirdFull'),
    ]);
    console.log('Matariki first visibility against official dates');
    console.table(matarikiOfficialDateRows);
    console.log('Matariki visibility range against official dates');
    console.table([
      rangeSummary(matarikiOfficialDateRows, 'vsTangaroaStart'),
      rangeSummary(matarikiOfficialDateRows, 'vsTangaroaEnd'),
      rangeSummary(matarikiOfficialDateRows, 'vsHoliday'),
    ]);
    console.log('Matariki visibility range for month-placement outliers');
    console.table(outlierOfficialDateRows);
    console.table([
      rangeSummary(outlierOfficialDateRows, 'vsTangaroaStart'),
      rangeSummary(outlierOfficialDateRows, 'vsTangaroaEnd'),
      rangeSummary(outlierOfficialDateRows, 'vsHoliday'),
    ]);

    return;
  }

  const officialReport = officialComparisonRows(yearContexts);
  const officialRows = officialReport.rows;
  const sourceRows = await sourceCalendarRows(service);

  console.log('Official Matariki calibration report');
  console.table(officialRows);
  console.log('Official Tangaroa date coverage by generated maramataka');
  console.table(officialReport.details);
  console.log(
    `holiday matches ${
      officialRows.filter((row) => row.holidayStatus === 'MATCH').length
    }/${officialRows.length}`,
  );
  console.log(
    `holiday-month Tangaroa period matches ${
      officialRows.filter((row) => row.holidayMonthDelta === '0/0').length
    }/${officialRows.length}`,
  );
  console.log(
    `holiday-month Tangaroa contains official ${
      officialRows.filter((row) => row.holidayMonthContainsOfficial).length
    }/${officialRows.length}`,
  );
  console.log(
    `holiday-month Tangaroa overlaps official ${
      officialRows.filter((row) => row.holidayMonthOverlapsOfficial).length
    }/${officialRows.length}`,
  );
  console.log(
    `official Tangaroa dates land on generated target Tangaroa mata ${
      officialRows.filter((row) => row.officialTangaroaGeneratedMataAreTarget)
        .length
    }/${officialRows.length}`,
  );
  console.log('official Tangaroa boundary pattern counts');
  console.table(
    countBy(officialRows.map((row) => row.officialTangaroaBoundaryPattern)),
  );
  console.log('likely remaining difference counts');
  console.table(countBy(officialRows.map((row) => row.likelyDifference)));

  console.log('Matariki behaviour by official year');
  console.table(matarikiBehaviourRows);
  const matarikiOfficialDateRows = matarikiBehaviourRows.map((row) => ({
    year: row.year,
    status: row.holidayStatus,
    monthDelta: row.monthSelectionDelta,
    officialTangaroa: row.officialTangaroa,
    officialHoliday: row.officialHoliday,
    matarikiVisible: row.matarikiFirstAppearance,
    vsTangaroaStart: row.matarikiMinusOfficialTangaroaStartDays,
    vsTangaroaEnd: row.matarikiMinusOfficialTangaroaEndDays,
    vsHoliday: row.matarikiMinusOfficialHolidayDays,
  }));
  console.log('Matariki first visibility against official dates');
  console.table(matarikiOfficialDateRows);
  console.log('Matariki visibility range against official dates');
  console.table([
    rangeSummary(matarikiOfficialDateRows, 'vsTangaroaStart'),
    rangeSummary(matarikiOfficialDateRows, 'vsTangaroaEnd'),
    rangeSummary(matarikiOfficialDateRows, 'vsHoliday'),
  ]);
  console.log('Matariki visibility range for month-placement outliers');
  const outlierOfficialDateRows = matarikiOfficialDateRows.filter(
    (row) => row.monthDelta === 1,
  );
  console.table(outlierOfficialDateRows);
  console.table([
    rangeSummary(outlierOfficialDateRows, 'vsTangaroaStart'),
    rangeSummary(outlierOfficialDateRows, 'vsTangaroaEnd'),
    rangeSummary(outlierOfficialDateRows, 'vsHoliday'),
  ]);
  console.log('Matariki/Pipiri month-placement outliers');
  console.table(
    matarikiBehaviourRows.filter((row) => row.monthSelectionDelta === 1),
  );
  console.log('Pipiri / Whiro / Matariki / Ruhanui signal summary');
  console.table(
    matarikiBehaviourRows.map((row) => ({
      year: row.year,
      status: row.holidayStatus,
      monthDelta: row.monthSelectionDelta,
      selected: row.selectedMarama,
      bestTangaroa: row.bestOfficialTangaroaMarama,
      pipiriVisible: row.pipiriFirstAppearance,
      whiro: row.pipiriWhiro,
      secondWhiro: row.secondWhiro,
      matarikiVisible: row.matarikiFirstAppearance,
      matarikiVsWhiro: row.appearanceMinusPipiriDays,
      matarikiVsSecondWhiro: row.matarikiMinusSecondWhiroDays,
      ruhanuiVisible: row.ruhanuiFirstAppearance,
      ruhanuiVsWhiro: row.ruhanuiMinusWhiroDays,
      ruhanuiVsSecondWhiro: row.ruhanuiMinusSecondWhiroDays,
      ruhanuiStart: row.ruhanui,
    })),
  );
  console.log('Four-signal summary for month-placement outliers');
  console.table(
    matarikiBehaviourRows
      .filter((row) => row.monthSelectionDelta === 1)
      .map((row) => ({
        year: row.year,
        officialHoliday: row.officialHoliday,
        selected: row.selectedMarama,
        bestTangaroa: row.bestOfficialTangaroaMarama,
        pipiriVisible: row.pipiriFirstAppearance,
        whiro: row.pipiriWhiro,
        secondWhiro: row.secondWhiro,
        matarikiVisible: row.matarikiFirstAppearance,
        matarikiVsWhiro: row.appearanceMinusPipiriDays,
        matarikiVsSecondWhiro: row.matarikiMinusSecondWhiroDays,
        ruhanuiVisible: row.ruhanuiFirstAppearance,
        ruhanuiVsWhiro: row.ruhanuiMinusWhiroDays,
        ruhanuiVsSecondWhiro: row.ruhanuiMinusSecondWhiroDays,
      })),
  );
  console.log('Matariki behaviour grouped by current Ruhanui signal');
  console.table(
    countBy(matarikiBehaviourRows.map((row) => row.currentRuhanuiSignal)),
  );
  console.log('Matariki behaviour grouped by holiday status and month delta');
  console.table(
    countBy(
      matarikiBehaviourRows.map(
        (row) => `${row.holidayStatus} / ${row.monthSelectionDelta}`,
      ),
    ),
  );

  console.log('Living by the Stars source-calendar fixture comparison');
  console.table(sourceRows);
  console.log(
    `source-calendar month placement matches ${
      sourceRows.filter((row) => row.matchesSourceMonthPlacement).length
    }/${sourceRows.length}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
