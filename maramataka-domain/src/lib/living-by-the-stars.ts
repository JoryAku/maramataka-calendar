import { StarMarkerDefinition } from '@maramataka-calendar/astronomy';
import { Mata, MataPhaseGroup } from './mata';
import { MaramatakaRuleSet } from './maramataka-rule-set';

export const LIVING_BY_THE_STARS_SOURCE = 'Living by the Stars';
export const LIVING_BY_THE_STARS_SOURCE_QUOTE =
  'Tohua ai nga marama o te Maori e nga whetu ka rewa i te atapo, ka mutu ka tapaina nga marama e hangai ana ki nga ingoa o aua whetu ra.';

const LIVING_BY_THE_STARS_DAWN_RISING_CONFIG = {
  startSunAltitudeDegrees: -18,
  endSunAltitudeDegrees: 0,
  minimumMarkerAltitudeDegrees: 0,
  minimumAzimuthDegrees: 0,
  maximumAzimuthDegrees: 135,
  sampleMinutes: 5,
};

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

const LIVING_BY_THE_STARS_YEAR_START_MARKER = {
  id: 'matariki',
  name: 'Matariki',
  type: 'asterism',
  englishName: 'Pleiades',
  description:
    'Pleiades; retained as the year-start and Ruhanui calibration marker for the current astronomy-only rule.',
  seasonalAssociation: 'Year-start calibration marker',
  source: 'Project Matariki / Ruhanui calibration notes',
  confidence: 'working',
  dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
  representative: {
    kind: 'fixed-equatorial',
    rightAscensionHours: 3.7914,
    declinationDegrees: 24.1051,
  },
} satisfies StarMarkerDefinition;

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
  };
}

export const LIVING_BY_THE_STARS_MATA: Mata[] = [
  createMata(1, 'Whiro', PHASE_GROUPS.teMaramaIteRa),
  createMata(2, 'Tirea', PHASE_GROUPS.teHua),
  createMata(3, 'Hoata', PHASE_GROUPS.teHua),
  createMata(4, 'Ōuenuku', PHASE_GROUPS.teHua),
  createMata(5, 'Okoro', PHASE_GROUPS.teHua),
  createMata(6, 'Tamatea-āio', PHASE_GROUPS.tamatea),
  createMata(7, 'Tamatea-angana', PHASE_GROUPS.tamatea),
  createMata(8, 'Tamatea-kai-ariki', PHASE_GROUPS.tamatea),
  createMata(9, 'Tamatea Tūhāhā', PHASE_GROUPS.tamatea),
  createMata(10, 'Aria', PHASE_GROUPS.teHua),
  createMata(11, 'Huna', PHASE_GROUPS.teHua),
  createMata(12, 'Māwharu', PHASE_GROUPS.teHua),
  createMata(13, 'Ōhua', PHASE_GROUPS.teHua),
  createMata(14, 'Atua Whakahaehae', PHASE_GROUPS.teHua),
  createMata(15, 'Turu', PHASE_GROUPS.teRakau),
  createMata(16, 'Rākaunui', PHASE_GROUPS.teRakau),
  createMata(17, 'Rākaumatohi', PHASE_GROUPS.teRakau),
  createMata(18, 'Takirau', PHASE_GROUPS.teRakau),
  createMata(19, 'Oike', PHASE_GROUPS.teAtarau),
  createMata(20, 'Korekore Tuatahi', PHASE_GROUPS.korekore),
  createMata(21, 'Korekore Rawea', PHASE_GROUPS.korekore),
  createMata(22, 'Korekore whakapiri', PHASE_GROUPS.korekore),
  createMata(23, 'Tangaroa-ā-mua', PHASE_GROUPS.tangaroa),
  createMata(24, 'Tangaroa-ā-roto', PHASE_GROUPS.tangaroa),
  createMata(25, 'Tangaroa-whakapau', PHASE_GROUPS.tangaroa),
  createMata(26, 'Tangaroa whāriki kio-kio', PHASE_GROUPS.tangaroa),
  createMata(27, 'Ōtāne', PHASE_GROUPS.teAtarau),
  createMata(28, 'Ōrongonui', PHASE_GROUPS.teAtarau),
  createMata(29, 'Ōmutu', PHASE_GROUPS.teMaramaIteRa),
  createMata(30, 'Mutuwhenua', PHASE_GROUPS.teMaramaIteRa),
];

