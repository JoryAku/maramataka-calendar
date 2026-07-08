import {
  AstronomyEngineProvider,
  CachedAstronomyProvider,
  createCacheFingerprint,
  FileAstronomyCacheStore,
  formatIsoDateInTimezone,
  Location,
  OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
  parseLocalDateTimeInTimezone,
  PersistentCachedAstronomyProvider,
  RAW_ASTRONOMY_CACHE_METADATA,
  StarMarkerDefinition,
} from '@maramataka-calendar/astronomy';
import {
  createMaramatakaRuleSetCacheMetadata,
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
  MaramatakaCycleDetails,
  MaramatakaMonth,
  MaramatakaYearMonth,
} from '@maramataka-calendar/maramataka-domain';
import { join } from 'node:path';
import { MaramatakaApiClient } from './maramataka-api-client';

type AstronomyEngineModule = typeof import('astronomy-engine');

interface CliOptions {
  [key: string]: string | boolean | undefined;
}

type DawnMode = 'sampled-dawn' | 'dawn-rising';

const DEFAULT_LOCATION = {
  name: 'Wellington',
  latitude: -41.2865,
  longitude: 174.7762,
  timezone: 'Pacific/Auckland',
};

const OFFICIAL_MATARIKI_DATES = new Map<
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

const TANGAROA_TARGET_MATA = new Set(
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday
    ?.targetMataNames ?? [
    'Tangaroa-ā-mua',
    'Tangaroa-ā-roto',
    'Tangaroa-whakapau',
    'Tangaroa whāriki kio-kio',
  ],
);

function cacheFingerprintReport() {
  const maramatakaRuleSetMetadata = createMaramatakaRuleSetCacheMetadata(
    LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
  );

  return {
    fingerprints: {
      rawAstronomy: createCacheFingerprint(RAW_ASTRONOMY_CACHE_METADATA),
      observationalAstronomy: createCacheFingerprint(
        OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
      ),
      maramatakaRules: createCacheFingerprint(maramatakaRuleSetMetadata),
    },
    metadata: {
      rawAstronomy: RAW_ASTRONOMY_CACHE_METADATA,
      observationalAstronomy: OBSERVATIONAL_ASTRONOMY_CACHE_METADATA,
      maramatakaRules: maramatakaRuleSetMetadata,
    },
  };
}

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const [command = 'help', ...rest] = argv;
  const options: CliOptions = {};

  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = item.slice(2).split('=', 2);
    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const next = rest[index + 1];
    if (next && !next.startsWith('--')) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }

  return { command, options };
}

function locationFromOptions(options: CliOptions): Location & { name: string } {
  return {
    name: stringOption(options, 'location', DEFAULT_LOCATION.name),
    latitude: numberOption(options, 'lat', DEFAULT_LOCATION.latitude),
    longitude: numberOption(options, 'lon', DEFAULT_LOCATION.longitude),
    timezone: stringOption(options, 'timezone', DEFAULT_LOCATION.timezone),
  };
}

function stringOption(
  options: CliOptions,
  key: string,
  fallback?: string,
): string {
  const value = options[key];
  if (typeof value === 'string') {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing --${key}`);
}

function numberOption(
  options: CliOptions,
  key: string,
  fallback?: number,
): number {
  const value = options[key];
  if (typeof value === 'string') {
    return Number(value);
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing --${key}`);
}

