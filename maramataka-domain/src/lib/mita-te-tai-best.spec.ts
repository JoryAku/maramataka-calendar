import {
  MITA_TE_TAI_BEST_MATA,
  MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET,
} from './mita-te-tai-best';

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

  it('groups mata into lunar phase groups', () => {
    expect(MITA_TE_TAI_BEST_MATA.map((mata) => mata.phaseGroup?.name)).toEqual([
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
      'Te Atarau',
      'Korekore',
      'Korekore',
      'Korekore',
      'Tangaroa',
      'Tangaroa',
      'Tangaroa',
      'Tangaroa',
      'Tangaroa',
      'Te Marama i te rā',
      'Te Marama i te rā',
    ]);
  });

  it('adds fishing guidance as a content layer', () => {
    MITA_TE_TAI_BEST_MATA.forEach((mata) => {
      expect(mata.contentLayers?.[0]).toMatchObject({
        id: 'fishing-guidance',
        name: 'Fishing guidance',
        source:
          'Living by the Stars (mata phase-group reference); Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
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

  it('defines star month naming on the rule set', () => {
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming,
    ).toMatchObject({
      strategy:
        'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
      sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
      yearStartMarkerId: 'matariki',
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
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming?.markers.every(
        (marker) =>
          marker.dawnRising?.startSunAltitudeDegrees === -18 &&
          marker.dawnRising.endSunAltitudeDegrees === 0 &&
          marker.dawnRising.minimumMarkerAltitudeDegrees === 0 &&
          marker.dawnRising.minimumAzimuthDegrees === 45 &&
          marker.dawnRising.maximumAzimuthDegrees === 135 &&
          marker.dawnRising.sampleMinutes === 5,
      ),
    ).toBe(true);
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming?.months,
    ).toHaveLength(13);
    expect(
      MITA_TE_TAI_BEST_OBSERVATIONAL_RULE_SET.starMonthNaming?.months[0],
    ).toMatchObject({
      name: 'Ruhanui',
      sequence: 0,
      markerIds: [],
    });
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