export const LIVING_BY_THE_STARS_STAR_MONTH_MARKERS = [
  {
    id: 'pipiri',
    name: 'Pipiri',
    type: 'star',
    englishName: 'Hamal',
    description:
      'Hamal in Aries; Living by the Stars notes Te Tahi o Pipiri most often aligns to Hamal alone.',
    seasonalAssociation: 'First named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 2.1196,
      declinationDegrees: 23.4624,
    },
  },
  {
    id: 'takurua',
    name: 'Takurua',
    type: 'star',
    englishName: 'Sirius',
    description: 'Sirius in Canis Major.',
    seasonalAssociation: 'Second named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 6.7525,
      declinationDegrees: -16.7161,
    },
  },
  {
    id: 'te-toru-here-o-pipiri',
    name: 'Te Toru Here o Pipiri',
    type: 'star',
    englishName: 'Zeta Persei',
    description: 'Zeta Persei.',
    seasonalAssociation: 'Third named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 3.9022,
      declinationDegrees: 31.8836,
    },
  },
  {
    id: 'mahuru',
    name: 'Mahuru',
    type: 'star',
    englishName: 'Alphard',
    description: 'Alphard in Hydra.',
    seasonalAssociation: 'Fourth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 9.4598,
      declinationDegrees: -8.6586,
    },
  },
  {
    id: 'kopu',
    name: 'Kōpū',
    type: 'planet',
    englishName: 'Venus',
    description: 'Venus.',
    seasonalAssociation: 'Fifth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'body',
      body: 'Venus',
    },
  },
  {
    id: 'whitianau-nau',
    name: 'Whitiānaunau',
    type: 'star',
    englishName: 'Algieba',
    description: 'Algieba in Leo.',
    seasonalAssociation: 'Sixth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 10.3329,
      declinationDegrees: 19.8415,
    },
  },
  {
    id: 'hakihea',
    name: 'Hakihea',
    type: 'star',
    englishName: 'Menkent',
    description: 'Menkent in Centaurus.',
    seasonalAssociation: 'Seventh named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 14.1114,
      declinationDegrees: -36.37,
    },
  },
  {
    id: 'rehua',
    name: 'Rehua',
    type: 'star',
    englishName: 'Antares',
    description: 'Antares in Scorpius.',
    seasonalAssociation: 'Eighth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 16.4901,
      declinationDegrees: -26.432,
    },
  },
  {
    id: 'ruhi',
    name: 'Rūhī',
    type: 'star',
    englishName: 'Alniyat',
    description: 'Alniyat in Scorpius.',
    seasonalAssociation: 'Ninth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 16.3531,
      declinationDegrees: -25.5928,
    },
  },
  {
    id: 'poututerangi',
    name: 'Poutūterangi',
    type: 'star',
    englishName: 'Altair',
    description: 'Altair in Aquila.',
    seasonalAssociation: 'Tenth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 19.8464,
      declinationDegrees: 8.8683,
    },
  },
  {
    id: 'paengawhawha',
    name: 'Paengawhāwhā',
    type: 'star',
    englishName: 'Enif',
    description: 'Enif in Pegasus.',
    seasonalAssociation: 'Eleventh named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 21.7364,
      declinationDegrees: 9.875,
    },
  },
  {
    id: 'haki-haratua',
    name: 'Haki Haratua',
    type: 'star',
    englishName: 'Matar',
    description: 'Matar in Pegasus.',
    seasonalAssociation: 'Twelfth named month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 22.7167,
      declinationDegrees: 30.2213,
    },
  },
  {
    id: 'ruhanui',
    name: 'Ruhanui',
    type: 'star',
    englishName: 'Sharatan',
    description:
      'Sharatan in Aries; Living by the Stars names Ruhanui from Sharatan.',
    seasonalAssociation: 'Intercalary regulating month marker',
    source: LIVING_BY_THE_STARS_SOURCE,
    confidence: 'confirmed',
    dawnRising: LIVING_BY_THE_STARS_DAWN_RISING_CONFIG,
    representative: {
      kind: 'fixed-equatorial',
      rightAscensionHours: 1.9107,
      declinationDegrees: 20.808,
    },
  },
] satisfies StarMarkerDefinition[];

