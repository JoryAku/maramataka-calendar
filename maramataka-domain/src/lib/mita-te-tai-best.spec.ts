import { MITA_TE_TAI_BEST_MATA } from './mita-te-tai-best';

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

  it('groups mata into moon weeks', () => {
    expect(MITA_TE_TAI_BEST_MATA.map((mata) => mata.moonWeek?.id)).toEqual([
      'whiro',
      'whiro',
      'whiro',
      'whiro',
      'whiro',
      'tamatea',
      'tamatea',
      'tamatea',
      'tamatea',
      'tamatea',
      'tamatea',
      'tamatea',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'rakaunui',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
      'korekore-tangaroa',
    ]);
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
});
