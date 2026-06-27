import {
  FullMoon,
  MoonDetails,
  MoonPhase,
  MoonRise,
  MoonRiseSet,
  MoonTransit,
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

  it('defines a FullMoon shape', () => {
    const moon: FullMoon = {
      occursAt: new Date(),
      source: 'usno',
    };

    expect(moon.occursAt).toBeInstanceOf(Date);
  });

  it('defines a MoonPhase shape', () => {
    const phase: MoonPhase = {
      phase: 'Full Moon',
      occursAt: new Date(),
      source: 'usno',
    };

    expect(phase.phase).toBe('Full Moon');
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

  it('defines a MoonRise shape', () => {
    const moonRise: MoonRise = {
      date: '2026-01-01',
      risesAt: new Date(),
      source: 'usno',
    };

    expect(moonRise.date).toBe('2026-01-01');
    expect(moonRise.risesAt).toBeInstanceOf(Date);
  });

  it('defines a MoonTransit shape', () => {
    const transit: MoonTransit = {
      date: '2026-01-01',
      transitsAt: new Date(),
      source: 'usno',
    };

    expect(transit.transitsAt).toBeInstanceOf(Date);
  });

  it('defines a MoonDetails shape', () => {
    const details: MoonDetails = {
      date: '2026-01-01',
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.25,
      source: 'usno',
    };

    expect(details.fractionIlluminated).toBe(0.25);
  });
});
