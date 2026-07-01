import { StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { Mata, MaramatakaVersion } from './mata';

export interface StarMonthNote {
  sequence: number;
  name: string;
  /**
   * Rule-set marker IDs named or implied for this month. Once the month is
   * selected by sequence, these markers are returned with their current sky
   * details even when they are not visible above the eastern horizon.
   */
  markerIds: string[];
  description: string;
  sourceText: string;
}

export interface StarMonthNamingRuleSet {
  strategy: string;
  /**
   * Current PoC dawn sample time. This is intentionally explicit because it
   * should later become a sunrise-relative rule-set setting.
   */
  sampleTimeLocal: string;
  yearStartMarkerId: string;
  yearStartDescription: string;
  source: string;
  sourceUrl?: string;
  sourceQuote?: string;
  /**
   * Candidate markers the astronomy layer can calculate for the selected
   * location/date. Fixed stars and asterisms use stored coordinates; supported
   * solar-system bodies use Astronomy Engine body calculations.
   */
  markers: StarMarkerDefinition[];
  /**
   * Named marama sequence for the star year. Month naming is selected from this
   * sequence, not from whichever marker happens to be visible first.
   */
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
          yearStartMarkerId: ruleSet.starMonthNaming.yearStartMarkerId,
          yearStartDescription:
            ruleSet.starMonthNaming.yearStartDescription,
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
