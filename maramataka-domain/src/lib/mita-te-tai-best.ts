import { Mata, MataContentLayer, MataMoonWeek } from './mata';
import { MaramatakaRuleSet } from './maramataka-rule-set';

export const MITA_TE_TAI_BEST_BALANCING_QUOTE =
  '"In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara\'s notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."';

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
  mataVersion: 'mita-te-tai-best',
  mata: MITA_TE_TAI_BEST_MATA,
};
