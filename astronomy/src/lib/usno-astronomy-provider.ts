import {
  AstronomyProvider,
  Location,
  NewMoon,
  Sunset,
} from './astronomy-provider';

type FetchFn = typeof fetch;

export class UsnoAstronomyProvider implements AstronomyProvider {
  constructor(private readonly fetchFn: FetchFn = fetch) {}

  async getNewMoons(year: number): Promise<NewMoon[]> {
    const response = await this.fetchFn(
      `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`
    );
    if (!response.ok) {
      throw new Error(`USNO moon phases request failed: ${response.status}`);
    }
    const data = await response.json();

    return data.phasedata
      .filter((phase: any) => phase.phase === 'New Moon')
      .map((phase: any) => ({
        occursAt: new Date(
          `${phase.year}-${phase.month}-${phase.day}T${phase.time}:00Z`
        ),
        source: 'usno' as const,
      }));
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const response = await this.fetchFn(
      `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${location.latitude},${location.longitude}&tz=${location.timezoneOffset}`
    );

    const data = await response.json();
    const sunset = data.properties.data.sundata.find(
      (item: any) => item.phen === 'Set'
    );

    if (!sunset) {
      throw new Error('No sunset data found');
    }

    return {
      date,
      occursAt: new Date(`${date}T${sunset.time}:00+${location.timezoneOffset}:00`),
      source: 'usno',
    };
  }
}