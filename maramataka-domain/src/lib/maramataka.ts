import { Mata, MaramatakaVersion } from './mata';
import { MaramatakaRuleSetSummary } from './maramataka-rule-set';

export interface MaramatakaNight {
  mata: Mata;
  overlappingMata?: MaramatakaNightOverlap[];
  startsAt: Date;
  endsAt: Date;
}

export interface MaramatakaNightOverlap {
  mata: Mata;
  cycleStartsAt: Date;
  reason: 'new-moon-anchor';
}

export interface MaramatakaMonth {
  version: MaramatakaVersion;
  ruleSet: MaramatakaRuleSetSummary;
  whiroStartsAt: Date;
  nights: MaramatakaNight[];
}
