import { UsnoAstronomyProvider } from './usno-astronomy-provider';

describe('UsnoAstronomyProvider', () => {
  it('can be created', () => {
    expect(new UsnoAstronomyProvider()).toBeTruthy();
  });

  it('accepts a custom fetch function', async () => {
    const fetchFn = jest.fn();

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    expect(provider).toBeTruthy();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('requests moon phases for a year from USNO', async () => {
    const json = jest.fn().mockResolvedValue({ phasedata: [] });

    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json,
    });

    const provider = new UsnoAstronomyProvider(fetchFn as typeof fetch);

    await provider.getNewMoons(2026);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/moon/phases/year?year=2026')
    );
  });
});