import { calculateLunarAgeDays } from './moon-metrics';

describe('moon metrics', () => {
  it('calculates lunar age from the previous USNO New Moon phase', () => {
    const age = calculateLunarAgeDays(new Date('2026-01-20T00:00:00.000Z'), [
      {
        phase: 'New Moon',
        occursAt: new Date('2026-01-18T19:52:00.000Z'),
        source: 'usno',
      },
      {
        phase: 'Full Moon',
        occursAt: new Date('2026-02-01T22:09:00.000Z'),
        source: 'usno',
      },
    ]);

    expect(age).toBe(1.17);
  });

  it('returns undefined lunar age when no previous New Moon is available', () => {
    const age = calculateLunarAgeDays(new Date('2026-01-20T00:00:00.000Z'), [
      {
        phase: 'New Moon',
        occursAt: new Date('2026-02-17T12:01:00.000Z'),
        source: 'usno',
      },
    ]);

    expect(age).toBeUndefined();
  });

});
