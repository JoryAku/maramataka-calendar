import { StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { Mata, MataContentLayer, MataMoonWeek } from './mata';
import { MaramatakaRuleSet } from './maramataka-rule-set';

export const MITA_TE_TAI_BEST_BALANCING_QUOTE =
  '"In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara\'s notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."';

export const MITA_TE_TAI_BEST_STAR_MONTH_QUOTE =
  '"Although time passes away among them like a shadow, the unrecorded year is divided into thirteen moons, and each moon is distinguished by the rising of stars, the flowering of plants, and the arrival of two migratory birds. June is the first month of the year, and it is recognized by the appearance of the Puanga star in the morning. July is marked by the stars Kopu and Tautoru and the flowering of the karaka tree. August is distinguished by the stars Mangere and Whakaau; September by the rising of the Oetahi star and the flowering of the kowhai, rangiora, and kotukutuku trees. It is in this month that kumara are planted. October, or the fifth month, is known by the flowering of certain plants; during this month the ground is got ready for potatoes. November is characterized by the flowering of the rata and rewarewa trees. December is known by the rising of the Rehua star, the ripening of the karaka berries, and in the south part of the Island by the arrival of two cuckoos. January is distinguished by the Rehua star, the appearance of the Uruao star, and the departure of the cuckoos. In February the Rehua star still shines and the Matiti star appears; it is the dry month of the year. March is known by the ripening of the kumara, and in April they are dug up. May, or the twelfth month, often passes unnoticed. The thirteenth month is distinguished by the Puanga star, the harbinger of the new year."';

type MoonWeekKey = 'whiro' | 'tamatea' | 'rakaunui' | 'korekoreTangaroa';

const MOON_WEEKS: Record<MoonWeekKey, MataMoonWeek> = {
  whiro: { id: 'whiro', name: 'Whiro nights', sequence: 1 },
  tamatea: { id: 'tamatea', name: 'Tamatea nights', sequence: 2 },
  rakaunui: { id: 'rakaunui', name: 'Rakaunui nights', sequence: 3 },
  korekoreTangaroa: {
    id: 'korekore-tangaroa',
    name: 'Korekore and Tangaroa nights',
    sequence: 4,
  },
};

const MITA_TE_TAI_BEST_SOURCE =
  'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference';
const MITA_TE_TAI_BEST_SOURCE_URL =
  'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html';

const MITA_TE_TAI_BEST_STAR_MONTH_MARKERS = [
  {
    id: 'puanga',
    name: 'Puanga',
    type: 'star',
    englishName: 'Rigel',
    description:
      'New-year marker associated with appearance in the morning sky.',
    seasonalAssociation: 'New year / first seasonal month',
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
    confidence: 'confirmed',
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 5.2423,
      declinationDegrees: -8.2016,
    },
  },
  {
    id: 'kopu',
    name: 'Kōpū',
    type: 'planet',
    englishName: 'Venus',
    description: 'Venus as a morning-star marker in the seasonal account.',
    seasonalAssociation: 'Second seasonal month marker',
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
    confidence: 'confirmed',
    representative: {
      kind: 'body',
      body: 'Venus',
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
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
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
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
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
    sequence: 1,
    name: 'Puanga',
    markerIds: ['puanga'],
    description:
      'The first seasonal month is associated with Puanga appearing in the morning.',
    sourceText:
      'June is the first month of the year, and it is recognized by the appearance of the Puanga star in the morning.',
  },
  {
    sequence: 2,
    name: 'Kōpū / Tautoru',
    markerIds: ['kopu', 'tautoru'],
    description:
      'The second seasonal month is associated with Kōpū and Tautoru, alongside karaka flowering.',
    sourceText:
      'July is marked by the stars Kopu and Tautoru and the flowering of the karaka tree.',
  },
  {
    sequence: 3,
    name: 'Mangere / Whakaahu',
    markerIds: ['mangere', 'whakaahu'],
    description:
      'The third seasonal month is associated with Mangere and Whakaahu. Mangere is retained as an unresolved star name for later research.',
    sourceText:
      'August is distinguished by the stars Mangere and Whakaau.',
  },
  {
    sequence: 4,
    name: 'Oetahi',
    markerIds: ['oetahi'],
    description:
      'The fourth seasonal month is associated with Oetahi and spring flowering. Oetahi is retained as an unresolved star name for later research.',
    sourceText:
      'September by the rising of the Oetahi star and the flowering of the kowhai, rangiora, and kotukutuku trees.',
  },
  {
    sequence: 5,
    name: 'Planting preparation',
    markerIds: [],
    description:
      'The fifth seasonal month is described through flowering and garden preparation rather than a confirmed star marker.',
    sourceText:
      'October, or the fifth month, is known by the flowering of certain plants; during this month the ground is got ready for potatoes.',
  },
  {
    sequence: 6,
    name: 'Rata / Rewarewa flowering',
    markerIds: [],
    description:
      'The sixth seasonal month is described through the flowering of rata and rewarewa rather than a confirmed star marker.',
    sourceText:
      'November is characterized by the flowering of the rata and rewarewa trees.',
  },
  {
    sequence: 7,
    name: 'Rehua',
    markerIds: ['rehua'],
    description:
      'The seventh seasonal month is associated with Rehua, karaka berries ripening, and the southern arrival of cuckoos.',
    sourceText:
      'December is known by the rising of the Rehua star, the ripening of the karaka berries, and in the south part of the Island by the arrival of two cuckoos.',
  },
  {
    sequence: 8,
    name: 'Rehua / Uruao',
    markerIds: ['rehua', 'uruao'],
    description:
      'The eighth seasonal month is associated with Rehua, Uruao, and the departure of cuckoos.',
    sourceText:
      'January is distinguished by the Rehua star, the appearance of the Uruao star, and the departure of the cuckoos.',
  },
  {
    sequence: 9,
    name: 'Rehua / Matiti',
    markerIds: ['rehua', 'matiti'],
    description:
      'The ninth seasonal month is associated with Rehua and Matiti. Matiti is retained as an unresolved star name for later research.',
    sourceText:
      'In February the Rehua star still shines and the Matiti star appears; it is the dry month of the year.',
  },
  {
    sequence: 10,
    name: 'Kumara ripening',
    markerIds: [],
    description:
      'The tenth seasonal month is described through kumara ripening rather than a confirmed star marker.',
    sourceText: 'March is known by the ripening of the kumara.',
  },
  {
    sequence: 11,
    name: 'Kumara harvest',
    markerIds: [],
    description:
      'The eleventh seasonal month is described through kumara harvest rather than a confirmed star marker.',
    sourceText: 'In April they are dug up.',
  },
  {
    sequence: 12,
    name: 'Often unnoticed',
    markerIds: [],
    description:
      'The twelfth seasonal month is recorded as often passing unnoticed.',
    sourceText: 'May, or the twelfth month, often passes unnoticed.',
  },
  {
    sequence: 13,
    name: 'Puanga',
    markerIds: ['puanga'],
    description:
      'The thirteenth seasonal month is associated with Puanga as the harbinger of the new year.',
    sourceText:
      'The thirteenth month is distinguished by the Puanga star, the harbinger of the new year.',
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

function createMata(index: number, name: string, moonWeek: MataMoonWeek): Mata {
  return {
    index,
    name,
    version: 'mita-te-tai-best',
    moonWeek,
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
  createMata(1, 'Whiro', MOON_WEEKS.whiro),
  createMata(2, 'Tirea', MOON_WEEKS.whiro),
  createMata(3, 'Ohoata', MOON_WEEKS.whiro),
  createMata(4, 'Oue', MOON_WEEKS.whiro),
  createMata(5, 'Okoro', MOON_WEEKS.whiro),
  createMata(6, 'Tamatea', MOON_WEEKS.tamatea),
  createMata(7, 'Tamatea-ngana', MOON_WEEKS.tamatea),
  createMata(8, 'Tamatea-aio', MOON_WEEKS.tamatea),
  createMata(9, 'Tamatea-whakapau', MOON_WEEKS.tamatea),
  createMata(10, 'Huna', MOON_WEEKS.tamatea),
  createMata(11, 'Ari', MOON_WEEKS.tamatea),
  createMata(12, 'Hotu', MOON_WEEKS.tamatea),
  createMata(13, 'Mawharu', MOON_WEEKS.rakaunui),
  createMata(14, 'Atua', MOON_WEEKS.rakaunui),
  createMata(15, 'Ohua', MOON_WEEKS.rakaunui),
  createMata(16, 'Turu', MOON_WEEKS.rakaunui),
  createMata(17, 'Rakau-nui', MOON_WEEKS.rakaunui),
  createMata(18, 'Rakau-matohi', MOON_WEEKS.rakaunui),
  createMata(19, 'Takirau', MOON_WEEKS.rakaunui),
  createMata(20, 'Oike', MOON_WEEKS.rakaunui),
  createMata(21, 'Korekore', MOON_WEEKS.korekoreTangaroa),
  createMata(22, 'Korekore-turua', MOON_WEEKS.korekoreTangaroa),
  createMata(
    23,
    'Korekore whakapiri ki nga Tangaroa',
    MOON_WEEKS.korekoreTangaroa,
  ),
  createMata(24, 'Tangaroa-amua', MOON_WEEKS.korekoreTangaroa),
  createMata(25, 'Tangaroa-aroto', MOON_WEEKS.korekoreTangaroa),
  createMata(26, 'Tangaroa-kiokio', MOON_WEEKS.korekoreTangaroa),
  createMata(27, 'Otane', MOON_WEEKS.korekoreTangaroa),
  createMata(28, 'Orongonui', MOON_WEEKS.korekoreTangaroa),
  createMata(29, 'Maurea', MOON_WEEKS.korekoreTangaroa),
  createMata(30, 'Mutu', MOON_WEEKS.korekoreTangaroa),
];

export const MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET: MaramatakaRuleSet = {
  id: 'mita-te-tai-best-observational-v1',
  name: 'Mita Te Tai / Best observational maramataka',
  version: '1',
  source: MITA_TE_TAI_BEST_SOURCE,
  sourceQuote: MITA_TE_TAI_BEST_BALANCING_QUOTE,
  tradition: 'Mita Te Tai / Best',
  maramaStart: 'new-moon-moonrise',
  mataBoundary: 'moonrise-to-moonrise',
  calibration: 'full-moon-ohua',
  balancing: 'duplicate-ohua-drop-final-mata',
  starMonthNaming: {
    strategy:
      'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
    sampleTimeLocal: '06:00',
    source: MITA_TE_TAI_BEST_SOURCE,
    sourceUrl: MITA_TE_TAI_BEST_SOURCE_URL,
    sourceQuote: MITA_TE_TAI_BEST_STAR_MONTH_QUOTE,
    markers: MITA_TE_TAI_BEST_STAR_MONTH_MARKERS,
    months: MITA_TE_TAI_BEST_STAR_MONTH_NOTES,
  },
  mataVersion: 'mita-te-tai-best',
  mata: MITA_TE_TAI_BEST_MATA,
};
