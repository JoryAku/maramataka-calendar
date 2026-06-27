import { MITA_TE_TAI_BEST_MATA } from './mita-te-tai-best';
import { generateMaramatakaMonth } from './maramataka-month-generator';

describe('generateMaramatakaMonth', () => {
  it('creates nights from moonrise/moonset intervals', () => {
    const moonRiseSets = [
      {
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:00:00+13:00'),
        setsAt: new Date('2026-01-02T06:00:00+13:00'),
        source: 'usno',
      },
      {
        date: '2026-01-02',
        risesAt: new Date('2026-01-02T18:50:00+13:00'),
        setsAt: new Date('2026-01-03T06:50:00+13:00'),
        source: 'usno',
      },
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      whiroStartsAt: moonRiseSets[0].risesAt,
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      moonRiseSets,
    });

    expect(month.nights).toHaveLength(2);
    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[0].startsAt).toEqual(moonRiseSets[0].risesAt);
    expect(month.nights[0].endsAt).toEqual(moonRiseSets[0].setsAt);
  });

  it('throws when there are not enough moonrise/moonset intervals', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
        moonRiseSets: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:00:00+13:00'),
            setsAt: new Date('2026-01-02T06:00:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow(
      'Not enough moonrise/moonset intervals to generate Maramataka month',
    );
  });

  it('throws when Whiro start is not the first moonrise', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 1),
        moonRiseSets: [
          {
            date: '2026-01-02',
            risesAt: new Date('2026-01-02T18:50:00+13:00'),
            setsAt: new Date('2026-01-03T06:50:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow('Whiro start must match first moonrise');
  });

  it('throws when mata version does not match month version', () => {
    const invalidMata = {
      ...MITA_TE_TAI_BEST_MATA[0],
      version: 'different-version',
    } as unknown as (typeof MITA_TE_TAI_BEST_MATA)[number];

    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: [invalidMata],
        moonRiseSets: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:00:00+13:00'),
            setsAt: new Date('2026-01-02T06:00:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow('All mata entries must match month version');
  });

  it('throws when moonrise intervals are not strictly increasing', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
        moonRiseSets: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:00:00+13:00'),
            setsAt: new Date('2026-01-02T06:00:00+13:00'),
            source: 'usno',
          },
          {
            date: '2026-01-02',
            risesAt: new Date('2026-01-01T18:00:00+13:00'),
            setsAt: new Date('2026-01-03T06:50:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow('Moonrise intervals must be strictly increasing');
  });

  it('assigns mata in the correct order', () => {
    const moonRiseSets = [
      {
        date: '2026-01-01',
        risesAt: new Date('2026-01-01T18:00:00+13:00'),
        setsAt: new Date('2026-01-02T06:00:00+13:00'),
        source: 'usno',
      },
      {
        date: '2026-01-02',
        risesAt: new Date('2026-01-02T18:50:00+13:00'),
        setsAt: new Date('2026-01-03T06:50:00+13:00'),
        source: 'usno',
      },
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      whiroStartsAt: moonRiseSets[0].risesAt,
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      moonRiseSets,
    });

    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[1].mata.name).toBe('Tirea');
  });

  it('throws when moonset is not after moonrise', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 1),
        moonRiseSets: [
          {
            date: '2026-01-01',
            risesAt: new Date('2026-01-01T18:00:00+13:00'),
            setsAt: new Date('2026-01-01T06:00:00+13:00'),
            source: 'usno',
          },
        ],
      }),
    ).toThrow('Moonset must be after moonrise');
  });
});
