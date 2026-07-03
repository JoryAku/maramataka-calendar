export interface LocalDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

const HOUR_MS = 60 * 60 * 1000;

export function validateIanaTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-NZ', { timeZone: timezone }).format(new Date());
  } catch {
    throw new Error(`Invalid IANA timezone: ${timezone}`);
  }
}

export function getTimezoneOffsetHours(timezone: string, date: Date): number {
  validateIanaTimezone(timezone);

  const formatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const timezoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  if (!timezoneName) {
    throw new Error(`No timezone offset found for ${timezone}`);
  }

  if (timezoneName === 'GMT') {
    return 0;
  }

  const match = timezoneName.match(
    /^GMT([+-])(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?$/,
  );
  if (!match) {
    throw new Error(`Invalid timezone offset format: ${timezoneName}`);
  }

  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  const seconds = Number(match[4] ?? '0');

  return sign * (hours + minutes / 60 + seconds / 3600);
}

export function formatIsoDateInTimezone(date: Date, timezone: string): string {
  validateIanaTimezone(timezone);

  const formatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error(`Could not format date in timezone: ${timezone}`);
  }

  return `${year}-${month}-${day}`;
}

export function parseLocalDateTimeInTimezone(
  dateTimeParts: LocalDateTimeParts,
  timezone: string,
): Date {
  validateIanaTimezone(timezone);

  const localDateTimeAsUtcMs = Date.UTC(
    dateTimeParts.year,
    dateTimeParts.month - 1,
    dateTimeParts.day,
    dateTimeParts.hour,
    dateTimeParts.minute,
    dateTimeParts.second ?? 0,
  );
  const candidateOffsets = new Set<number>();

  for (const probeTime of [-24 * HOUR_MS, 0, 24 * HOUR_MS]) {
    candidateOffsets.add(
      getTimezoneOffsetHours(
        timezone,
        new Date(localDateTimeAsUtcMs + probeTime),
      ),
    );
  }

  for (const candidateOffset of candidateOffsets) {
    const candidateDate = new Date(
      localDateTimeAsUtcMs - candidateOffset * HOUR_MS,
    );
    if (matchesLocalDateTimeParts(candidateDate, timezone, dateTimeParts)) {
      return candidateDate;
    }
  }

  throw new Error('date must be a valid local date-time');
}

function matchesLocalDateTimeParts(
  date: Date,
  timezone: string,
  dateTimeParts: LocalDateTimeParts,
): boolean {
  const formatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const formattedParts = formatter.formatToParts(date);
  const year = Number(
    formattedParts.find((part) => part.type === 'year')?.value,
  );
  const month = Number(
    formattedParts.find((part) => part.type === 'month')?.value,
  );
  const day = Number(formattedParts.find((part) => part.type === 'day')?.value);
  const hour = Number(
    formattedParts.find((part) => part.type === 'hour')?.value,
  );
  const minute = Number(
    formattedParts.find((part) => part.type === 'minute')?.value,
  );
  const second = Number(
    formattedParts.find((part) => part.type === 'second')?.value,
  );

  return (
    year === dateTimeParts.year &&
    month === dateTimeParts.month &&
    day === dateTimeParts.day &&
    hour === dateTimeParts.hour &&
    minute === dateTimeParts.minute &&
    second === (dateTimeParts.second ?? 0)
  );
}
