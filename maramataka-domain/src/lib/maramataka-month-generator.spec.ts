import { MITA_TE_TAI_BEST_MATA } from './mita-te-tai-best';
import { generateMaramatakaMonth } from './maramataka-month-generator';

describe('generateMaramatakaMonth', () => {
  it('creates nights from consecutive sunsets', () => {
    const sunsets = [
      new Date('2026-01-01T20:00:00+13:00'),
      new Date('2026-01-02T20:01:00+13:00'),
      new Date('2026-01-03T20:02:00+13:00'),
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      whiroStartsAt: sunsets[0],
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      sunsets,
    });

    expect(month.nights).toHaveLength(2);
    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[0].startsAt).toEqual(sunsets[0]);
    expect(month.nights[0].endsAt).toEqual(sunsets[1]);
  });

  it('throws when there are not enough sunsets', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T20:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
        sunsets: [new Date('2026-01-01T20:00:00+13:00')],
      })
    ).toThrow('Not enough sunsets to generate Maramataka month');
  });

  it('throws when Whiro start is not the first sunset', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        whiroStartsAt: new Date('2026-01-01T20:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 1),
        sunsets: [
          new Date('2026-01-02T20:00:00+13:00'),
          new Date('2026-01-03T20:00:00+13:00'),
        ],
      })
    ).toThrow('Whiro start must match first sunset');
  });

  it('assigns mata in the correct order', () => {
    const sunsets = [
      new Date('2026-01-01T20:00:00+13:00'),
      new Date('2026-01-02T20:01:00+13:00'),
      new Date('2026-01-03T20:02:00+13:00'),
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      whiroStartsAt: sunsets[0],
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      sunsets,
    });

    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[1].mata.name).toBe('Tirea');
  });
});