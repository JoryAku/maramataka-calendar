import { StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { Mata, MaramatakaVersion } from './mata';

export interface StarMonthNote {
  sequence: number;
  name: string;
  markerIds: string[];
  description: string;
  sourceText: string;
}

export interface StarMonthNamingRuleSet {
  strategy: string;
  sampleTimeLocal: string;
  source: string;
  sourceUrl?: string;
  sourceQuote?: string;
  markers: StarMarkerDefinition[];
  months: StarMonthNote[];
}

export interface MaramatakaRuleSetSummary {
  id: string;
  name: string;
  version: string;
  source: string;
  sourceQuote?: string;
  tradition: string;
  maramaStart: string;
  mataBoundary: string;
  calibration: string;
  balancing: string;
  starMonthNaming?: Omit<StarMonthNamingRuleSet, 'markers'> & {
    markers: Array<
      Pick<
        StarMarkerDefinition,
        | 'id'
        | 'name'
        | 'type'
        | 'englishName'
        | 'seasonalAssociation'
        | 'confidence'
      >
    >;
  };
}

export interface MaramatakaRuleSet extends MaramatakaRuleSetSummary {
  starMonthNaming?: StarMonthNamingRuleSet;
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
    sourceQuote: ruleSet.sourceQuote,
    tradition: ruleSet.tradition,
    maramaStart: ruleSet.maramaStart,
    mataBoundary: ruleSet.mataBoundary,
    calibration: ruleSet.calibration,
    balancing: ruleSet.balancing,
    starMonthNaming: ruleSet.starMonthNaming
      ? {
          strategy: ruleSet.starMonthNaming.strategy,
          sampleTimeLocal: ruleSet.starMonthNaming.sampleTimeLocal,
          source: ruleSet.starMonthNaming.source,
          sourceUrl: ruleSet.starMonthNaming.sourceUrl,
          sourceQuote: ruleSet.starMonthNaming.sourceQuote,
          months: ruleSet.starMonthNaming.months,
          markers: ruleSet.starMonthNaming.markers.map((marker) => ({
            id: marker.id,
            name: marker.name,
            type: marker.type,
            englishName: marker.englishName,
            seasonalAssociation: marker.seasonalAssociation,
            confidence: marker.confidence,
          })),
        }
      : undefined,
  };
}
