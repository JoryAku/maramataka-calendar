import { calculateWhiroStart } from './whiro-calculator';

describe('calculateWhiroStart', () => {
  it('uses the moonrise on the New Moon local date as Whiro', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          source: 'usno',
        },
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          source: 'usno',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('uses the New Moon local date even when the New Moon instant is after moonrise', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T22:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          source: 'usno',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('falls back to the first moonrise after the New Moon instant when the New Moon date has no moonrise', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          source: 'usno',
        },
        {
          date: '2025-12-31',
          risesAt: new Date('2025-12-31T17:41:00+13:00'),
          source: 'usno',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-02T19:21:00+13:00'));
  });

  it('throws when no moonrise can anchor Whiro', () => {
    expect(() =>
      calculateWhiroStart({
        newMoonAt: new Date('2026-01-03T10:00:00+13:00'),
        newMoonLocalDate: '2026-01-03',
        moonRises: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:31:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow(
      'Cannot anchor Whiro: no moonrise was found on the New Moon local date 2026-01-03 or after the New Moon instant',
    );
  });
});
