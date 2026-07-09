import {
  CacheFingerprintMetadata,
  createCacheFingerprint,
  StarMarkerDefinition,
  StarMarkerDawnRisingConfig,
} from '@maramataka-calendar/astronomy';
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
   * Dawn sampling definition used for star marker visibility calculations.
   */
  sampleTimeLocal: string;
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

export interface YearStartRuleSet {
  strategy: string;
  marker: StarMarkerDefinition;
  description: string;
  source: string;
  sourceUrl?: string;
  sourceQuote?: string;
}

export interface MatarikiHolidayRuleSet {
  monthSelection:
    | 'year-start-or-ruhanui'
    | 'after-te-tahi-tangaroa-use-next-marama';
  targetMataNames: string[];
  calibrationMarker?: StarMarkerDefinition;
  description: string;
  source: string;
}

export interface MaramatakaRuleSetSummary {
  id: string;
  name: string;
  version: string;
  mataVersion: MaramatakaVersion;
  metadataVersion: typeof MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION;
  fingerprint: string;
  source: string;
  sourceQuote?: string;
  tradition: string;
  maramaStart: string;
  mataBoundary: string;
  calibration: string;
  balancing: string;
  yearStartRule?: Omit<YearStartRuleSet, 'marker'> & {
    marker: Pick<
      StarMarkerDefinition,
      | 'id'
      | 'name'
      | 'type'
      | 'englishName'
      | 'seasonalAssociation'
      | 'confidence'
    >;
  };
  matarikiHoliday?: Omit<MatarikiHolidayRuleSet, 'calibrationMarker'> & {
    calibrationMarker?: Pick<
      StarMarkerDefinition,
      | 'id'
      | 'name'
      | 'type'
      | 'englishName'
      | 'seasonalAssociation'
      | 'confidence'
    >;
  };
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

export interface MaramatakaRuleSet
  extends Omit<
    MaramatakaRuleSetSummary,
    | 'metadataVersion'
    | 'fingerprint'
    | 'yearStartRule'
    | 'matarikiHoliday'
    | 'starMonthNaming'
  > {
  yearStartRule?: YearStartRuleSet;
  matarikiHoliday?: MatarikiHolidayRuleSet;
  starMonthNaming?: StarMonthNamingRuleSet;
  mata: Mata[];
}

export const MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION = 1;

export function summarizeRuleSet(
  ruleSet: MaramatakaRuleSet,
): MaramatakaRuleSetSummary {
  return {
    id: ruleSet.id,
    name: ruleSet.name,
    version: ruleSet.version,
    mataVersion: ruleSet.mataVersion,
    metadataVersion: MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION,
    fingerprint: createMaramatakaRuleSetFingerprint(ruleSet),
    source: ruleSet.source,
    sourceQuote: ruleSet.sourceQuote,
    tradition: ruleSet.tradition,
    maramaStart: ruleSet.maramaStart,
    mataBoundary: ruleSet.mataBoundary,
    calibration: ruleSet.calibration,
    balancing: ruleSet.balancing,
    yearStartRule: ruleSet.yearStartRule
      ? {
          strategy: ruleSet.yearStartRule.strategy,
          marker: {
            id: ruleSet.yearStartRule.marker.id,
            name: ruleSet.yearStartRule.marker.name,
            type: ruleSet.yearStartRule.marker.type,
            englishName: ruleSet.yearStartRule.marker.englishName,
            seasonalAssociation:
              ruleSet.yearStartRule.marker.seasonalAssociation,
            confidence: ruleSet.yearStartRule.marker.confidence,
          },
          description: ruleSet.yearStartRule.description,
          source: ruleSet.yearStartRule.source,
          sourceUrl: ruleSet.yearStartRule.sourceUrl,
          sourceQuote: ruleSet.yearStartRule.sourceQuote,
        }
      : undefined,
    matarikiHoliday: ruleSet.matarikiHoliday
      ? {
          monthSelection: ruleSet.matarikiHoliday.monthSelection,
          targetMataNames: ruleSet.matarikiHoliday.targetMataNames,
          calibrationMarker: ruleSet.matarikiHoliday.calibrationMarker
            ? {
                id: ruleSet.matarikiHoliday.calibrationMarker.id,
                name: ruleSet.matarikiHoliday.calibrationMarker.name,
                type: ruleSet.matarikiHoliday.calibrationMarker.type,
                englishName:
                  ruleSet.matarikiHoliday.calibrationMarker.englishName,
                seasonalAssociation:
                  ruleSet.matarikiHoliday.calibrationMarker.seasonalAssociation,
                confidence:
                  ruleSet.matarikiHoliday.calibrationMarker.confidence,
              }
            : undefined,
          description: ruleSet.matarikiHoliday.description,
          source: ruleSet.matarikiHoliday.source,
        }
      : undefined,
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

export function createMaramatakaRuleSetCacheMetadata(
  ruleSet: MaramatakaRuleSet,
): CacheFingerprintMetadata {
  return {
    layer: 'maramataka-rules',
    metadataVersion: MARAMATAKA_RULE_SET_CACHE_METADATA_VERSION,
    ruleSet: {
      id: ruleSet.id,
      version: ruleSet.version,
      source: ruleSet.source,
      tradition: ruleSet.tradition,
      maramaStart: ruleSet.maramaStart,
      mataBoundary: ruleSet.mataBoundary,
      calibration: ruleSet.calibration,
      balancing: ruleSet.balancing,
      mataVersion: ruleSet.mataVersion,
    },
    mata: ruleSet.mata.map((mata) => ({
      index: mata.index,
      name: mata.name,
      version: mata.version,
      phaseGroup: mata.phaseGroup?.name,
    })),
    yearStartRule: ruleSet.yearStartRule
      ? {
          strategy: ruleSet.yearStartRule.strategy,
          marker: starMarkerCacheMetadata(ruleSet.yearStartRule.marker),
        }
      : undefined,
    matarikiHoliday: ruleSet.matarikiHoliday
      ? {
          monthSelection: ruleSet.matarikiHoliday.monthSelection,
          targetMataNames: ruleSet.matarikiHoliday.targetMataNames,
          calibrationMarker: ruleSet.matarikiHoliday.calibrationMarker
            ? starMarkerCacheMetadata(
                ruleSet.matarikiHoliday.calibrationMarker,
              )
            : undefined,
        }
      : undefined,
    starMonthNaming: ruleSet.starMonthNaming
      ? {
          strategy: ruleSet.starMonthNaming.strategy,
          sampleTimeLocal: ruleSet.starMonthNaming.sampleTimeLocal,
          markerIds: ruleSet.starMonthNaming.markers.map((marker) => marker.id),
          markers: ruleSet.starMonthNaming.markers.map(starMarkerCacheMetadata),
          months: ruleSet.starMonthNaming.months.map((month) => ({
            sequence: month.sequence,
            name: month.name,
            markerIds: month.markerIds,
          })),
        }
      : undefined,
  };
}

export function createMaramatakaRuleSetFingerprint(
  ruleSet: MaramatakaRuleSet,
): string {
  return createCacheFingerprint(createMaramatakaRuleSetCacheMetadata(ruleSet));
}

function starMarkerCacheMetadata(
  marker: StarMarkerDefinition,
): CacheFingerprintMetadata {
  return {
    id: marker.id,
    name: marker.name,
    type: marker.type,
    englishName: marker.englishName,
    seasonalAssociation: marker.seasonalAssociation,
    confidence: marker.confidence,
    representative: starRepresentativeCacheMetadata(marker.representative),
    dawnRising: dawnRisingCacheMetadata(marker.dawnRising),
  };
}

function starRepresentativeCacheMetadata(
  representative: StarMarkerDefinition['representative'],
): CacheFingerprintMetadata {
  if (representative.kind === 'fixed-equatorial') {
    return {
      kind: representative.kind,
      rightAscensionHours: representative.rightAscensionHours,
      declinationDegrees: representative.declinationDegrees,
    };
  }

  return {
    kind: representative.kind,
    body: representative.body,
  };
}

function dawnRisingCacheMetadata(
  dawnRising?: StarMarkerDawnRisingConfig,
): CacheFingerprintMetadata | undefined {
  if (!dawnRising) {
    return undefined;
  }

  return {
    startSunAltitudeDegrees: dawnRising.startSunAltitudeDegrees,
    endSunAltitudeDegrees: dawnRising.endSunAltitudeDegrees,
    minimumMarkerAltitudeDegrees: dawnRising.minimumMarkerAltitudeDegrees,
    minimumAzimuthDegrees: dawnRising.minimumAzimuthDegrees,
    maximumAzimuthDegrees: dawnRising.maximumAzimuthDegrees,
    sampleMinutes: dawnRising.sampleMinutes,
  };
}
