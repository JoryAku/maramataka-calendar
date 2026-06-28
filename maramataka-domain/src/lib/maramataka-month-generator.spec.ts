import { generateMaramatakaMonth } from './maramataka-month-generator';
import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';
import { summarizeRuleSet } from './maramataka-rule-set';

describe('generateMaramatakaMonth', () => {
  const ruleSet = summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET);

  const moonRise = (date: string, time: string) => ({
    date,
    risesAt: new Date(`${date}T${time}:00+13:00`),
    source: 'usno',
  });

  it('creates nights from consecutive moonrises', () => {
    const moonRises = [
      moonRise('2026-01-01', '18:00'),
      moonRise('2026-01-02', '18:50'),
      moonRise('2026-01-03', '19:40'),
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      ruleSet,
      whiroStartsAt: moonRises[0].risesAt,
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      moonRises,
    });

    expect(month.nights).toHaveLength(2);
    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[0].startsAt).toEqual(moonRises[0].risesAt);
    expect(month.nights[0].endsAt).toEqual(moonRises[1].risesAt);
  });

  it('throws when there are not enough moonrises', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
        moonRises: [moonRise('2026-01-01', '18:00')],
      }),
    ).toThrow('Not enough moonrises to generate Maramataka month');
  });

  it('throws when Whiro start is not the first moonrise', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 1),
        moonRises: [
          moonRise('2026-01-02', '18:50'),
          moonRise('2026-01-03', '19:40'),
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
        ruleSet,
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: [invalidMata],
        moonRises: [
          moonRise('2026-01-01', '18:00'),
          moonRise('2026-01-02', '18:50'),
        ],
      }),
    ).toThrow('All mata entries must match month version');
  });

  it('throws when moonrises are not strictly increasing', () => {
    expect(() =>
      generateMaramatakaMonth({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: new Date('2026-01-01T18:00:00+13:00'),
        mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
        moonRises: [
          moonRise('2026-01-01', '18:00'),
          moonRise('2026-01-01', '18:00'),
          moonRise('2026-01-03', '19:40'),
        ],
      }),
    ).toThrow('Moonrises must be strictly increasing');
  });

  it('assigns mata in the correct order', () => {
    const moonRises = [
      moonRise('2026-01-01', '18:00'),
      moonRise('2026-01-02', '18:50'),
      moonRise('2026-01-03', '19:40'),
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      ruleSet,
      whiroStartsAt: moonRises[0].risesAt,
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      moonRises,
    });

    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.nights[1].mata.name).toBe('Tirea');
  });

  it('adds overlapping mata to the matching moonrise interval', () => {
    const moonRises = [
      moonRise('2026-01-01', '18:00'),
      moonRise('2026-01-02', '18:50'),
      moonRise('2026-01-03', '19:40'),
    ];

    const month = generateMaramatakaMonth({
      version: 'mita-te-tai-best',
      ruleSet,
      whiroStartsAt: moonRises[0].risesAt,
      mata: MITA_TE_TAI_BEST_MATA.slice(0, 2),
      moonRises,
      overlaps: [
        {
          intervalDate: '2026-01-02',
          overlap: {
            mata: MITA_TE_TAI_BEST_MATA[0],
            cycleStartsAt: moonRises[1].risesAt,
            reason: 'new-moon-anchor',
          },
        },
      ],
    });

    expect(month.nights[0].overlappingMata).toBeUndefined();
    expect(month.nights[1].mata.name).toBe('Tirea');
    expect(month.nights[1].overlappingMata).toEqual([
      {
        mata: MITA_TE_TAI_BEST_MATA[0],
        cycleStartsAt: moonRises[1].risesAt,
        reason: 'new-moon-anchor',
      },
    ]);
  });
});
