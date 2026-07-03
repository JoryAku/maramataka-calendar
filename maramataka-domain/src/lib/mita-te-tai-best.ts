import { StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { Mata, MataContentLayer, MataPhaseGroup } from './mata';
import { MaramatakaRuleSet } from './maramataka-rule-set';

export const MITA_TE_TAI_BEST_BALANCING_QUOTE =
  '"In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara\'s notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."';

export const MITA_TE_TAI_BEST_STAR_MONTH_QUOTE =
  '"The following names are those of the twelve months as known to the latter tribe, supplied by Himiona Tikitu: 1. Te Tahi o Pipiri, The First of Pipiri. 2. Te Rua o Takurua, The Second of Takurua. 3. Te Toru o Hereturi-koka, The Third of Hereturi-koka. 4. Te Wha o Mahuru, The Fourth of Mahuru. 5. Te Rima o Kopu, The Fifth of Kopu. 6. Whitianaunau. 7. Hakihea. 8. Kai-tatea. 9. Ruhi-te-rangi. 10. Poutu-te-rangi. 11. Paenga-whawha. 12. Haki-haratua." "Without exception, stars were the ariki (controllers, heads) of these months. The year commenced with the appearance of Matariki (Pleiades) on the horizon at dawn."';

type PhaseGroupKey =
  | 'teMaramaIteRa'
  | 'teHua'
  | 'tamatea'
  | 'teRakau'
  | 'teAtarau'
  | 'korekore'
  | 'tangaroa';

const PHASE_GROUPS: Record<PhaseGroupKey, MataPhaseGroup> = {
  teMaramaIteRa: {
    name: 'Te Marama i te rā',
  },
  teHua: {
    name: 'Te Hua',
  },
  tamatea: {
    name: 'Tāmatea',
  },
  teRakau: {
    name: 'Te Rākau',
  },
  teAtarau: {
    name: 'Te Atarau',
  },
  korekore: {
    name: 'Korekore',
  },
  tangaroa: {
    name: 'Tangaroa',
  },
};

const MITA_TE_TAI_BEST_SOURCE =
  'Living by the Stars (mata phase-group reference); Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference';
const MITA_TE_TAI_BEST_SOURCE_URL =
  'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html';
const MITA_TE_TAI_BEST_STAR_MONTH_SOURCE =
  'Elsdon Best, The Maori Division of Time';

const MITA_TE_TAI_BEST_STAR_MONTH_MARKERS = [
  {
    id: 'matariki',
    name: 'Matariki',
    type: 'asterism',
    englishName: 'Pleiades',
    description:
      'Pleiades; Best records Matariki appearing on the dawn horizon as the commencement of the year.',
    seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 3.7914,
      declinationDegrees: 24.1051,
    },
  },
  {
    id: 'kopu',
    name: 'Kōpū',
    type: 'planet',
    englishName: 'Venus',
    description: 'Venus as a morning-star marker in the seasonal account.',
    seasonalAssociation: 'Second seasonal month marker',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    confidence: 'confirmed',
    representative: {
      kind: 'body',
      body: 'Venus',
    },
  },
  {
    id: 'takurua',
    name: 'Takurua',
    type: 'star',
    englishName: 'Sirius',
    description: 'Sirius; Best notes Takurua is also a name for winter.',
    seasonalAssociation: 'Second named month marker',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 6.7525,
      declinationDegrees: -16.7161,
    },
  },
  {
    id: 'tautoru',
    name: 'Tautoru',
    type: 'asterism',
    englishName: "Orion's Belt",
    description:
      'Orion Belt marker; represented here by Alnilam for sky-position calculation.',
    seasonalAssociation: 'Second seasonal month marker',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 5.6036,
      declinationDegrees: -1.2019,
    },
  },
  {
    id: 'whakaahu',
    name: 'Whakaahu',
    type: 'star',
    englishName: 'Castor',
    description:
      'Gemini marker; represented by Castor, with Pollux retained for later review.',
    seasonalAssociation: 'Late winter / early spring marker',
    source: 'Te Aka / project star-marker notes',
    confidence: 'working',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 7.5767,
      declinationDegrees: 31.8883,
    },
  },
  {
    id: 'rehua',
    name: 'Rehua',
    type: 'star',
    englishName: 'Antares',
    description: 'Summer marker associated with the Rehua star.',
    seasonalAssociation: 'Summer marker',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 16.4901,
      declinationDegrees: -26.432,
    },
  },
  {
    id: 'uruao',
    name: 'Uruao',
    type: 'sky-figure',
    englishName: 'Tail of Scorpion working marker',
    description:
      "Working project interpretation for Tamarereti's Canoe / Tail of Scorpion context.",
    seasonalAssociation: 'Provisional sky-figure marker',
    source: 'Project working interpretation',
    confidence: 'working',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 17.5601,
      declinationDegrees: -37.1038,
    },
  },
] satisfies StarMarkerDefinition[];

