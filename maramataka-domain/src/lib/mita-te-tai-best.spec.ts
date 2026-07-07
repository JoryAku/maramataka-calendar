import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';
import {
  LIVING_BY_THE_STARS_MATA,
  LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET,
} from './living-by-the-stars';

describe('MITA_TE_TAI_BEST_MATA', () => {
  it('starts with Whiro', () => {
    expect(MITA_TE_TAI_BEST_MATA[0].name).toBe('Whiro');
  });

  it('has 30 mata', () => {
    expect(MITA_TE_TAI_BEST_MATA).toHaveLength(30);
  });

  it('has sequential indexes', () => {
    MITA_TE_TAI_BEST_MATA.forEach((mata, i) => {
      expect(mata.index).toBe(i + 1);
    });
  });

  it('adds fishing guidance as a content layer', () => {
    MITA_TE_TAI_BEST_MATA.forEach((mata) => {
      expect(mata.contentLayers?.[0]).toMatchObject({
        id: 'fishing-guidance',
        name: 'Fishing guidance',
        source:
          'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
        sourceUrl:
          'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html',
        version: '1',
        status: 'available',
      });
      expect(mata.contentLayers?.[0].recommendations?.length).toBeGreaterThan(
        0,
      );
    });
  });

  it('keeps source fishing phrases on the relevant mata', () => {
    expect(MITA_TE_TAI_BEST_MATA[0].contentLayers?.[0].recommendations).toEqual(
      ['Mo te hi', 'Mo te rama'],
    );
    expect(
      MITA_TE_TAI_BEST_MATA[24].contentLayers?.[0].recommendations,
    ).toEqual([
      'Mo te hi',
      'Mo te rama',
      'Mo te whakapa',
      'Mo te whakaata',
      'Mo te taiki',
      'Mo te turanga pawai',
      'Mo te ngaro kai, &c.',
    ]);
  });

  it('defines Best star month naming on the rule set', () => {
    expect(MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.yearStartRule).toMatchObject(
      {
        strategy:
          'Start Te Tahi o Pipiri at the first Whiro after the configured year-start marker rises at dawn.',
        marker: {
          id: 'matariki',
          name: 'Matariki',
        },
        description:
          'The year commences with Matariki appearing on the horizon at dawn.',
        source: 'Elsdon Best, The Maori Division of Time',
      },
    );
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming,
    ).toMatchObject({
      strategy:
        'Marama is named from a rule-set star or asterism rising in the north-through-east dawn sky around Whiro',
      sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
      source: 'Elsdon Best, The Maori Division of Time',
    });
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.map(
        (marker) => marker.name,
      ),
    ).toEqual([
      'Matariki',
      'Kōpū',
      'Takurua',
      'Tautoru',
      'Whakaahu',
      'Rehua',
      'Uruao',
    ]);
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming?.months[1],
    ).toMatchObject({
      name: 'Te Tahi o Pipiri',
      sequence: 1,
      markerIds: ['matariki'],
      sourceText: expect.stringContaining('Matariki'),
    });
  });
});

