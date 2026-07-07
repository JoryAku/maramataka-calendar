import {
  DEFAULT_MARAMATAKA_RULE_SET,
  DEFAULT_MARAMATAKA_RULE_SET_ID,
  getMaramatakaRuleSet,
  listMaramatakaRuleSets,
} from './maramataka-rule-set-registry';

describe('maramataka rule set registry', () => {
  it('returns Living by the Stars as the default rule set', () => {
    expect(DEFAULT_MARAMATAKA_RULE_SET.id).toBe(
      DEFAULT_MARAMATAKA_RULE_SET_ID,
    );
    expect(DEFAULT_MARAMATAKA_RULE_SET.tradition).toBe('Living by the Stars');
  });

  it('lists available rule sets as summaries', () => {
    const ruleSets = listMaramatakaRuleSets();

    expect(ruleSets.map((ruleSet) => ruleSet.id)).toEqual(
      expect.arrayContaining([
        'living-by-the-stars-observational-v1',
        'mita-te-tai-best-observational-v1',
      ]),
    );
    expect(ruleSets[0]).not.toHaveProperty('mata');
  });

  it('throws a useful error for an unknown rule set', () => {
    expect(() => getMaramatakaRuleSet('unknown')).toThrow(
      /Unknown maramataka rule set: unknown/,
    );
  });
});