const MITA_TE_TAI_BEST_STAR_MONTH_NOTES = [
  {
    sequence: 0,
    name: 'Ruhanui',
    markerIds: [],
    description:
      'Working name for the intercalary regulating marama after the twelve regular marama in 13-marama star years.',
    sourceText:
      'Working project rule from the thirteenth-month / regulating marama interpretation.',
  },
  {
    sequence: 1,
    name: 'Te Tahi o Pipiri',
    markerIds: ['matariki'],
    description:
      'The first named month in Himiona Tikitu\'s list is Te Tahi o Pipiri, with the year commencing when Matariki appears on the dawn horizon.',
    sourceText:
      'Te Tahi o Pipiri .. The First of Pipiri. The year commenced with the appearance of Matariki (Pleiades) on the horizon at dawn.',
  },
  {
    sequence: 2,
    name: 'Te Rua o Takurua',
    markerIds: ['takurua'],
    description:
      'The second named month is Te Rua o Takurua. Best notes Takurua is Sirius and also a name for winter.',
    sourceText:
      'Te Rua o Takurua .. The Second of Takurua.',
  },
  {
    sequence: 3,
    name: 'Te Toru o Hereturi-koka',
    markerIds: [],
    description:
      'The third named month is Te Toru o Hereturi-koka.',
    sourceText:
      'Te Toru o Hereturi-koka .. The Third of Hereturi-koka.',
  },
  {
    sequence: 4,
    name: 'Te Wha o Mahuru',
    markerIds: [],
    description:
      'The fourth named month is Te Wha o Mahuru.',
    sourceText:
      'Te Wha o Mahuru .. The Fourth of Mahuru.',
  },
  {
    sequence: 5,
    name: 'Te Rima o Kōpū',
    markerIds: ['kopu'],
    description:
      'The fifth named month is Te Rima o Kōpū. Best notes Kōpū is Venus.',
    sourceText:
      'Te Rima o Kopu .. The Fifth of Kopu.',
  },
  {
    sequence: 6,
    name: 'Whitianaunau',
    markerIds: [],
    description:
      'The sixth named month is Whitianaunau. Best notes it differs from the inland list.',
    sourceText: 'Whitianaunau.',
  },
  {
    sequence: 7,
    name: 'Hakihea',
    markerIds: [],
    description: 'The seventh named month is Hakihea.',
    sourceText: 'Hakihea.',
  },
  {
    sequence: 8,
    name: 'Kai-tatea',
    markerIds: [],
    description: 'The eighth named month is Kai-tatea.',
    sourceText: 'Kai-tatea.',
  },
  {
    sequence: 9,
    name: 'Ruhi-te-rangi',
    markerIds: [],
    description: 'The ninth named month is Ruhi-te-rangi.',
    sourceText: 'Ruhi-te-rangi.',
  },
  {
    sequence: 10,
    name: 'Poutu-te-rangi',
    markerIds: [],
    description: 'The tenth named month is Poutu-te-rangi.',
    sourceText: 'Poutu-te-rangi.',
  },
  {
    sequence: 11,
    name: 'Paenga-whāwhā',
    markerIds: [],
    description: 'The eleventh named month is Paenga-whāwhā.',
    sourceText: 'Paenga-whawha.',
  },
  {
    sequence: 12,
    name: 'Haki-haratua',
    markerIds: [],
    description: 'The twelfth named month is Haki-haratua.',
    sourceText: 'Haki-haratua.',
  },
];

