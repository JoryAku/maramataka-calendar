import { AstronomyProvider, MoonRise } from '@maramataka-calendar/astronomy';
import { GOLDEN_DATE_FIXTURES, GoldenDateFixture } from './golden-date-fixtures';
import { MaramatakaService } from './maramataka-service';

function createGoldenFixtureProvider(
  fixture: GoldenDateFixture,
): AstronomyProvider {
  const newMoons = fixture.newMoons.map((occursAt) => ({
    occursAt: new Date(occursAt),
    source: 'usno',
  }));
  const fullMoons = fixture.fullMoons.map((occursAt) => ({
    occursAt: new Date(occursAt),
    source: 'usno',
  }));
  const moonRises = new Map<string, MoonRise>(
    fixture.moonRises.map(([date, risesAt]) => [
      date,
      {
        date,
        risesAt: new Date(risesAt),
        source: 'usno',
      },
    ]),
  );

  return {
    getMoonPhases: jest.fn(),
    getNewMoons: jest
      .fn()
      .mockImplementation((year: number) =>
        Promise.resolve(
          newMoons.filter(
            (newMoon) => newMoon.occursAt.getUTCFullYear() === year,
          ),
        ),
      ),
    getFullMoons: jest
      .fn()
      .mockImplementation((year: number) =>
        Promise.resolve(
          fullMoons.filter(
            (fullMoon) => fullMoon.occursAt.getUTCFullYear() === year,
          ),
        ),
      ),
    getMoonRise: jest.fn().mockImplementation((date: string) => {
      const moonRise = moonRises.get(date);
      if (!moonRise) {
        throw new Error(`No moonrise data found for ${date}`);
      }

      return Promise.resolve(moonRise);
    }),
    getMoonRiseSet: jest.fn(),
    getMoonTransit: jest.fn(),
    getMoonDetails: jest.fn(),
  };
}

function findFullMoonIntervalNumber(
  fixture: GoldenDateFixture,
  month: Awaited<ReturnType<MaramatakaService['getMonth']>>,
): number {
  const fullMoon = new Date(fixture.fullMoons[0]).getTime();

  return (
    month.nights.findIndex(
      (night) =>
        fullMoon >= night.startsAt.getTime() &&
        fullMoon < night.endsAt.getTime(),
    ) + 1
  );
}

describe('MaramatakaService golden date fixtures', () => {
  it.each(GOLDEN_DATE_FIXTURES)('$id: $description', async (fixture) => {
    const service = new MaramatakaService({
      astronomyProvider: createGoldenFixtureProvider(fixture),
    });

    const month = await service.getMonth(
      fixture.location,
      new Date(`${fixture.requestDate}T12:00:00.000Z`),
    );
    const mataNames = month.nights.map((night) => night.mata.name);
    const ohuaIntervalNumbers = month.nights
      .map((night, index) => (night.mata.name === 'Ohua' ? index + 1 : null))
      .filter((index): index is number => index !== null);

    expect(month.whiroStartsAt.toISOString()).toBe(
      fixture.expected.whiroStartsAt,
    );
    expect(month.nights).toHaveLength(fixture.expected.nightCount);
    expect(month.nights[month.nights.length - 1].endsAt.toISOString()).toBe(
      fixture.expected.nextWhiroStartsAt,
    );
    expect(findFullMoonIntervalNumber(fixture, month)).toBe(
      fixture.expected.fullMoonIntervalNumber,
    );
    expect(ohuaIntervalNumbers).toEqual(fixture.expected.ohuaIntervalNumbers);
    expect(mataNames.slice(0, 5)).toEqual(fixture.expected.firstFiveMata);
    expect(mataNames.slice(-5)).toEqual(fixture.expected.lastFiveMata);
  });
});
