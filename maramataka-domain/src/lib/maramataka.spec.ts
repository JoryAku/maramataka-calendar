import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';
import { MaramatakaMonth } from './maramataka';
import { summarizeRuleSet } from './maramataka-rule-set';

describe('MaramatakaMonth', () => {
  it('creates a valid Maramataka month', () => {
    const month: MaramatakaMonth = {
      version: 'mita-te-tai-best',
      ruleSet: summarizeRuleSet(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET),
      whiroStartsAt: new Date('2026-01-01T19:00:00+13:00'),
      nights: [{
        mata: MITA_TE_TAI_BEST_MATA[0],
        startsAt: new Date('2026-01-01T19:00:00+13:00'),
        endsAt: new Date('2026-01-02T19:01:00+13:00'),
      }],
    };

    expect(month.nights[0].startsAt < month.nights[0].endsAt).toBe(true);
    expect(month.nights[0].mata.name).toBe('Whiro');
    expect(month.version).toBe('mita-te-tai-best');
  });
});
