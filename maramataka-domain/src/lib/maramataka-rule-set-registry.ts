import { LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET } from './living-by-the-stars';
import { MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET } from './mita-te-tai-best';
import {
  MaramatakaRuleSet,
  MaramatakaRuleSetSummary,
  summarizeRuleSet,
} from './maramataka-rule-set';

const MARAMATAKA_RULE_SETS = [
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
] as const satisfies readonly MaramatakaRuleSet[];

export const DEFAULT_MARAMATAKA_RULE_SET_ID =
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.id;

export type MaramatakaRuleSetId = (typeof MARAMATAKA_RULE_SETS)[number]['id'];

export const DEFAULT_MARAMATAKA_RULE_SET = getMaramatakaRuleSet(
  DEFAULT_MARAMATAKA_RULE_SET_ID,
);

export function listMaramatakaRuleSets(): MaramatakaRuleSetSummary[] {
  return MARAMATAKA_RULE_SETS.map((ruleSet) => summarizeRuleSet(ruleSet));
}

export function getMaramatakaRuleSet(
  id: string = DEFAULT_MARAMATAKA_RULE_SET_ID,
): MaramatakaRuleSet {
  const ruleSet = MARAMATAKA_RULE_SETS.find((candidate) => candidate.id === id);

  if (!ruleSet) {
    const knownIds = MARAMATAKA_RULE_SETS.map((candidate) => candidate.id).join(
      ', ',
    );
    throw new Error(`Unknown maramataka rule set: ${id}. Known: ${knownIds}`);
  }

  return ruleSet;
}

