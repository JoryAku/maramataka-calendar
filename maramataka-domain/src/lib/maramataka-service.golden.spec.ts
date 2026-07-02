import { AstronomyProvider, MoonRise } from '@maramataka-calendar/astronomy';
import { GOLDEN_DATE_FIXTURES, GoldenDateFixture } from './golden-date-fixtures';
import { MaramatakaService } from './maramataka-service';

function createGoldenFixtureProvider(
  fixture: GoldenDateFixture,
): AstronomyProvider {
  const newMoons = fixture.newMoons.map((occursAt) => ({
    occursAt: new Date(occursAt),
    source: 'astronomy-engine',
  }));
  const fullMoons = fixture.fullMoons.map((occursAt) => ({
    occursAt: new Date(occursAt),
    source: 'astronomy-engine',
  }));
  const moonRises = new Map<string, MoonRise>(
    fixture.moonRises.map(([date, risesAt]) => [
      date,
      {
        date,
        risesAt: new Date(risesAt),
        source: 'astronomy-engine',
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

function getGoldenFixture(id: GoldenDateFixture['id']): GoldenDateFixture {
  const fixture = GOLDEN_DATE_FIXTURES.find((candidate) => candidate.id === id);
  if (!fixture) {
    throw new Error(`Missing golden date fixture: ${id}`);
  }

  return fixture;
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

  it('resolves current night to duplicated Ohua in a balanced marama', async () => {
    const fixture = getGoldenFixture('gisborne-dst-start-late-full-moon');
    const service = new MaramatakaService({
      astronomyProvider: createGoldenFixtureProvider(fixture),
    });

    const currentNight = await service.getCurrentNight(
      fixture.location,
      new Date(fixture.fullMoons[0]),
    );

    expect(currentNight?.night.mata.name).toBe('Ohua');
    expect(currentNight?.night.startsAt.toISOString()).toBe(
      '2026-09-26T05:39:00.000Z',
    );
    expect(currentNight?.night.overlappingMata).toBeUndefined();
  });

  it('treats next Whiro moonrise as the next marama boundary, not an overlap', async () => {
    const fixture = getGoldenFixture('wellington-winter-short-cycle');
    const service = new MaramatakaService({
      astronomyProvider: createGoldenFixtureProvider(fixture),
    });

    const currentNight = await service.getCurrentNight(
      fixture.location,
      new Date(fixture.expected.nextWhiroStartsAt),
    );

    expect(currentNight?.night.mata.name).toBe('Whiro');
    expect(currentNight?.night.startsAt.toISOString()).toBe(
      fixture.expected.nextWhiroStartsAt,
    );
    expect(currentNight?.night.overlappingMata).toBeUndefined();
  });

  it('returns cycle details with Whiro, Full Moon, next Whiro, and current mata anchors', async () => {
    const fixture = getGoldenFixture('gisborne-dst-start-late-full-moon');
    const service = new MaramatakaService({
      astronomyProvider: createGoldenFixtureProvider(fixture),
    });

    const cycle = await service.getCycleDetails(
      fixture.location,
      new Date(fixture.fullMoons[0]),
    );

    expect(cycle).toMatchObject({
      timezone: 'Pacific/Auckland',
      currentMataIndex: 16,
      currentNight: {
        mata: { name: 'Ohua' },
      },
      anchors: {
        whiro: {
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: new Date(fixture.expected.whiroStartsAt),
          localDate: '2026-09-11',
          localTime: '06:03:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: { name: 'Whiro' },
        },
        fullMoon: {
          type: 'full-moon',
          label: 'Rakaunui / Full Moon',
          occursAt: new Date('2026-09-26T05:39:00.000Z'),
          astronomicalOccursAt: new Date(fixture.fullMoons[0]),
          localDate: '2026-09-26',
          localTime: '17:39:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine observation moonrise',
          mata: { name: 'Ohua' },
        },
        nextWhiro: {
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: new Date(fixture.expected.nextWhiroStartsAt),
          localDate: '2026-10-10',
          localTime: '05:53:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: { name: 'Whiro' },
        },
      },
    });
    expect(cycle?.nights).toHaveLength(fixture.expected.nightCount);
  });
});
