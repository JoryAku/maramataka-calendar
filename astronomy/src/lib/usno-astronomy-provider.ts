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
      .map((phase: any) => {
        const moonYear = Number.parseInt(String(phase.year), 10);
        const moonMonth = Number.parseInt(String(phase.month), 10);
        const moonDay = Number.parseInt(String(phase.day), 10);
        const [hoursPart, minutesPart] = String(phase.time).split(':');
        const moonHour = Number.parseInt(hoursPart, 10);
        const moonMinute = Number.parseInt(minutesPart, 10);

        if (
          Number.isNaN(moonYear) ||
          Number.isNaN(moonMonth) ||
          Number.isNaN(moonDay) ||
          Number.isNaN(moonHour) ||
          Number.isNaN(moonMinute)
        ) {
          throw new Error(`Invalid USNO moon phase date/time: ${JSON.stringify(phase)}`);
        }

        return {
          occursAt: new Date(
            Date.UTC(moonYear, moonMonth - 1, moonDay, moonHour, moonMinute)
          ),
          source: 'usno' as const,
        };
      });
  }

  async getSunset(date: string, location: Location): Promise<Sunset> {
    const response = await this.fetchFn(
      `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${location.latitude},${location.longitude}&tz=${location.timezoneOffset}`
    );

    if (!response.ok) {
      throw new Error(`USNO sunset request failed: ${response.status}`);
    }

    const data = await response.json();
    const sunset = data.properties.data.sundata.find(
      (item: any) => item.phen === 'Set'
    );

    if (!sunset) {
      throw new Error('No sunset data found');
    }

    const [yearPart, monthPart, dayPart] = date.split('-');
    const [hoursPart, minutesPart] = String(sunset.time).split(':');
    const sunsetYear = Number.parseInt(yearPart, 10);
    const sunsetMonth = Number.parseInt(monthPart, 10);
    const sunsetDay = Number.parseInt(dayPart, 10);
    const sunsetHour = Number.parseInt(hoursPart, 10);
    const sunsetMinute = Number.parseInt(minutesPart, 10);

    if (
      Number.isNaN(sunsetYear) ||
      Number.isNaN(sunsetMonth) ||
      Number.isNaN(sunsetDay) ||
      Number.isNaN(sunsetHour) ||
      Number.isNaN(sunsetMinute)
    ) {
      throw new Error(`Invalid USNO sunset date/time: ${date} ${String(sunset.time)}`);
    }

    const occursAtUtcMs = Date.UTC(
      sunsetYear,
      sunsetMonth - 1,
      sunsetDay,
      sunsetHour - location.timezoneOffset,
      sunsetMinute
    );

    return {
      date,
      occursAt: new Date(occursAtUtcMs),
      source: 'usno',
    };
  }
}