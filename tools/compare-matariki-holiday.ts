import {
  AstronomyEngineProvider,
  CachedAstronomyProvider,
  FileAstronomyCacheStore,
  PersistentCachedAstronomyProvider,
} from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';
import { join } from 'node:path';

const officialDates = new Map<number, string>([
  [2022, '2022-06-24'],
  [2023, '2023-07-14'],
  [2024, '2024-06-28'],
  [2025, '2025-06-20'],
  [2026, '2026-07-10'],
  [2027, '2027-06-25'],
  [2028, '2028-07-14'],
  [2029, '2029-07-06'],
  [2030, '2030-06-21'],
  [2031, '2031-07-11'],
  [2032, '2032-07-02'],
  [2033, '2033-06-24'],
  [2034, '2034-07-07'],
  [2035, '2035-06-29'],
  [2036, '2036-07-18'],
  [2037, '2037-07-10'],
  [2038, '2038-06-25'],
  [2039, '2039-07-15'],
  [2040, '2040-07-06'],
  [2041, '2041-07-19'],
  [2042, '2042-07-11'],
  [2043, '2043-07-03'],
  [2044, '2044-06-24'],
  [2045, '2045-07-07'],
  [2046, '2046-06-29'],
  [2047, '2047-07-19'],
  [2048, '2048-07-03'],
  [2049, '2049-06-25'],
  [2050, '2050-07-15'],
  [2051, '2051-06-30'],
  [2052, '2052-06-21'],
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
const dayMs = 24 * 60 * 60 * 1000;

function localDate(date: Date): string {
  return localDateFormatter.format(date);
}

function deltaDays(calculated: string, official: string): number {
  return Math.round(
    (new Date(`${calculated}T00:00:00+12:00`).getTime() -
      new Date(`${official}T00:00:00+12:00`).getTime()) /
      dayMs,
  );
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
    const calculated = holiday ? localDate(holiday.occursAt) : 'missing';
    const delta =
      calculated === 'missing' ? undefined : deltaDays(calculated, official);

    rows.push({
      year,
      official,
      calculated,
      deltaDays: delta,
      status: calculated === official ? 'MATCH' : 'DIFF',
      months: maramatakaYear.months.length,
    });
  }

  console.table(rows);
  const matches = rows.filter((row) => row.status === 'MATCH').length;
  console.log(`matches ${matches}/${rows.length}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
