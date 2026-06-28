import { Mata } from './mata';
import { MaramatakaRuleSet } from './maramataka-rule-set';

export const MITA_TE_TAI_BEST_BALANCING_QUOTE =
  '"In the original, No. 1 (the Whiro night) is marked "kohititanga" a word employed to denote the appearance of the new moon. Nos. 15, 16, and 17 are marked "huanga," denoting full moon. Apparently the commencement of the lunar month was not always precisely fixed, for Metara\'s notebook contained a statement to the effect that sometimes the full moon (Ohua) appeared on the 16th night, or even on the 17th, in which latter case the 15th, 16th, and 17th nights would all be called Ohua, and several of the final night names of the list would be dropped for that month. This would be for the purpose of balancing the lunar month."';

export const MITA_TE_TAI_BEST_MATA: Mata[] = [
  { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
  { index: 2, name: 'Tirea', version: 'mita-te-tai-best' },
  { index: 3, name: 'Ohoata', version: 'mita-te-tai-best' },
  { index: 4, name: 'Oue', version: 'mita-te-tai-best' },
  { index: 5, name: 'Okoro', version: 'mita-te-tai-best' },
  { index: 6, name: 'Tamatea', version: 'mita-te-tai-best' },
  { index: 7, name: 'Tamatea-ngana', version: 'mita-te-tai-best' },
  { index: 8, name: 'Tamatea-aio', version: 'mita-te-tai-best' },
  { index: 9, name: 'Tamatea-whakapau', version: 'mita-te-tai-best' },
  { index: 10, name: 'Huna', version: 'mita-te-tai-best' },
  { index: 11, name: 'Ari', version: 'mita-te-tai-best' },
  { index: 12, name: 'Hotu', version: 'mita-te-tai-best' },
  { index: 13, name: 'Mawharu', version: 'mita-te-tai-best' },
  { index: 14, name: 'Atua', version: 'mita-te-tai-best' },
  { index: 15, name: 'Ohua', version: 'mita-te-tai-best' },
  { index: 16, name: 'Turu', version: 'mita-te-tai-best' },
  { index: 17, name: 'Rakau-nui', version: 'mita-te-tai-best' },
  { index: 18, name: 'Rakau-matohi', version: 'mita-te-tai-best' },
  { index: 19, name: 'Takirau', version: 'mita-te-tai-best' },
  { index: 20, name: 'Oike', version: 'mita-te-tai-best' },
  { index: 21, name: 'Korekore', version: 'mita-te-tai-best' },
  { index: 22, name: 'Korekore-turua', version: 'mita-te-tai-best' },
  { index: 23, name: 'Korekore whakapiri ki nga Tangaroa', version: 'mita-te-tai-best' },
  { index: 24, name: 'Tangaroa-amua', version: 'mita-te-tai-best' },
  { index: 25, name: 'Tangaroa-aroto', version: 'mita-te-tai-best' },
  { index: 26, name: 'Tangaroa-kiokio', version: 'mita-te-tai-best' },
  { index: 27, name: 'Otane', version: 'mita-te-tai-best' },
  { index: 28, name: 'Orongonui', version: 'mita-te-tai-best' },
  { index: 29, name: 'Maurea', version: 'mita-te-tai-best' },
  { index: 30, name: 'Mutu', version: 'mita-te-tai-best' },
];

export const MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET: MaramatakaRuleSet = {
  id: 'mita-te-tai-best-observational-v1',
  name: 'Mita Te Tai / Best observational maramataka',
  version: '1',
  source:
    'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
  sourceQuote: MITA_TE_TAI_BEST_BALANCING_QUOTE,
  tradition: 'Mita Te Tai / Best',
  maramaStart: 'new-moon-moonrise',
  mataBoundary: 'moonrise-to-moonrise',
  calibration: 'full-moon-ohua',
  balancing: 'duplicate-ohua-drop-final-mata',
  mataVersion: 'mita-te-tai-best',
  mata: MITA_TE_TAI_BEST_MATA,
};
