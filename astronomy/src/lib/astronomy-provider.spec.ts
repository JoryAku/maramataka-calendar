import { MoonRiseSet, NewMoon, Sunset } from './astronomy-provider';

describe('AstronomyProvider', () => {
  it('defines a NewMoon shape', () => {
    const moon: NewMoon = {
      occursAt: new Date(),
      source: 'usno',
    };

    expect(moon.occursAt).toBeInstanceOf(Date);
  });

  it('defines a Sunset shape', () => {
    const sunset: Sunset = {
      date: '2026-01-01',
      occursAt: new Date(),
      source: 'usno',
    };

    expect(sunset.date).toBe('2026-01-01');
  });

  it('defines a MoonRiseSet shape', () => {
    const moonRiseSet: MoonRiseSet = {
      date: '2026-01-01',
      risesAt: new Date(),
      setsAt: new Date(),
      source: 'usno',
    };

    expect(moonRiseSet.date).toBe('2026-01-01');
    expect(moonRiseSet.risesAt).toBeInstanceOf(Date);
    expect(moonRiseSet.setsAt).toBeInstanceOf(Date);
  });
});