const FISHING_GUIDANCE_BY_MATA_INDEX: Record<number, string[]> = {
  1: ['Mo te hi', 'Mo te rama'],
  2: [
    'Mo te hi',
    'Mo te rama',
    'Mo te whakapa',
    'Mo te whakaata',
    'Mo te taiki',
  ],
  3: [
    'Mo te hi',
    'Mo te rama',
    'Mo te whakapa',
    'Mo te taiki',
    'Mo te ngaro kai, &c.',
  ],
  4: [
    'Mo te hi',
    'Mo te rama',
    'Mo te whakapa',
    'Mo te taiki',
    'Mo te ngaro kai, &c.',
  ],
  5: [
    'Mo te hi',
    'Mo te rama',
    'Mo te taiki',
    'Mo te whakapa',
    'Mo te ngaro kai, &c.',
  ],
  6: ['Mo te rama'],
  7: ['Mo te hi'],
  8: ['Mo te hi', 'Mo te ngaro kai, &c.'],
  9: ['Mo te hi', 'Mo te ngaro kai, &c.'],
  10: ['Mo te ra he'],
  11: ['Mo te whakaata'],
  12: ['Mo te whakaata'],
  13: ['Mo te hi', 'Mo te ngaro kai, &c.', 'Mo te whakaata'],
  14: ['Mo te ra he'],
  15: ['Mo te rami', 'Mo te whakaata'],
  16: ['Mo te ngaro hue', 'Mo te rami', 'Mo te whakaata'],
  17: ['Mo te ngaro hue', 'Mo te rami', 'Mo te whakaata'],
  18: ['Mo te ngaro hue', 'Mo te rami', 'Mo te whakaata'],
  19: ['Mo te hi', 'Mo te ngaro kai, &c.'],
  20: ['Mo te rama'],
  21: ['Mo te ra he'],
  22: ['Mo te ra he'],
  23: ['Mo te ngaro hue'],
  24: [
    'Mo te hi',
    'Mo te rama',
    'Mo te whakapa',
    'Mo te turanga pawai',
    'Mo te ngaro kai, &c.',
    'Mo te taiki',
  ],
  25: [
    'Mo te hi',
    'Mo te rama',
    'Mo te whakapa',
    'Mo te whakaata',
    'Mo te taiki',
    'Mo te turanga pawai',
    'Mo te ngaro kai, &c.',
  ],
  26: ['Mo te hi', 'Mo te rama', 'Mo te taiki'],
  27: ['Mo te hi', 'Mo te rama', 'Mo te whakapa', 'Mo te whakaata'],
  28: ['Mo te hi', 'Mo te ngaro kai, &c.', 'Mo te rama'],
  29: ['Mo te hi', 'Mo te ngaro kai, &c.', 'Mo te rama'],
  30: ['Mo te hi', 'Mo te ngaro kai, &c.', 'Mo te rama'],
};

function createMata(
  index: number,
  name: string,
  phaseGroup: MataPhaseGroup,
): Mata {
  return {
    index,
    name,
    version: 'mita-te-tai-best',
    phaseGroup,
    contentLayers: [createFishingGuidanceLayer(index)],
  };
}

function createFishingGuidanceLayer(index: number): MataContentLayer {
  const recommendations = FISHING_GUIDANCE_BY_MATA_INDEX[index] ?? [];

  return {
    id: 'fishing-guidance',
    name: 'Fishing guidance',
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
    version: '1',
    status: 'available',
    description:
      'Fishing activity guidance encoded from the Mita Te Tai / Best source phrases for this mata.',
    recommendations,
  };
}

