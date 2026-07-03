import {
  formatIsoDateInTimezone,
  getTimezoneOffsetHours,
  parseLocalDateTimeInTimezone,
  validateIanaTimezone,
} from './timezone';

describe('timezone helpers', () => {
  it('formats an instant in an IANA timezone', () => {
    expect(
      formatIsoDateInTimezone(
        new Date('2025-12-31T23:30:00.000Z'),
        'Pacific/Auckland',
      ),
    ).toBe('2026-01-01');
  });

  it('uses NZDT offset during summer', () => {
    expect(
      getTimezoneOffsetHours(
        'Pacific/Auckland',
        new Date('2026-01-01T00:00:00.000Z'),
      ),
    ).toBe(13);
  });

  it('uses NZST offset during winter', () => {
    expect(
      getTimezoneOffsetHours(
        'Pacific/Auckland',
        new Date('2026-06-01T00:00:00.000Z'),
      ),
    ).toBe(12);
  });

  it('parses historical offsets that include seconds', () => {
    expect(
      getTimezoneOffsetHours(
        'Pacific/Auckland',
        new Date('1840-02-06T00:00:00.000Z'),
      ),
    ).toBeCloseTo(11 + 39 / 60 + 4 / 3600, 8);
  });

  it('parses local date-times across daylight-saving offsets', () => {
    expect(
      parseLocalDateTimeInTimezone(
        {
          year: 2026,
          month: 1,
          day: 1,
          hour: 20,
          minute: 47,
          second: 0,
        },
        'Pacific/Auckland',
      ).toISOString(),
    ).toBe('2026-01-01T07:47:00.000Z');

    expect(
      parseLocalDateTimeInTimezone(
        {
          year: 2026,
          month: 6,
          day: 1,
          hour: 20,
          minute: 0,
          second: 0,
        },
        'Pacific/Auckland',
      ).toISOString(),
    ).toBe('2026-06-01T08:00:00.000Z');
  });

  it('rejects local date-times skipped by daylight saving', () => {
    expect(() =>
      parseLocalDateTimeInTimezone(
        {
          year: 2026,
          month: 9,
          day: 27,
          hour: 2,
          minute: 30,
          second: 0,
        },
        'Pacific/Auckland',
      ),
    ).toThrow('date must be a valid local date-time');
  });

  it('rejects invalid IANA timezones', () => {
    expect(() => validateIanaTimezone('Pacific/NotARealTimezone')).toThrow(
      'Invalid IANA timezone: Pacific/NotARealTimezone',
    );
  });
});