export const LIVING_BY_THE_STARS_STAR_MONTH_NOTES = [
  {
    sequence: 0,
    name: 'Ruhanui',
    markerIds: ['ruhanui'],
    description:
      'Ruhanui is the intercalary regulating marama, named from Sharatan in Aries.',
    sourceText: 'Ko Ruhanui te ingoa Maori o Sharatan kei te kahui o Aries.',
  },
  {
    sequence: 1,
    name: 'Te Tahi o Pipiri',
    markerIds: ['pipiri'],
    description:
      'The first named marama, associated most often with Hamal in Aries.',
    sourceText:
      'Ko Pipiri nga whetu tokorua, a Hamal raua ko Sharatan, kei te kahui o Aries. Heoi ano, i te nuinga o te wa, ka hangai ke Te Tahi o Pipiri ki a Hamal anake.',
  },
  {
    sequence: 2,
    name: 'Te Rua o Takurua',
    markerIds: ['takurua'],
    description: 'The second named marama, associated with Sirius.',
    sourceText:
      'Ko Takurua te ingoa Maori o Sirius kei te kahui o Canis Major.',
  },
  {
    sequence: 3,
    name: 'Te Toru Here o Pipiri',
    markerIds: ['te-toru-here-o-pipiri'],
    description: 'The third named marama, associated with Zeta Persei.',
    sourceText: 'Ko Te Toru Here o Pipiri te ingoa Maori o Zeta Persei.',
  },
  {
    sequence: 4,
    name: 'Te Whā o Mahuru',
    markerIds: ['mahuru'],
    description: 'The fourth named marama, associated with Alphard.',
    sourceText: 'Ko Mahuru te ingoa Maori o Alphard kei te kahui o Hydra.',
  },
  {
    sequence: 5,
    name: 'Te Rima o Kōpū',
    markerIds: ['kopu'],
    description: 'The fifth named marama, associated with Venus.',
    sourceText: 'Ko Kopu te ingoa Maori o Venus.',
  },
  {
    sequence: 6,
    name: 'Te Ono o Whitiānaunau',
    markerIds: ['whitianau-nau'],
    description: 'The sixth named marama, associated with Algieba.',
    sourceText: 'Ko Whitianaunau te ingoa Maori o Algieba kei te kahui o Leo.',
  },
  {
    sequence: 7,
    name: 'Te Whitu o Hakihea',
    markerIds: ['hakihea'],
    description: 'The seventh named marama, associated with Menkent.',
    sourceText: 'Ko Hakihea te ingoa Maori o Menkent kei te kahui o Centaurus.',
  },
  {
    sequence: 8,
    name: 'Te Waru o Rehua',
    markerIds: ['rehua'],
    description: 'The eighth named marama, associated with Antares.',
    sourceText: 'Ko Rehua te ingoa Maori o Antares kei te kahui o Scorpius.',
  },
  {
    sequence: 9,
    name: 'Te Iwa o Rūhī',
    markerIds: ['ruhi'],
    description: 'The ninth named marama, associated with Alniyat.',
    sourceText: 'Ko Ruhi te ingoa Maori o Alniyat kei te kahui o Scorpius.',
  },
  {
    sequence: 10,
    name: 'Te Ngahuru o Poutūterangi',
    markerIds: ['poututerangi'],
    description: 'The tenth named marama, associated with Altair.',
    sourceText:
      'Ko Poututerangi te ingoa Maori o Altair kei te kahui o Aquila.',
  },
  {
    sequence: 11,
    name: 'Te Ngahuru mā tahi o Paengawhāwhā',
    markerIds: ['paengawhawha'],
    description: 'The eleventh named marama, associated with Enif.',
    sourceText: 'Ko Paengawhawha te ingoa Maori o Enif kei te kahui o Pegasus.',
  },
  {
    sequence: 12,
    name: 'Te Ngahuru mā rua o Haki Haratua',
    markerIds: ['haki-haratua'],
    description: 'The twelfth named marama, associated with Matar in Pegasus.',
    sourceText:
      'Ko Haki Haratua te ingoa Maori o Matar kei te kahui o Pegasus.',
  },
];

export const LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET: MaramatakaRuleSet = {
  id: 'living-by-the-stars-observational-v1',
  name: 'Living by the Stars observational maramataka',
  version: '1',
  source: LIVING_BY_THE_STARS_SOURCE,
  sourceQuote: LIVING_BY_THE_STARS_SOURCE_QUOTE,
  tradition: 'Living by the Stars',
  maramaStart: 'new-moon-observation-window-moonrise',
  mataBoundary: 'moonrise-to-moonrise',
  calibration: 'full-moon-observation-window',
  balancing: 'fixed-sequence-drop-final-mata',
  yearStartRule: {
    strategy:
      'Use the configured marker to calibrate Matariki/Ruhanui placement after Pipiri / Hamal has set Te Tahi o Pipiri.',
    marker: LIVING_BY_THE_STARS_YEAR_START_MARKER,
    description:
      'The active Living by the Stars year starts from Pipiri / Hamal in the starMonthNaming layer; Matariki is retained here as the astronomy-only Ruhanui and holiday calibration marker.',
    source: 'Project Matariki / Ruhanui calibration notes',
  },
  starMonthNaming: {
    strategy:
      'Marama are named from the stars that rise in the north-through-east dawn sky.',
    sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
    source: LIVING_BY_THE_STARS_SOURCE,
    sourceQuote: LIVING_BY_THE_STARS_SOURCE_QUOTE,
    markers: LIVING_BY_THE_STARS_STAR_MONTH_MARKERS,
    months: LIVING_BY_THE_STARS_STAR_MONTH_NOTES,
  },
  mataVersion: 'mita-te-tai-best',
  mata: LIVING_BY_THE_STARS_MATA,
};
