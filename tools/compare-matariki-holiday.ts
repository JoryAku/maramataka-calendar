import {
  AstronomyEngineProvider,
  CachedAstronomyProvider,
  FileAstronomyCacheStore,
  PersistentCachedAstronomyProvider,
} from '@maramataka-calendar/astronomy';
import {
  MaramatakaMonth,
  MaramatakaService,
} from '@maramataka-calendar/maramataka-domain';
import { join } from 'node:path';

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

const holidayTangaroaTargetMata = new Set([
  'Tangaroa-ā-mua',
  'Tangaroa-ā-roto',
  'Tangaroa-whakapau',
  'Tangaroa whāriki kio-kio',
]);

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
  return localDateFormatter.format(date);
}

function localDateOrdinal(date: string): number {
  const [year, month, day] = date
    .split('-')
    .map((part) => Number.parseInt(part, 10));

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function dateRange(start: string, end: string): string {
  return `${start}..${end}`;
}

function dateRangeDelta(
  calculatedStart: string,
  calculatedEnd: string,
  officialStart: string,
  officialEnd: string,
): string {
  return `${localDateOrdinal(calculatedStart) - localDateOrdinal(
    officialStart,
  )}/${localDateOrdinal(calculatedEnd) - localDateOrdinal(officialEnd)}`;
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
  return service.getMonth(
    location,
    yearMonth.anchors.whiro.astronomicalOccursAt ??
      yearMonth.anchors.whiro.occursAt,
  );
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

async function officialComparisonRows(service: MaramatakaService): Promise<
  Array<{
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
  }>
> {
  const rows = [];

  for (const [year, official] of officialDates) {
    const maramatakaYear = await service.getYear(
      location,
      new Date(`${year}-07-01T12:00:00+12:00`),
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
    const holidayMonth = holidayYearMonth
      ? await detailedMonthForYearMonth(service, holidayYearMonth)
      : undefined;
    const holidayTangaroa = holidayMonth
      ? tangaroaPeriod(holidayMonth)
      : undefined;
    const holidayTangaroaStart = holidayTangaroa?.startsOn ?? 'missing';
    const holidayTangaroaEnd = holidayTangaroa?.endsOn ?? 'missing';

    rows.push({
      year,
      officialHoliday: official.holiday,
      calculatedHoliday,
      holidayStatus:
        calculatedHoliday === official.holiday ? 'MATCH' : 'DIFF',
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
      holidayMonthOverlapsOfficial:
        holidayTangaroaStart !== 'missing' &&
        overlapsDateRange(
          holidayTangaroaStart,
          holidayTangaroaEnd,
          official.tangaroaStartsOn,
          official.tangaroaEndsOn,
        ),
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
  const provider = new CachedAstronomyProvider(
    new PersistentCachedAstronomyProvider(
      new AstronomyEngineProvider(),
      new FileAstronomyCacheStore(
        join(process.cwd(), '.cache', 'astronomy.json'),
      ),
    ),
  );
  const service = new MaramatakaService({ astronomyProvider: provider });
  const officialRows = await officialComparisonRows(service);
  const sourceRows = await sourceCalendarRows(service);

  console.log('Official Matariki holiday comparison');
  console.table(officialRows);
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
