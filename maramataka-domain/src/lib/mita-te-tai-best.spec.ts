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

  it('marks guidance content as explicitly unavailable until encoded', () => {
    MITA_TE_TAI_BEST_MATA.forEach((mata) => {
      expect(mata.contentLayers).toEqual([
        {
          id: 'general-guidance',
          name: 'General guidance',
          source:
            'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
          version: '1',
          status: 'unavailable',
          unavailableReason: 'General activity guidance has not been encoded yet.',
        },
      ]);
    });
  });
});
