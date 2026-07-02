import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MARAMATAKA_APP_CONFIG } from '../../app-config';
import { MaramatakaApiService } from './maramataka-api.service';
import {
  MaramatakaCycleDetails,
  MaramatakaYear,
  StarMarker,
} from './maramataka.models';

describe('MaramatakaApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: MaramatakaApiService;

  const ruleSet = {
    id: 'mita-te-tai-best-observational-v1',
    name: 'Mita Te Tai / Best observational maramataka',
    version: '1',
    source:
      'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
    tradition: 'Mita Te Tai / Best',
    maramaStart: 'new-moon-observation-window-moonrise',
    mataBoundary: 'moonrise-to-moonrise',
    calibration: 'full-moon-observation-window-ohua',
    balancing: 'duplicate-ohua-drop-final-mata',
    starMonthNaming: {
      strategy:
        'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
      sampleTimeLocal: '06:00',
      yearStartMarkerId: 'matariki',
      yearStartDescription:
        'The year commences with Matariki appearing on the horizon at dawn.',
      source: 'Elsdon Best, The Maori Division of Time',
      months: [
        {
          sequence: 1,
          name: 'Te Tahi o Pipiri',
          markerIds: ['matariki'],
          description:
            'The first named month in Himiona Tikitu\'s list is Te Tahi o Pipiri, with the year commencing when Matariki appears on the dawn horizon.',
          sourceText: 'Te Tahi o Pipiri .. The First of Pipiri. The year commenced with the appearance of Matariki (Pleiades) on the horizon at dawn.',
        },
      ],
      markers: [
        {
          id: 'matariki',
          name: 'Matariki',
          type: 'asterism',
          englishName: 'Pleiades',
          seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
          confidence: 'confirmed',
        },
      ],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MaramatakaApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(MaramatakaApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('maps cycle detail anchors and nights from the API', () => {
    let cycle: MaramatakaCycleDetails | undefined;

    service
      .getCycleDetails('gisborne', new Date('2026-09-14T12:00:00.000Z'))
      .subscribe((response) => {
        cycle = response;
      });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/cycle' &&
        req.params.get('location') === 'gisborne',
    );

    expect(request.request.params.get('date')).toBe('2026-09-15');
    request.flush({
      version: 'mita-te-tai-best',
      ruleSet,
      timezone: 'Pacific/Auckland',
      currentMataIndex: 16,
      currentNight: {
        mata: {
          index: 15,
          name: 'Ohua',
          version: 'mita-te-tai-best',
        },
        startsAt: '2026-09-26T05:39:00.000Z',
        endsAt: '2026-09-27T06:46:00.000Z',
      },
      anchors: {
        whiro: {
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: '2026-09-10T18:03:00.000Z',
          localDate: '2026-09-11',
          localTime: '06:03:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
        },
        fullMoon: {
          type: 'full-moon',
          label: 'Rakaunui / Full Moon',
          occursAt: '2026-09-26T16:49:00.000Z',
          localDate: '2026-09-27',
          localTime: '05:49:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine',
          mata: {
            index: 15,
            name: 'Ohua',
            version: 'mita-te-tai-best',
          },
        },
        nextWhiro: {
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: '2026-10-10T17:17:00.000Z',
          localDate: '2026-10-11',
          localTime: '06:17:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
        },
      },
      starMonth: {
        name: 'Te Tahi o Pipiri',
        marker: {
          id: 'matariki',
          name: 'Matariki',
          type: 'asterism',
          englishName: 'Pleiades',
          description:
            'Pleiades; year-start marker appearing on the dawn horizon.',
          seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
          source: 'Elsdon Best, The Maori Division of Time',
          confidence: 'confirmed',
          observedAt: '2026-09-14T18:00:00.000Z',
          altitudeDegrees: 21,
          azimuthDegrees: 79,
          direction: 'E',
          visibility: 'prominent',
          calculation:
            'Dawn sky position sampled at 06:00 local time for the selected location.',
        },
        rule:
          'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
        source: 'Elsdon Best, The Maori Division of Time',
        note: {
          sequence: 1,
          name: 'Te Tahi o Pipiri',
          markerIds: ['matariki'],
          description:
            'The first named month in Himiona Tikitu\'s list is Te Tahi o Pipiri, with the year commencing when Matariki appears on the dawn horizon.',
          sourceText: 'Te Tahi o Pipiri .. The First of Pipiri. The year commenced with the appearance of Matariki (Pleiades) on the horizon at dawn.',
        },
      },
      starMarkers: [
        {
          id: 'matariki',
          name: 'Matariki',
          type: 'asterism',
          englishName: 'Pleiades',
          description:
            'Pleiades; year-start marker appearing on the dawn horizon.',
          seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
          source: 'Elsdon Best, The Maori Division of Time',
          confidence: 'confirmed',
          observedAt: '2026-09-14T18:00:00.000Z',
          altitudeDegrees: 21,
          azimuthDegrees: 79,
          direction: 'E',
          visibility: 'prominent',
          calculation:
            'Dawn sky position sampled at 06:00 local time for the selected location.',
        },
      ],
      nights: [
        {
          mata: {
            index: 15,
            name: 'Ohua',
            version: 'mita-te-tai-best',
          },
          startsAt: '2026-09-26T05:39:00.000Z',
          endsAt: '2026-09-27T06:46:00.000Z',
        },
      ],
    });

    expect(cycle?.currentMataIndex).toBe(16);
    expect(cycle?.currentNight.mata).toBe('Ohua');
    expect(cycle?.currentNight.startsAt).toEqual(
      new Date('2026-09-26T05:39:00.000Z'),
    );
    expect(cycle?.anchors.fullMoon?.occursAt).toEqual(
      new Date('2026-09-26T16:49:00.000Z'),
    );
    expect(cycle?.anchors.nextWhiro.occursAt).toEqual(
      new Date('2026-10-10T17:17:00.000Z'),
    );
    expect(cycle?.nights[0].mata).toBe('Ohua');
    expect(cycle?.starMarkers?.[0].name).toBe('Matariki');
    expect(cycle?.starMarkers?.[0].observedAt).toEqual(
      new Date('2026-09-14T18:00:00.000Z'),
    );
    expect(cycle?.starMonth?.name).toBe('Te Tahi o Pipiri');
    expect(cycle?.starMonth?.marker?.observedAt).toEqual(
      new Date('2026-09-14T18:00:00.000Z'),
    );
    expect(cycle?.starMonth?.note?.sourceText).toContain(
      'The First of Pipiri',
    );
    expect(cycle?.starMonth?.note?.sourceText).toContain(
      'Matariki (Pleiades) on the horizon at dawn',
    );
  });

  it('maps star markers from the API', () => {
    let markers: StarMarker[] | undefined;

    service
      .getStarMarkers('wellington', new Date('2026-06-24T12:00:00.000Z'))
      .subscribe((response) => {
        markers = response;
      });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/star-markers' &&
        req.params.get('location') === 'wellington',
    );

    expect(request.request.params.get('date')).toBe('2026-06-25');
    request.flush([
      {
        id: 'tautoru',
        name: 'Tautoru',
        type: 'asterism',
        englishName: "Orion's Belt",
        description: 'A seasonal dawn marker.',
        seasonalAssociation:
          'Associated with July alongside Kōpū in the seasonal star account.',
        source: 'Elsdon Best, The Maori Division of Time',
        confidence: 'confirmed',
        observedAt: '2026-06-24T18:00:00.000Z',
        altitudeDegrees: 18,
        azimuthDegrees: 82,
        direction: 'E',
        visibility: 'visible',
        calculation:
          'Dawn sky position sampled at 06:00 local time for the selected location.',
      },
    ]);

    expect(markers?.[0].name).toBe('Tautoru');
    expect(markers?.[0].observedAt).toEqual(
      new Date('2026-06-24T18:00:00.000Z'),
    );
  });

  it('maps year timeline months from the API', () => {
    let year: MaramatakaYear | undefined;

    service
      .getYear('gisborne', new Date('2026-09-14T12:00:00.000Z'))
      .subscribe((response) => {
        year = response;
      });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/year' &&
        req.params.get('location') === 'gisborne',
    );

    expect(request.request.params.get('date')).toBe('2026-09-15');
    request.flush({
      version: 'mita-te-tai-best',
      ruleSet,
      year: 2026,
      timezone: 'Pacific/Auckland',
      startsAt: '2025-12-31T11:00:00.000Z',
      endsAt: '2026-12-31T11:00:00.000Z',
      diagnostics: [
        {
          type: 'estimated-month',
          name: 'Marama 9',
          sequence: 9,
          anchorDate: '2026-09-10T18:03:00.000Z',
          reason: 'No moonrise data found for Whiro date',
        },
      ],
      events: [
        {
          type: 'month-start',
          name: 'Marama 9',
          occursAt: '2026-09-10T18:03:00.000Z',
          monthSequence: 9,
          monthName: 'Marama 9',
          description: 'Maramataka month begins at Whiro.',
          source: 'astronomy-engine moonrise',
        },
      ],
      months: [
        {
          sequence: 9,
          name: 'Marama 9',
          startsAt: '2026-09-10T18:03:00.000Z',
          endsAt: '2026-10-10T17:17:00.000Z',
          durationDays: 29.97,
          nightsCount: 30,
          repeatedMata: ['Ohua x2'],
          anchors: {
            whiro: {
              type: 'whiro',
              label: 'Whiro / Kohititanga',
              occursAt: '2026-09-10T18:03:00.000Z',
              localDate: '2026-09-11',
              localTime: '06:03:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine moonrise',
            },
            fullMoon: {
              type: 'full-moon',
              label: 'Rakaunui / Full Moon',
              occursAt: '2026-09-26T16:49:00.000Z',
              localDate: '2026-09-27',
              localTime: '05:49:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine',
            },
            nextWhiro: {
              type: 'next-whiro',
              label: 'Next Whiro / Kohititanga',
              occursAt: '2026-10-10T17:17:00.000Z',
              localDate: '2026-10-11',
              localTime: '06:17:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine moonrise',
            },
          },
        },
      ],
    });

    expect(year?.startsAt).toEqual(new Date('2025-12-31T11:00:00.000Z'));
    expect(year?.months[0].startsAt).toEqual(
      new Date('2026-09-10T18:03:00.000Z'),
    );
    expect(year?.months[0].anchors.fullMoon?.occursAt).toEqual(
      new Date('2026-09-26T16:49:00.000Z'),
    );
    expect(year?.months[0].repeatedMata).toEqual(['Ohua x2']);
    expect(year?.diagnostics[0].anchorDate).toEqual(
      new Date('2026-09-10T18:03:00.000Z'),
    );
    expect(year?.events[0].occursAt).toEqual(
      new Date('2026-09-10T18:03:00.000Z'),
    );
  });

  it('uses the configured API base URL', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MaramatakaApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MARAMATAKA_APP_CONFIG,
          useValue: {
            apiBaseUrl: 'https://api.example.test/api',
            errorReporting: 'none',
          },
        },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(MaramatakaApiService);

    service.getLocations().subscribe();

    const request = httpTestingController.expectOne(
      'https://api.example.test/api/locations',
    );
    request.flush([]);
  });
});
