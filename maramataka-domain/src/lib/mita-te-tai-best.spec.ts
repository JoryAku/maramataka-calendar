import { MITA_TE_TAI_BEST_MATA } from './mita-te-tai-best';

describe('MITA_TE_TAI_BEST_MATA', () => {
  it('starts with Whiro', () => {
    expect(MITA_TE_TAI_BEST_MATA[0].name).toBe('Whiro');
    expect(MITA_TE_TAI_BEST_MATA[0].description).toContain('Mo te hi');
    expect(MITA_TE_TAI_BEST_MATA[0].description).toContain('Mo te rama');
  });

  it('has 30 mata', () => {
    expect(MITA_TE_TAI_BEST_MATA).toHaveLength(30);
  });
});