import {
  NewMoon,
  Sunset,
} from './astronomy-provider';

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
});