function markerDefinitions(): StarMarkerDefinition[] {
  const markers = [
    ...(LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.yearStartRule
      ? [LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.yearStartRule.marker]
      : []),
    ...(LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers ??
      []),
    ...(LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday
      ?.calibrationMarker
      ? [
          LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday
            .calibrationMarker,
        ]
      : []),
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

function selectMarkers(options: CliOptions): StarMarkerDefinition[] {
  const markerName = stringOption(options, 'marker', 'all').toLowerCase();
  const markers = markerDefinitions();

  if (markerName === 'all') {
    return markers;
  }

  const marker = markers.find(
    (candidate) =>
      candidate.id.toLowerCase() === markerName ||
      candidate.name.toLowerCase() === markerName ||
      candidate.englishName?.toLowerCase() === markerName,
  );

  if (!marker) {
    throw new Error(
      `Unknown marker "${markerName}". Known markers: ${markers
        .map((candidate) => candidate.id)
        .join(', ')}`,
    );
  }

  return [marker];
}

function localDateFromOptions(options: CliOptions, location: Location): string {
  if (typeof options.date === 'string') {
    return options.date;
  }

  if (typeof options.at === 'string') {
    return formatIsoDateInTimezone(
      parseDateTime(options.at, location),
      location.timezone,
    );
  }

  return formatIsoDateInTimezone(new Date(), location.timezone);
}

function parseDateTime(input: string, location: Location): Date {
  if (input.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(input)) {
    return new Date(input);
  }

  const match = input.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (!match) {
    throw new Error(
      `Invalid date/time "${input}". Use YYYY-MM-DD, YYYY-MM-DDTHH:mm, or an ISO instant.`,
    );
  }

  return parseLocalDateTimeInTimezone(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: Number(match[4] ?? '12'),
      minute: Number(match[5] ?? '0'),
      second: Number(match[6] ?? '0'),
    },
    location.timezone,
  );
}

function formatLocal(date: Date | undefined, timezone: string): string {
  if (!date) {
    return 'missing';
  }

  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function localHour(date: Date, timezone: string): number {
  const hour = new Intl.DateTimeFormat('en-NZ', {
    timeZone: timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour')?.value;

  return Number(hour ?? '0');
}

function formatDate(date: Date, timezone: string): string {
  return formatIsoDateInTimezone(date, timezone);
}

function round(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

function directionFromAzimuth(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const normalized = ((azimuth % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % directions.length];
}

function visibilityFromAltitude(altitude: number): string {
  if (altitude >= 20) {
    return 'prominent';
  }
  if (altitude >= 5) {
    return 'visible';
  }
  if (altitude >= 0) {
    return 'low';
  }
  return 'below-horizon';
}

function dawnModeFromOptions(options: CliOptions): DawnMode {
  const mode = stringOption(options, 'mode', 'sampled-dawn');
  if (mode === 'sampled-dawn' || mode === 'dawn-rising') {
    return mode;
  }

  throw new Error('Invalid --mode. Use sampled-dawn or dawn-rising.');
}

function observer(engine: AstronomyEngineModule, location: Location) {
  return new engine.Observer(location.latitude, location.longitude, 0);
}

function equatorialCoordinates(
  engine: AstronomyEngineModule,
  marker: StarMarkerDefinition,
  at: Date,
  location: Location,
) {
  if (marker.representative.kind === 'fixed-equatorial') {
    return {
      ra: marker.representative.rightAscensionHours,
      dec: marker.representative.declinationDegrees,
    };
  }

  return engine.Equator(
    engine.Body[marker.representative.body],
    at,
    observer(engine, location),
    true,
    true,
  );
}

function markerPosition(
  engine: AstronomyEngineModule,
  marker: StarMarkerDefinition,
  at: Date,
  location: Location,
) {
  const coordinates = equatorialCoordinates(engine, marker, at, location);
  const horizon = engine.Horizon(
    at,
    observer(engine, location),
    coordinates.ra,
    coordinates.dec,
    'normal',
  );

  return {
    id: marker.id,
    name: marker.name,
    englishName: marker.englishName ?? '',
    type: marker.type,
    localTime: formatLocal(at, location.timezone),
    altitude: round(horizon.altitude),
    azimuth: round(horizon.azimuth),
    direction: directionFromAzimuth(horizon.azimuth),
    visibility: visibilityFromAltitude(horizon.altitude),
  };
}

function bodyPosition(
  engine: AstronomyEngineModule,
  bodyName: string,
  at: Date,
  location: Location,
) {
  const body = engine.Body[bodyName as keyof typeof engine.Body];
  if (!body) {
    throw new Error(`Unknown Astronomy Engine body: ${bodyName}`);
  }

  const coordinates = engine.Equator(
    body,
    at,
    observer(engine, location),
    true,
    true,
  );
  const horizon = engine.Horizon(
    at,
    observer(engine, location),
    coordinates.ra,
    coordinates.dec,
    'normal',
  );

  return {
    body: bodyName,
    localTime: formatLocal(at, location.timezone),
    altitude: round(horizon.altitude),
    azimuth: round(horizon.azimuth),
    direction: directionFromAzimuth(horizon.azimuth),
    visibility: visibilityFromAltitude(horizon.altitude),
  };
}

function sunAltitude(
  engine: AstronomyEngineModule,
  at: Date,
  location: Location,
): number {
  return bodyPosition(engine, 'Sun', at, location).altitude;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function overlapDays(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
): number {
  const firstStartTime = Date.parse(`${firstStart}T12:00:00Z`);
  const firstEndTime = Date.parse(`${firstEnd}T12:00:00Z`);
  const secondStartTime = Date.parse(`${secondStart}T12:00:00Z`);
  const secondEndTime = Date.parse(`${secondEnd}T12:00:00Z`);
  const start = Math.max(firstStartTime, secondStartTime);
  const end = Math.min(firstEndTime, secondEndTime);

  return Math.max(0, Math.round((end - start) / 86_400_000) + 1);
}

function localDayBounds(
  date: string,
  location: Location,
): {
  startsAt: Date;
  endsAt: Date;
} {
  const start = parseDateTime(`${date}T00:00:00`, location);
  return {
    startsAt: start,
    endsAt: parseDateTime(`${addDays(date, 1)}T00:00:00`, location),
  };
}

function dawnObservationWindow(
  engine: AstronomyEngineModule,
  date: string,
  location: Location,
): { astronomicalDawn: Date; nauticalDawn: Date; sunrise: Date } {
  const obs = observer(engine, location);
  const startsAt = localDayBounds(date, location).startsAt;
  const astronomicalDawn = engine.SearchAltitude(
    engine.Body.Sun,
    obs,
    1,
    startsAt,
    1,
    -18,
  )?.date;
  const nauticalDawn = astronomicalDawn
    ? engine.SearchAltitude(engine.Body.Sun, obs, 1, astronomicalDawn, 1, -12)
        ?.date
    : null;
  const sunrise = astronomicalDawn
    ? engine.SearchAltitude(engine.Body.Sun, obs, 1, astronomicalDawn, 1, 0)
        ?.date
    : null;

  if (!astronomicalDawn || !nauticalDawn || !sunrise) {
    throw new Error(`No dawn data found for ${date}`);
  }

  return { astronomicalDawn, nauticalDawn, sunrise };
}

function sampledDawnRows(
  engine: AstronomyEngineModule,
  date: string,
  location: Location,
  marker: StarMarkerDefinition,
) {
  const window = dawnObservationWindow(engine, date, location);
  const at = new Date(
    (window.astronomicalDawn.getTime() + window.nauticalDawn.getTime()) / 2,
  );
  const sun = sunAltitude(engine, at, location);
  const markerAt = markerPosition(engine, marker, at, location);
  const inNorthToSouthField = markerAt.azimuth >= 0 && markerAt.azimuth <= 180;
  const passes = markerAt.altitude >= 0;

  return [
    {
      mode: 'sampled-dawn',
      rule: 'Sun halfway between -18° and -12°',
      localTime: formatLocal(at, location.timezone),
      sunAltitude: sun,
      markerAltitude: markerAt.altitude,
      markerAzimuth: markerAt.azimuth,
      direction: markerAt.direction,
      inNorthToSouthField,
      passes,
      reason: passes ? 'passes' : 'below altitude threshold',
    },
  ];
}

function dawnRisingRows(
  engine: AstronomyEngineModule,
  date: string,
  location: Location,
  marker: StarMarkerDefinition,
) {
  const config = marker.dawnRising ?? {
    startSunAltitudeDegrees: -18,
    endSunAltitudeDegrees: 0,
    minimumMarkerAltitudeDegrees: 0,
    minimumAzimuthDegrees: 0,
    maximumAzimuthDegrees: 180,
    sampleMinutes: 5,
  };
  const bounds = localDayBounds(date, location);
  const rows = [];
  let at = bounds.startsAt;

  while (at.getTime() < bounds.endsAt.getTime()) {
    const sun = sunAltitude(engine, at, location);
    if (
      localHour(at, location.timezone) < 12 &&
      sun >= config.startSunAltitudeDegrees &&
      sun <= config.endSunAltitudeDegrees
    ) {
      const markerAt = markerPosition(engine, marker, at, location);
      const passes =
        markerAt.altitude >= config.minimumMarkerAltitudeDegrees &&
        markerAt.azimuth >= config.minimumAzimuthDegrees &&
        markerAt.azimuth <= config.maximumAzimuthDegrees;

      rows.push({
        mode: 'dawn-rising',
        rule: `Sun ${config.startSunAltitudeDegrees}° to ${config.endSunAltitudeDegrees}°`,
        localTime: formatLocal(at, location.timezone),
        sunAltitude: sun,
        markerAltitude: markerAt.altitude,
        markerAzimuth: markerAt.azimuth,
        direction: markerAt.direction,
        inNorthToSouthField: markerAt.azimuth >= 0 && markerAt.azimuth <= 180,
        passes,
        reason: passes ? 'passes' : failureReason(markerAt, sun, config),
      });
    }

    at = addMinutes(at, config.sampleMinutes);
  }

  return rows;
}

function dawnRows(
  engine: AstronomyEngineModule,
  date: string,
  location: Location,
  marker: StarMarkerDefinition,
  mode: DawnMode,
) {
  return mode === 'sampled-dawn'
    ? sampledDawnRows(engine, date, location, marker)
    : dawnRisingRows(engine, date, location, marker);
}

function failureReason(
  markerAt: { altitude: number; azimuth: number },
  sun: number,
  config: {
    startSunAltitudeDegrees: number;
    endSunAltitudeDegrees: number;
    minimumMarkerAltitudeDegrees: number;
    minimumAzimuthDegrees: number;
    maximumAzimuthDegrees: number;
  },
): string {
  const reasons = [];
  if (sun < config.startSunAltitudeDegrees) {
    reasons.push('too early/dark');
  }
  if (sun > config.endSunAltitudeDegrees) {
    reasons.push('too late/light');
  }
  if (markerAt.altitude < config.minimumMarkerAltitudeDegrees) {
    reasons.push('below altitude threshold');
  }
  if (
    markerAt.azimuth < config.minimumAzimuthDegrees ||
    markerAt.azimuth > config.maximumAzimuthDegrees
  ) {
    reasons.push('outside azimuth band');
  }

  return reasons.join(', ') || 'fails';
}

function provider() {
  return new CachedAstronomyProvider(
    new PersistentCachedAstronomyProvider(
      new AstronomyEngineProvider(),
      new FileAstronomyCacheStore(
        join(process.cwd(), '.cache', 'astronomy.json'),
      ),
    ),
  );
}

function maramatakaApi() {
  return new MaramatakaApiClient();
}

async function detailedMonthForYearMonth(
  api: MaramatakaApiClient,
  location: Location,
  yearMonth: MaramatakaYearMonth,
): Promise<MaramatakaMonth> {
  const cycle = await api.getCycleDetails(
    location,
    yearMonth.anchors.whiro.astronomicalOccursAt ??
      yearMonth.anchors.whiro.occursAt,
  );

  if (!cycle) {
    throw new Error(`No cycle details found for ${yearMonth.name}`);
  }

  return monthFromCycle(cycle);
}

async function detailedMonthForDate(
  api: MaramatakaApiClient,
  location: Location,
  at: Date,
): Promise<MaramatakaMonth> {
  const cycle = await api.getCycleDetails(location, at);

  if (!cycle) {
    throw new Error(
      `No cycle details found for ${formatLocal(at, location.timezone)}`,
    );
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

function findNight(month: MaramatakaMonth, at: Date) {
  return month.nights.find(
    (night) =>
      night.startsAt.getTime() <= at.getTime() &&
      night.endsAt.getTime() > at.getTime(),
  );
}

async function inspectSky(options: CliOptions) {
  const location = locationFromOptions(options);
  const at = parseDateTime(stringOption(options, 'at'), location);
  const engine = await import('astronomy-engine');
  const rows = [];
  const body = typeof options.body === 'string' ? options.body : undefined;

  if (body) {
    rows.push(bodyPosition(engine, body, at, location));
  } else {
    rows.push(
      ...selectMarkers(options).map((marker) =>
        markerPosition(engine, marker, at, location),
      ),
    );
  }

  console.log(`Sky position at ${formatLocal(at, location.timezone)}`);
  console.log(
    `${location.name}: ${location.latitude}, ${location.longitude}, ${location.timezone}`,
  );
  console.table(rows);
  console.table([
    bodyPosition(engine, 'Sun', at, location),
    bodyPosition(engine, 'Moon', at, location),
  ]);
}

async function inspectDawn(options: CliOptions) {
  const location = locationFromOptions(options);
  const date = localDateFromOptions(options, location);
  const mode = dawnModeFromOptions(options);
  const engine = await import('astronomy-engine');
  const markers = selectMarkers(options);

  for (const marker of markers) {
    const rows = dawnRows(engine, date, location, marker, mode);
    const firstPass = rows.find((row) => row.passes);
    console.log(`Dawn visibility: ${marker.name} on ${date} (${mode})`);
    console.table([
      {
        rule: rows[0]?.rule ?? 'missing',
        samples: rows.length,
        firstPass: firstPass?.localTime ?? 'none',
        firstPassSunAltitude: firstPass?.sunAltitude ?? 'n/a',
        firstPassMarkerAltitude: firstPass?.markerAltitude ?? 'n/a',
        firstPassMarkerAzimuth: firstPass?.markerAzimuth ?? 'n/a',
        firstPassInNorthToSouthField: firstPass?.inNorthToSouthField ?? 'n/a',
      },
    ]);
    console.table(rows.filter((row) => row.passes).slice(0, 10));
  }
}

async function debugFirstAppearance(options: CliOptions) {
  const location = locationFromOptions(options);
  const year = numberOption(options, 'year');
  const mode = dawnModeFromOptions(options);
  const engine = await import('astronomy-engine');
  const markers = selectMarkers(options);
  const start = stringOption(options, 'start', `${year}-01-01`);
  const end = stringOption(options, 'end', `${year + 1}-01-01`);
  const rangeRows = [];

  for (const marker of markers) {
    let firstDate = 'missing';
    let date = start;
    while (date < end) {
      const firstPass = dawnRows(engine, date, location, marker, mode).find(
        (row) => row.passes,
      );
      if (firstPass) {
        firstDate = date;
        break;
      }

      date = addDays(date, 1);
    }

    const windowStart =
      firstDate === 'missing' ? start : addDays(firstDate, -3);
    const windowEnd =
      firstDate === 'missing' ? addDays(start, 7) : addDays(firstDate, 4);
    date = windowStart;
    while (date < windowEnd) {
      const rows = dawnRows(engine, date, location, marker, mode);
      const first = rows[0];
      const pass = rows.find((row) => row.passes);
      const closest =
        pass ??
        [...rows].sort(
          (a, b) => Math.abs(a.markerAltitude) - Math.abs(b.markerAltitude),
        )[0];

      rangeRows.push({
        marker: marker.name,
        mode,
        rule: closest?.rule ?? first?.rule ?? 'missing',
        date,
        firstAppearanceDate: firstDate,
        sample: closest?.localTime ?? first?.localTime ?? 'missing',
        sunAltitude: closest?.sunAltitude ?? 'missing',
        markerAltitude: closest?.markerAltitude ?? 'missing',
        markerAzimuth: closest?.markerAzimuth ?? 'missing',
        inNorthToSouthField:
          closest?.inNorthToSouthField ?? first?.inNorthToSouthField ?? '',
        passes: Boolean(pass),
        reason: pass ? 'passes' : (closest?.reason ?? 'no dawn samples'),
      });
      date = addDays(date, 1);
    }
  }

  console.table(rangeRows);
}

async function inspectMaramaBoundary(options: CliOptions) {
  const location = locationFromOptions(options);
  const at = parseDateTime(
    typeof options.at === 'string'
      ? options.at
      : `${localDateFromOptions(options, location)}T12:00:00`,
    location,
  );
  const api = maramatakaApi();
  const month = await detailedMonthForDate(api, location, at);
  const night = findNight(month, at);

  console.log(
    `Marama boundary inspector for ${formatLocal(at, location.timezone)}`,
  );
  console.table([
    {
      monthStartsAt: formatLocal(month.whiroStartsAt, location.timezone),
      monthEndsAt: formatLocal(
        month.nights[month.nights.length - 1]?.endsAt,
        location.timezone,
      ),
      nights: month.nights.length,
      overlappingMata:
        month.nights
          .flatMap(
            (entry) =>
              entry.overlappingMata?.map((overlap) => overlap.mata.name) ?? [],
          )
          .join(', ') || 'none',
      currentMata: night?.mata.name ?? 'outside generated nights',
      currentMataStartsAt: formatLocal(night?.startsAt, location.timezone),
      currentMataEndsAt: formatLocal(night?.endsAt, location.timezone),
      starMonthSequence: month.starMonthSequence ?? 'missing',
    },
  ]);
  console.table(
    month.nights.map((entry, index) => ({
      index: index + 1,
      mata: entry.mata.name,
      phaseGroup: entry.mata.phaseGroup?.name ?? '',
      startsAt: formatLocal(entry.startsAt, location.timezone),
      endsAt: formatLocal(entry.endsAt, location.timezone),
    })),
  );
}

async function traceYear(options: CliOptions) {
  const location = locationFromOptions(options);
  const year = numberOption(options, 'year');
  const api = maramatakaApi();
  const maramatakaYear = await api.getYear(
    location,
    parseDateTime(`${year}-07-01T12:00:00`, location),
  );

  console.log(`Year construction trace: ${year}`);
  console.table([
    {
      generatedYear: maramatakaYear.year,
      startsAt: formatLocal(maramatakaYear.startsAt, location.timezone),
      endsAt: formatLocal(maramatakaYear.endsAt, location.timezone),
      months: maramatakaYear.months.length,
      ruleSet: maramatakaYear.ruleSet.name,
    },
  ]);
  console.table(
    maramatakaYear.months.map((month) => ({
      sequence: month.sequence,
      name: month.name,
      startsAt: formatLocal(month.startsAt, location.timezone),
      endsAt: formatLocal(month.endsAt, location.timezone),
      nights: month.nightsCount,
      starMonthSequence: month.starMonth?.note?.sequence ?? '',
      markers: month.starMonth?.note?.markerIds.join(', ') ?? '',
    })),
  );
  console.table(
    maramatakaYear.events
      .filter((event) =>
        [
          'star-appearance',
          'star-invisibility',
          'public-holiday',
          'solar-season',
        ].includes(event.type),
      )
      .map((event) => ({
        type: event.type,
        name: event.name,
        occursAt: formatLocal(event.occursAt, location.timezone),
        month: event.monthName ?? '',
        source: event.source,
      })),
  );
}

async function exploreHoliday(options: CliOptions) {
  const location = locationFromOptions(options);
  const year = numberOption(options, 'year');
  const official = OFFICIAL_MATARIKI_DATES.get(year);
  const api = maramatakaApi();
  const maramatakaYear = await api.getYear(
    location,
    parseDateTime(`${year}-07-01T12:00:00`, location),
  );
  const rows = [];

  for (const yearMonth of maramatakaYear.months) {
    const month = await detailedMonthForYearMonth(api, location, yearMonth);
    const tangaroaNights = month.nights.filter((night) =>
      TANGAROA_TARGET_MATA.has(night.mata.name),
    );
    const first = tangaroaNights[0];
    const last = tangaroaNights[tangaroaNights.length - 1];
    if (!first || !last) {
      continue;
    }

    rows.push({
      sequence: yearMonth.sequence,
      marama: yearMonth.name,
      tangaroa: `${formatDate(first.startsAt, location.timezone)}..${formatDate(last.startsAt, location.timezone)}`,
      officialTangaroa: official
        ? `${official.tangaroaStartsOn}..${official.tangaroaEndsOn}`
        : 'none',
      overlapDays: official
        ? overlapDays(
            formatDate(first.startsAt, location.timezone),
            formatDate(last.startsAt, location.timezone),
            official.tangaroaStartsOn,
            official.tangaroaEndsOn,
          )
        : 'n/a',
      containsOfficialHoliday: official
        ? official.holiday >=
            formatDate(yearMonth.startsAt, location.timezone) &&
          official.holiday < formatDate(yearMonth.endsAt, location.timezone)
        : 'n/a',
    });
  }

  const holiday = maramatakaYear.events.find(
    (event) =>
      event.type === 'public-holiday' &&
      event.name === 'Matariki public holiday',
  );

  console.log(`Holiday calibration explorer: ${year}`);
  console.table([
    {
      officialHoliday: official?.holiday ?? 'none',
      calculatedHoliday: formatDate(
        holiday?.occursAt ?? parseDateTime(`${year}-01-01T00:00`, location),
        location.timezone,
      ),
      selectedMarama: holiday?.monthName ?? 'missing',
    },
  ]);
  console.table(rows);
}

async function explainEventPlacement(options: CliOptions) {
  const location = locationFromOptions(options);
  const at = parseDateTime(stringOption(options, 'at'), location);
  const api = maramatakaApi();
  const maramatakaYear = await api.getYear(location, at);
  const yearMonth = maramatakaYear.months.find(
    (month) =>
      month.startsAt.getTime() <= at.getTime() &&
      month.endsAt.getTime() > at.getTime(),
  );
  const month = yearMonth
    ? await detailedMonthForYearMonth(api, location, yearMonth)
    : await detailedMonthForDate(api, location, at);
  const night = findNight(month, at);

  console.log(`Event placement: ${formatLocal(at, location.timezone)}`);
  console.table([
    {
      year: maramatakaYear.year,
      marama: yearMonth?.name ?? 'from month lookup',
      maramaSequence: yearMonth?.sequence ?? '',
      mata: night?.mata.name ?? 'outside generated nights',
      mataPhaseGroup: night?.mata.phaseGroup?.name ?? '',
      mataStartsAt: formatLocal(night?.startsAt, location.timezone),
      mataEndsAt: formatLocal(night?.endsAt, location.timezone),
    },
  ]);
  console.table(
    maramatakaYear.events
      .filter(
        (event) =>
          Math.abs(event.occursAt.getTime() - at.getTime()) <=
          3 * 24 * 60 * 60 * 1000,
      )
      .map((event) => ({
        type: event.type,
        name: event.name,
        occursAt: formatLocal(event.occursAt, location.timezone),
        month: event.monthName ?? '',
      })),
  );
}

function usage() {
  console.log(`Maramataka diagnostics

Commands:
  sky-position       --at YYYY-MM-DDTHH:mm [--marker matariki|all] [--body Sun|Moon|Venus]
  dawn-visibility    --date YYYY-MM-DD --marker matariki|all [--mode sampled-dawn|dawn-rising]
  first-appearance   --year 2026 --marker matariki [--start YYYY-MM-DD --end YYYY-MM-DD] [--mode sampled-dawn|dawn-rising]
  marama-boundary    --date YYYY-MM-DD | --at YYYY-MM-DDTHH:mm
  year-trace         --year 2026
  holiday-explorer   --year 2026
  event-placement    --at YYYY-MM-DDTHH:mm
  cache-fingerprints

Location options:
  --lat -41.2865 --lon 174.7762 --timezone Pacific/Auckland --location Wellington
`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  switch (command) {
    case 'sky-position':
      await inspectSky(options);
      break;
    case 'dawn-visibility':
      await inspectDawn(options);
      break;
    case 'first-appearance':
      await debugFirstAppearance(options);
      break;
    case 'marama-boundary':
      await inspectMaramaBoundary(options);
      break;
    case 'year-trace':
      await traceYear(options);
      break;
    case 'holiday-explorer':
      await exploreHoliday(options);
      break;
    case 'event-placement':
      await explainEventPlacement(options);
      break;
    case 'cache-fingerprints':
      console.log(JSON.stringify(cacheFingerprintReport(), null, 2));
      break;
    default:
      usage();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
