import {
  createMaramatakaRuleSetCacheMetadata,
  createMaramatakaRuleSetFingerprint,
} from './maramataka-rule-set';
import { LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET } from './living-by-the-stars';

describe('maramataka rule set fingerprint metadata', () => {
  it('describes the readable rule inputs that affect maramataka results', () => {
    const metadata = createMaramatakaRuleSetCacheMetadata(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
    ) as {
      ruleSet: { id: string; mataVersion: string };
      mata: Array<{ index: number; name: string }>;
      yearStartRule: { marker: { id: string } };
      matarikiHoliday: { targetMataNames: string[] };
      starMonthNaming: { markers: Array<{ id: string }> };
    };

    expect(metadata.ruleSet).toEqual(
      expect.objectContaining({
        id: 'living-by-the-stars-observational-v1',
        mataVersion: 'living-by-the-star',
      }),
    );
    expect(metadata.mata[0]).toEqual({
      index: 1,
      name: 'Whiro',
      version: 'living-by-the-star',
      phaseGroup: 'Te Marama i te rā',
    });
    expect(metadata.yearStartRule.marker.id).toBe('pipiri');
    expect(metadata.matarikiHoliday.targetMataNames).toContain(
      'Tangaroa-ā-mua',
    );
    expect(
      metadata.starMonthNaming.markers.map((marker) => marker.id),
    ).toContain('ruhanui');
  });

  it('changes fingerprint when a rule input changes', () => {
    const baseFingerprint = createMaramatakaRuleSetFingerprint(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
    );
    const changedFingerprint = createMaramatakaRuleSetFingerprint({
      ...LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
      matarikiHoliday: {
        ...LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday!,
        targetMataNames: ['Tangaroa-ā-mua'],
      },
    });

    expect(changedFingerprint).not.toBe(baseFingerprint);
  });
});
