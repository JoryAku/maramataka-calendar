import {
  formatIsoDateInTimezone,
  Location,
} from '@maramataka-calendar/astronomy';
import {
  MaramatakaCycleDetails,
  MaramatakaYear,
} from '@maramataka-calendar/maramataka-domain';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:3000/api';

type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

const DATE_KEYS = new Set([
  'anchorDate',
  'astronomicalOccursAt',
  'cycleStartsAt',
  'endsAt',
  'observedAt',
  'occursAt',
  'risesAt',
  'setsAt',
  'startsAt',
  'transitsAt',
]);

interface MaramatakaPageResponse {
  cycle: MaramatakaCycleDetails;
}

export class MaramatakaApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl = process.env.MARAMATAKA_API_BASE_URL) {
    this.baseUrl = (baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
  }

  async getYear(location: Location, at: Date): Promise<MaramatakaYear> {
    return this.get<MaramatakaYear>('maramataka/year', {
      ...locationQuery(location),
      date: formatIsoDateInTimezone(at, location.timezone),
    });
  }

  async getCycleDetails(
    location: Location,
    at: Date,
  ): Promise<MaramatakaCycleDetails> {
    const candidateDates = [
      formatIsoDateInTimezone(at, location.timezone),
      formatIsoDateInTimezone(addDays(at, 1), location.timezone),
      formatIsoDateInTimezone(addDays(at, -1), location.timezone),
    ];

    let firstCycle: MaramatakaCycleDetails | undefined;
    for (const date of candidateDates) {
      const page = await this.get<MaramatakaPageResponse>('maramataka/page', {
          ...locationQuery(location),
          date,
        });
      const { cycle } = page;
      firstCycle ??= cycle;

      if (
        cycle.anchors.whiro.occursAt.getTime() <= at.getTime() &&
        cycle.anchors.nextWhiro.occursAt.getTime() > at.getTime()
      ) {
        return cycle;
      }
    }

    if (firstCycle) {
      return firstCycle;
    }

    throw new Error('No cycle details returned by maramataka API');
  }

  private async get<T>(path: string, query: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      throw new Error(
        `Could not reach maramataka API at ${this.baseUrl}. Start the API server or set MARAMATAKA_API_BASE_URL. Cause: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (!response.ok) {
      throw new Error(
        `Maramataka API ${url.toString()} returned ${response.status}: ${await response.text()}`,
      );
    }

    return reviveDates((await response.json()) as JsonValue) as T;
  }
}

function locationQuery(location: Location): Record<string, string> {
  return {
    lat: String(location.latitude),
    lon: String(location.longitude),
    timezone: location.timezone,
  };
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function reviveDates(value: JsonValue, key?: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => reviveDates(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        reviveDates(entryValue, entryKey),
      ]),
    );
  }

  if (typeof value === 'string' && key && DATE_KEYS.has(key)) {
    return new Date(value);
  }

  return value;
}
