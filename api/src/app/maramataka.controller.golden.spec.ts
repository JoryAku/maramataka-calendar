import {
  AstronomyProvider,
  Location,
  MoonRise,
} from '@maramataka-calendar/astronomy';
import { MaramatakaService } from '@maramataka-calendar/maramataka-domain';
import { MaramatakaController } from './maramataka.controller';
import { DateLocationQueryDto } from './api-query.dto';

interface ApiGoldenDateFixture {
  id: string;
  locationId: 'gisborne';
  location: Location;
  requestDate: string;
  newMoons: string[];
  fullMoons: string[];
  moonRises: Array<[date: string, risesAt: string]>;
  expected: {
    whiroStartsAt: string;
    nextWhiroStartsAt: string;
    nightCount: number;
    firstFiveMata: string[];
    lastFiveMata: string[];
  };
}

const API_GOLDEN_DATE_FIXTURES: ApiGoldenDateFixture[] = [
  {
    id: 'gisborne-dst-start-late-full-moon',
    locationId: 'gisborne',
    requestDate: '2026-09-14',
    location: {
      latitude: -38.6624,
      longitude: 178.0097,
      timezone: 'Pacific/Auckland',
    },
    newMoons: ['2026-09-11T03:27:00.000Z', '2026-10-10T15:50:00.000Z'],
    fullMoons: ['2026-09-26T16:49:00.000Z'],
    moonRises: [
      ['2026-09-11', '2026-09-10T18:03:00.000Z'],
      ['2026-09-12', '2026-09-11T18:27:00.000Z'],
      ['2026-09-13', '2026-09-12T18:51:00.000Z'],
      ['2026-09-14', '2026-09-13T19:16:00.000Z'],
      ['2026-09-15', '2026-09-14T19:43:00.000Z'],
      ['2026-09-16', '2026-09-15T20:14:00.000Z'],
      ['2026-09-17', '2026-09-16T20:50:00.000Z'],
      ['2026-09-18', '2026-09-17T21:32:00.000Z'],
      ['2026-09-19', '2026-09-18T22:22:00.000Z'],
      ['2026-09-20', '2026-09-19T23:17:00.000Z'],
      ['2026-09-21', '2026-09-21T00:17:00.000Z'],
      ['2026-09-22', '2026-09-22T01:20:00.000Z'],
      ['2026-09-23', '2026-09-23T02:23:00.000Z'],
      ['2026-09-24', '2026-09-24T03:28:00.000Z'],
      ['2026-09-25', '2026-09-25T04:33:00.000Z'],
      ['2026-09-26', '2026-09-26T05:39:00.000Z'],
      ['2026-09-27', '2026-09-27T06:46:00.000Z'],
      ['2026-09-28', '2026-09-28T07:57:00.000Z'],
      ['2026-09-29', '2026-09-29T09:10:00.000Z'],
      ['2026-09-30', '2026-09-30T10:25:00.000Z'],
      ['2026-10-02', '2026-10-01T11:38:00.000Z'],
      ['2026-10-03', '2026-10-02T12:45:00.000Z'],
      ['2026-10-04', '2026-10-03T13:43:00.000Z'],
      ['2026-10-05', '2026-10-04T14:29:00.000Z'],
      ['2026-10-06', '2026-10-05T15:07:00.000Z'],
      ['2026-10-07', '2026-10-06T15:38:00.000Z'],
      ['2026-10-08', '2026-10-07T16:05:00.000Z'],
      ['2026-10-09', '2026-10-08T16:30:00.000Z'],
      ['2026-10-10', '2026-10-09T16:53:00.000Z'],
      ['2026-10-11', '2026-10-10T17:17:00.000Z'],
      ['2026-10-12', '2026-10-11T17:44:00.000Z'],
      ['2026-10-13', '2026-10-12T18:13:00.000Z'],
    ],
    expected: {
      whiroStartsAt: '2026-09-10T18:03:00.000Z',
      nextWhiroStartsAt: '2026-10-10T17:17:00.000Z',
      nightCount: 29,
      firstFiveMata: ['Whiro', 'Tirea', 'Hoata', 'Ōuenuku', 'Okoro'],
      lastFiveMata: [
        'Tangaroa-whakapau',
        'Tangaroa whāriki kio-kio',
        'Ōtāne',
        'Ōrongonui',
        'Ōmutu',
      ],
    },
  },
];

function createGoldenFixtureProvider(
  fixture: ApiGoldenDateFixture,
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
    getMoonDetails: jest.fn().mockResolvedValue({
      date: fixture.requestDate,
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.25,
      lunarAgeDays: 2.5,
      lunarAgeSource: 'golden fixture',
      source: 'golden fixture',
    }),
    getStarMarkers: jest.fn(),
  };
}

describe('MaramatakaController golden date fixtures', () => {
  it.each(API_GOLDEN_DATE_FIXTURES)(
    '$id: returns the generated mata sequence through the API controller',
    async (fixture) => {
      const controller = new MaramatakaController(
        new MaramatakaService({
          astronomyProvider: createGoldenFixtureProvider(fixture),
        }),
      );

      const query = Object.assign(new DateLocationQueryDto(), {
        date: fixture.requestDate,
        location: fixture.locationId,
      });
      const response = await controller.getPage(query);
      const mataNames = response.cycle.nights.map((night) => night.mata.name);

      expect(response.cycle.anchors.whiro.occursAt.toISOString()).toBe(
        fixture.expected.whiroStartsAt,
      );
      expect(response.cycle.nights).toHaveLength(fixture.expected.nightCount);
      expect(
        response.cycle.nights[
          response.cycle.nights.length - 1
        ].endsAt.toISOString(),
      ).toBe(fixture.expected.nextWhiroStartsAt);
      expect(mataNames.slice(0, 5)).toEqual(fixture.expected.firstFiveMata);
      expect(mataNames.slice(-5)).toEqual(fixture.expected.lastFiveMata);
    },
  );
});
