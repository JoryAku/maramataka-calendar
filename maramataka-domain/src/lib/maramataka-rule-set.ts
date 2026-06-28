import { Mata, MaramatakaVersion } from './mata';

export interface MaramatakaRuleSetSummary {
  id: string;
  name: string;
  version: string;
  source: string;
  tradition: string;
  maramaStart: string;
  mataBoundary: string;
  calibration: string;
  balancing: string;
}

export interface MaramatakaRuleSet extends MaramatakaRuleSetSummary {
  mata: Mata[];
  mataVersion: MaramatakaVersion;
}

export function summarizeRuleSet(
  ruleSet: MaramatakaRuleSet,
): MaramatakaRuleSetSummary {
  return {
    id: ruleSet.id,
    name: ruleSet.name,
    version: ruleSet.version,
    source: ruleSet.source,
    tradition: ruleSet.tradition,
    maramaStart: ruleSet.maramaStart,
    mataBoundary: ruleSet.mataBoundary,
    calibration: ruleSet.calibration,
    balancing: ruleSet.balancing,
  };
}
