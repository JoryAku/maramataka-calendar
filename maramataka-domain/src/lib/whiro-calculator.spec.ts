import {
  calculateWhiroStart,
  findMoonriseForObservationWindow,
} from './whiro-calculator';

describe('calculateWhiroStart', () => {
  it('uses the moonrise interval that contains the New Moon instant as Whiro', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T20:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          source: 'astronomy-engine',
        },
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          source: 'astronomy-engine',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('can associate Whiro with the previous civil date when that moonrise interval contains the New Moon', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T22:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2025-12-31',
          risesAt: new Date('2025-12-31T17:41:00+13:00'),
          source: 'astronomy-engine',
        },
        {
          date: '2026-01-01',
          risesAt: new Date('2026-01-01T18:31:00+13:00'),
          source: 'astronomy-engine',
        },
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          source: 'astronomy-engine',
        },
      ],
    });

    expect(result).toEqual(new Date('2026-01-01T18:31:00+13:00'));
  });

  it('uses the nearest moonrise inside the observation window when no containing interval is available', () => {
    const result = calculateWhiroStart({
      newMoonAt: new Date('2026-01-01T10:00:00+13:00'),
      newMoonLocalDate: '2026-01-01',
      moonRises: [
        {
          date: '2026-01-02',
          risesAt: new Date('2026-01-02T19:21:00+13:00'),
          source: 'astronomy-engine',
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
            source: 'astronomy-engine',
          },
        ],
      }),
    ).toThrow(
      'Cannot anchor Whiro: no moonrise was found in the New Moon observation window for 2026-01-03',
    );
  });
});

describe('findMoonriseForObservationWindow', () => {
  it('returns the moonrise that begins the interval containing an astronomical phase', () => {
    const anchor = findMoonriseForObservationWindow({
      phaseAt: new Date('2026-01-16T12:00:00Z'),
      moonRises: [
        {
          date: '2026-01-15',
          risesAt: new Date('2026-01-15T05:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          date: '2026-01-16',
          risesAt: new Date('2026-01-16T05:00:00Z'),
          source: 'astronomy-engine',
        },
        {
          date: '2026-01-17',
          risesAt: new Date('2026-01-17T05:00:00Z'),
          source: 'astronomy-engine',
        },
      ],
    });

    expect(anchor?.date).toBe('2026-01-16');
  });
});
