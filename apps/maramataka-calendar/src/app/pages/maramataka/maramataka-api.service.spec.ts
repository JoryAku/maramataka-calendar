import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MARAMATAKA_APP_CONFIG } from '../../app-config';
import { MaramatakaApiService } from './maramataka-api.service';
import {
  DawnSky,
  MaramatakaPageData,
  MaramatakaYear,
} from './maramataka.models';

describe('MaramatakaApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: MaramatakaApiService;

  const ruleSet = {
    id: 'mita-te-tai-best-observational-v1',
    name: 'Mita Te Tai / Best observational maramataka',
    version: '1',
    mataVersion: 'mita-te-tai-best',
    metadataVersion: 1,
    fingerprint: 'test-rule-fingerprint',
    source:
      'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
    tradition: 'Mita Te Tai / Best',
    maramaStart: 'new-moon-observation-window-moonrise',
    mataBoundary: 'moonrise-to-moonrise',
    calibration: 'full-moon-observation-window-ohua',
    balancing: 'duplicate-ohua-drop-final-mata',
    yearStartRule: {
      strategy:
        'Start Te Tahi o Pipiri at the first Whiro after the configured year-start marker rises at dawn.',
      marker: {
        id: 'matariki',
        name: 'Matariki',
        type: 'asterism',
        englishName: 'Pleiades',
        seasonalAssociation: 'Year-start calibration marker',
        confidence: 'confirmed',
      },
      description:
        'The year commences with Matariki appearing on the horizon at dawn.',
      source: 'Elsdon Best, The Maori Division of Time',
    },
    starMonthNaming: {
      strategy:
        'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
      sampleTimeLocal: 'Dawn window from Sun 18° below horizon to sunrise',
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

  it('maps dawn sky from the API', () => {
    let dawnSky: DawnSky | undefined;

    service
      .getDawnSky('wellington', new Date('2026-06-24T12:00:00.000Z'))
      .subscribe((response) => {
        dawnSky = response;
      });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/dawn-sky' &&
        req.params.get('location') === 'wellington',
    );

    expect(request.request.params.get('date')).toBe('2026-06-25');
    request.flush({
      starMarkers: [
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
            'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
        },
      ],
      sunPath: {
        startsAt: '2026-06-24T17:00:00.000Z',
        sunriseAt: '2026-06-24T19:00:00.000Z',
        points: [
          {
            observedAt: '2026-06-24T17:00:00.000Z',
            altitudeDegrees: -18,
            azimuthDegrees: 67,
            direction: 'E',
          },
          {
            observedAt: '2026-06-24T19:00:00.000Z',
            altitudeDegrees: 0,
            azimuthDegrees: 79,
            direction: 'E',
          },
        ],
        calculation: 'Sun path sampled from astronomical dawn to sunrise.',
      },
      sunriseExtremes: {
        year: 2026,
        northernmost: {
          date: '2026-06-21',
          observedAt: '2026-06-20T19:25:00.000Z',
          altitudeDegrees: 0,
          azimuthDegrees: 58,
          direction: 'ENE',
        },
        southernmost: {
          date: '2026-12-21',
          observedAt: '2026-12-20T17:45:00.000Z',
          altitudeDegrees: 0,
          azimuthDegrees: 122,
          direction: 'ESE',
        },
        calculation: 'Annual sunrise limits.',
      },
      moon: {
        name: 'Moon',
        type: 'moon',
        observedAt: '2026-06-24T18:00:00.000Z',
        phase: 'Waning Gibbous',
        fractionIlluminated: 0.82,
        altitudeDegrees: 21,
        azimuthDegrees: 104,
        direction: 'ESE',
        visibility: 'visible',
        calculation: 'Moon sky position sampled at dawn.',
        source: 'astronomy-engine',
      },
    });

    expect(dawnSky?.starMarkers[0].name).toBe('Tautoru');
    expect(dawnSky?.starMarkers[0].observedAt).toEqual(
      new Date('2026-06-24T18:00:00.000Z'),
    );
    expect(dawnSky?.sunPath.sunriseAt).toEqual(
      new Date('2026-06-24T19:00:00.000Z'),
    );
    expect(dawnSky?.sunPath.points[0].observedAt).toEqual(
      new Date('2026-06-24T17:00:00.000Z'),
    );
    expect(dawnSky?.sunriseExtremes?.northernmost.observedAt).toEqual(
      new Date('2026-06-20T19:25:00.000Z'),
    );
    expect(dawnSky?.moon?.observedAt).toEqual(
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
    expect(request.request.params.get('includeTimelineEvents')).toBe('true');
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
    expect(year?.ruleSet).toEqual(
      expect.objectContaining({
        id: 'mita-te-tai-best-observational-v1',
        version: '1',
        mataVersion: 'mita-te-tai-best',
        metadataVersion: 1,
        fingerprint: 'test-rule-fingerprint',
      }),
    );
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

  it('maps the composed page payload from the API', () => {
    let pageData: MaramatakaPageData | undefined;

    service
      .getPageData('wellington', new Date('2026-06-24T12:00:00.000Z'))
      .subscribe((response) => {
        pageData = response;
      });

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/page' &&
        req.params.get('location') === 'wellington',
    );

    expect(request.request.params.get('date')).toBe('2026-06-25');
    expect(request.request.params.get('instant')).toBe(
      '2026-06-24T12:00:00.000Z',
    );
    request.flush({
      cycle: {
        version: 'mita-te-tai-best',
        ruleSet,
        timezone: 'Pacific/Auckland',
        currentMataIndex: 1,
        currentNight: {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
          startsAt: '2026-06-24T06:07:00.000Z',
          endsAt: '2026-06-25T06:07:00.000Z',
        },
        anchors: {
          whiro: {
            type: 'whiro',
            label: 'Whiro / Kohititanga',
            occursAt: '2026-06-24T06:07:00.000Z',
            localDate: '2026-06-24',
            localTime: '18:07:00',
            timezone: 'Pacific/Auckland',
            source: 'astronomy-engine moonrise',
          },
          nextWhiro: {
            type: 'next-whiro',
            label: 'Next Whiro / Kohititanga',
            occursAt: '2026-07-24T06:07:00.000Z',
            localDate: '2026-07-24',
            localTime: '18:07:00',
            timezone: 'Pacific/Auckland',
            source: 'astronomy-engine moonrise',
          },
        },
        nights: [
          {
            mata: {
              index: 1,
              name: 'Whiro',
              version: 'mita-te-tai-best',
            },
            startsAt: '2026-06-24T06:07:00.000Z',
            endsAt: '2026-06-25T06:07:00.000Z',
          },
        ],
      },
      moonDetails: {
        date: '2026-06-25',
        phase: 'New Moon',
        fractionIlluminated: 0.01,
        lunarAgeDays: 0.3,
        distanceKm: null,
        unavailable: ['distanceKm'],
        source: 'astronomy-engine',
      },
    });

    expect(pageData?.cycle.currentNight.startsAt).toEqual(
      new Date('2026-06-24T06:07:00.000Z'),
    );
    expect(pageData?.cycle.ruleSet).toEqual(
      expect.objectContaining({
        mataVersion: 'mita-te-tai-best',
        metadataVersion: 1,
        fingerprint: 'test-rule-fingerprint',
      }),
    );
    expect(pageData?.moonDetails.date).toBe('2026-06-25');
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
