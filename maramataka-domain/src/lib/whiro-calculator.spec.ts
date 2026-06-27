import { calculateWhiroStart } from './whiro-calculator';

describe('calculateWhiroStart', () => {
  it('uses the moonrise interval on the New Moon local date as Whiro', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRiseSets: [
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          setsAt: new Date('2026-01-02T09:14:00+13:00'),
          source: 'usno',
        },
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          setsAt: new Date('2026-01-03T10:04:00+13:00'),
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
      moonRiseSets: [
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          setsAt: new Date('2026-01-02T09:14:00+13:00'),
          source: 'usno',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('finds Whiro by New Moon local date even when input intervals are unsorted', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRiseSets: [
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          setsAt: new Date('2026-01-03T10:04:00+13:00'),
          source: 'usno',
        },
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          setsAt: new Date('2026-01-02T09:14:00+13:00'),
          source: 'usno',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('throws when no interval exists for the New Moon local date', () => {
    expect(() =>
      calculateWhiroStart({
        newMoonAt: new Date('2026-01-03T10:00:00+13:00'),
        newMoonLocalDate: '2026-01-03',
        moonRiseSets: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:31:00+13:00'),
            setsAt: new Date('2026-01-02T09:14:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow('No moonrise/moonset interval found for Whiro date 2026-01-03');
  });
});