export const MITA_TE_TAI_BEST_MATA: Mata[] = [
  createMata(1, 'Whiro', PHASE_GROUPS.teMaramaIteRa),
  createMata(2, 'Tirea', PHASE_GROUPS.teHua),
  createMata(3, 'Hoata', PHASE_GROUPS.teHua),
  createMata(4, 'Ōuenuku', PHASE_GROUPS.teHua),
  createMata(5, 'Okoro', PHASE_GROUPS.teHua),
  createMata(6, 'Tāmatea-ā-ngana', PHASE_GROUPS.tamatea),
  createMata(7, 'Tāmatea-ā-hotu', PHASE_GROUPS.tamatea),
  createMata(8, 'Tāmatea-āio', PHASE_GROUPS.tamatea),
  createMata(9, 'Tāmatea-kai-ariki', PHASE_GROUPS.tamatea),
  createMata(10, 'Huna', PHASE_GROUPS.teHua),
  createMata(11, 'Ariroa', PHASE_GROUPS.teHua),
  createMata(12, 'Mauri', PHASE_GROUPS.teHua),
  createMata(13, 'Māwharu', PHASE_GROUPS.teHua),
  createMata(14, 'Ōhua', PHASE_GROUPS.teHua),
  createMata(15, 'Atua', PHASE_GROUPS.teRakau),
  createMata(16, 'Ōturu', PHASE_GROUPS.teRakau),
  createMata(17, 'Rākaunui', PHASE_GROUPS.teRakau),
  createMata(18, 'Rākaumatohi', PHASE_GROUPS.teRakau),
  createMata(19, 'Takirau', PHASE_GROUPS.teAtarau),
  createMata(20, 'Oike', PHASE_GROUPS.teAtarau),
  createMata(21, 'Korekore-te-whiwhia', PHASE_GROUPS.korekore),
  createMata(22, 'Korekore-te-rawea', PHASE_GROUPS.korekore),
  createMata(
    23,
    'Korekore-piri-ki-ngā-Tangaroa',
    PHASE_GROUPS.korekore,
  ),
  createMata(24, 'Tangaroa-ā-mua', PHASE_GROUPS.tangaroa),
  createMata(25, 'Tangaroa-ā-roto', PHASE_GROUPS.tangaroa),
  createMata(26, 'Tangaroa-kiokio', PHASE_GROUPS.tangaroa),
  createMata(27, 'Ōtāne', PHASE_GROUPS.tangaroa),
  createMata(28, 'Ōrongonui', PHASE_GROUPS.tangaroa),
  createMata(29, 'Ōmutu', PHASE_GROUPS.teMaramaIteRa),
  createMata(30, 'Mutuwhenua', PHASE_GROUPS.teMaramaIteRa),
];

export const MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET: MaramatakaRuleSet = {
  id: 'mita-te-tai-best-observational-v1',
  name: 'Mita Te Tai / Best observational maramataka',
  version: '1',
  source: MITA_TE_TAI_BEST_SOURCE,
  sourceQuote: MITA_TE_TAI_BEST_BALANCING_QUOTE,
  tradition: 'Mita Te Tai / Best',
  maramaStart: 'new-moon-observation-window-moonrise',
  mataBoundary: 'moonrise-to-moonrise',
  calibration: 'full-moon-observation-window',
  balancing: 'fixed-sequence-drop-final-mata',
  starMonthNaming: {
    strategy:
      'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
    sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
    yearStartMarkerId: 'matariki',
    yearStartDescription:
      'The year commences with Matariki appearing on the horizon at dawn.',
    source: MITA_TE_TAI_BEST_STAR_MONTH_SOURCE,
    sourceQuote: MITA_TE_TAI_BEST_STAR_MONTH_QUOTE,
    markers: MITA_TE_TAI_BEST_STAR_MONTH_MARKERS,
    months: MITA_TE_TAI_BEST_STAR_MONTH_NOTES,
  },
  mataVersion: 'mita-te-tai-best',
  mata: MITA_TE_TAI_BEST_MATA,
};