describe('LIVING_BY_THE_STARS_MATA', () => {
  it('has 30 sequential mata', () => {
    expect(LIVING_BY_THE_STARS_MATA).toHaveLength(30);
    LIVING_BY_THE_STARS_MATA.forEach((mata, i) => {
      expect(mata.index).toBe(i + 1);
    });
  });

  it('uses the Living by the Stars mata sequence', () => {
    expect(LIVING_BY_THE_STARS_MATA.map((mata) => mata.name)).toEqual([
      'Whiro',
      'Tirea',
      'Hoata',
      'Ōuenuku',
      'Okoro',
      'Tamatea-āio',
      'Tamatea-angana',
      'Tamatea-kai-ariki',
      'Tamatea Tūhāhā',
      'Aria',
      'Huna',
      'Māwharu',
      'Ōhua',
      'Atua Whakahaehae',
      'Turu',
      'Rākaunui',
      'Rākaumatohi',
      'Takirau',
      'Oike',
      'Korekore Tuatahi',
      'Korekore Rawea',
      'Korekore whakapiri',
      'Tangaroa-ā-mua',
      'Tangaroa-ā-roto',
      'Tangaroa-whakapau',
      'Tangaroa whāriki kio-kio',
      'Ōtāne',
      'Ōrongonui',
      'Ōmutu',
      'Mutuwhenua',
    ]);
  });

  it('keeps the rule-set version separate from the mata sequence version', () => {
    expect(LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.version).toBe('1');
    expect(LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.mataVersion).toBe(
      'living-by-the-star',
    );
    expect(
      LIVING_BY_THE_STARS_MATA.every(
        (mata) => mata.version === 'living-by-the-star',
      ),
    ).toBe(true);
  });

  it('groups mata into lunar phase groups', () => {
    expect(
      LIVING_BY_THE_STARS_MATA.map((mata) => mata.phaseGroup?.name),
    ).toEqual([
      'Te Marama i te rā',
      'Te Hua',
      'Te Hua',
      'Te Hua',
      'Te Hua',
      'Tāmatea',
      'Tāmatea',
      'Tāmatea',
      'Tāmatea',
      'Te Hua',
      'Te Hua',
      'Te Hua',
      'Te Hua',
      'Te Hua',
      'Te Rākau',
      'Te Rākau',
      'Te Rākau',
      'Te Rākau',
      'Te Atarau',
      'Korekore',
      'Korekore',
      'Korekore',
      'Tangaroa',
      'Tangaroa',
      'Tangaroa',
      'Tangaroa',
      'Te Atarau',
      'Te Atarau',
      'Te Marama i te rā',
      'Te Marama i te rā',
    ]);
  });

  it('defines Living by the Stars month naming on the rule set', () => {
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.yearStartRule,
    ).toMatchObject({
      strategy:
        'Use Pipiri / Hamal to find the candidate Te Tahi o Pipiri Whiro, then use Matariki first visibility and the candidate-year New Moon count to keep Pipiri, shift Pipiri, or insert Ruhanui.',
      marker: {
        id: 'pipiri',
        name: 'Pipiri',
      },
      source: 'Living by the Stars 2021-2024 calendars',
    });
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.matarikiHoliday,
    ).toMatchObject({
      calibrationMarker: {
        id: 'matariki',
        name: 'Matariki',
      },
    });
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming,
    ).toMatchObject({
      strategy:
        'Marama are named from the stars that rise in the north-through-east dawn sky.',
      sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
      source: 'Living by the Stars 2021-2024 calendars',
    });
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.map(
        (marker) => marker.name,
      ),
    ).toEqual([
      'Pipiri',
      'Takurua',
      'Te Toru Here o Pipiri',
      'Mahuru',
      'Kōpū',
      'Whitiānaunau',
      'Hakihea',
      'Rehua',
      'Rūhī',
      'Poutūterangi',
      'Paengawhāwhā',
      'Haki Haratua',
      'Ruhanui',
    ]);
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.every(
        (marker) =>
          marker.dawnRising?.startSunAltitudeDegrees === -18 &&
          marker.dawnRising.endSunAltitudeDegrees === 0 &&
          marker.dawnRising.minimumMarkerAltitudeDegrees === 0 &&
          marker.dawnRising.minimumAzimuthDegrees === 0 &&
          marker.dawnRising.maximumAzimuthDegrees === 180 &&
          marker.dawnRising.sampleMinutes === 5,
      ),
    ).toBe(true);
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months,
    ).toHaveLength(13);
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months.map(
        (month) => month.name,
      ),
    ).toEqual([
      'Ruhanui',
      'Te Tahi o Pipiri',
      'Te Rua o Takurua',
      'Te Toru Here o Pipiri',
      'Te Whā o Mahuru',
      'Te Rima o Kōpū',
      'Te Ono o Whitiānaunau',
      'Te Whitu o Hakihea',
      'Te Waru o Rehua',
      'Te Iwa o Rūhī',
      'Te Ngahuru o Poutūterangi',
      'Te Ngahuru mā tahi o Paengawhāwhā',
      'Te Ngahuru mā rua o Haki Haratua',
    ]);
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months[0],
    ).toMatchObject({
      name: 'Ruhanui',
      sequence: 0,
      markerIds: ['ruhanui'],
    });
    expect(
      LIVING_BY_THE_STARS_OBSERVATIONAL_RULE_SET.starMonthNaming?.months[1],
    ).toMatchObject({
      name: 'Te Tahi o Pipiri',
      sequence: 1,
      markerIds: ['pipiri'],
      sourceText: expect.stringContaining('Hamal'),
    });
  });
});
