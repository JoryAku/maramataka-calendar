import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MaramatakaPage } from './maramataka-page';

describe('MaramatakaPage', () => {
  let httpTestingController: HttpTestingController;
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
      imports: [MaramatakaPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  function flushInitialRequests() {
    return httpTestingController.expectOne(
      (req) => req.url === '/api/locations',
    );
  }

  function flushMaramatakaRequests(locationId = 'wellington') {
    const todayRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/today' &&
        req.params.get('location') === locationId,
    );
    const cycleRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/cycle' &&
        req.params.get('location') === locationId,
    );
    const moonDetailsRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/moon-details' &&
        req.params.get('location') === locationId,
    );
    const yearRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/year' &&
        req.params.get('location') === locationId,
    );
    const starMarkersRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/star-markers' &&
        req.params.get('location') === locationId,
    );

    return {
      cycleRequest,
      todayRequest,
      moonDetailsRequest,
      yearRequest,
      starMarkersRequest,
    };
  }

  function locationsFixture() {
    return [
      { id: 'wellington', name: 'Wellington', rohe: 'Te Whanganui-a-Tara' },
      { id: 'auckland', name: 'Auckland', rohe: 'Tamaki Makaurau' },
      { id: 'christchurch', name: 'Christchurch', rohe: 'Otautahi' },
      { id: 'gisborne', name: 'Gisborne', rohe: 'Turanganui-a-Kiwa' },
    ];
  }

  function monthFixture(nights: unknown[] = []) {
    return {
      version: 'mita-te-tai-best',
      ruleSet,
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights,
    };
  }

  function todayFixture(): Record<string, unknown> {
    return {
      mata: {
        index: 1,
        name: 'Whiro',
        contentLayers: [
          {
            id: 'fishing-guidance',
            name: 'Fishing guidance',
            source:
              'Elsdon Best, Fishing Methods and Devices of the Maori; Mita Te Tai / Metara notebook reference',
            sourceUrl:
              'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html',
            version: '1',
            status: 'available',
            description:
              'Fishing activity guidance encoded from the Mita Te Tai / Best source phrases for this mata.',
            recommendations: ['Mo te hi', 'Mo te rama'],
          },
        ],
      },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    };
  }

  function cycleFixture(nights: unknown[] = []) {
    return {
      version: 'mita-te-tai-best',
      ruleSet,
      timezone: 'Pacific/Auckland',
      currentMataIndex: 1,
      currentNight: {
        mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
        startsAt: '2026-01-10T06:45:00.000Z',
        endsAt: '2026-01-11T06:45:00.000Z',
      },
      anchors: {
        whiro: {
          type: 'whiro',
          label: 'Whiro / Kohititanga',
          occursAt: '2026-01-10T06:45:00.000Z',
          localDate: '2026-01-10',
          localTime: '19:45:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
        },
        fullMoon: {
          type: 'full-moon',
          label: 'Rakaunui / Full Moon',
          occursAt: '2026-01-11T03:00:00.000Z',
          localDate: '2026-01-11',
          localTime: '16:00:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine',
        },
        nextWhiro: {
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: '2026-01-12T06:45:00.000Z',
          localDate: '2026-01-12',
          localTime: '19:45:00',
          timezone: 'Pacific/Auckland',
          source: 'astronomy-engine moonrise',
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
          observedAt: '2026-01-10T17:00:00.000Z',
          altitudeDegrees: 24,
          azimuthDegrees: 74,
          direction: 'E',
          visibility: 'prominent',
          calculation:
            'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
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
      starMarkers: starMarkersFixture(),
      nights,
    };
  }

  function moonDetailsFixture(): Record<string, unknown> {
    return {
      date: '2026-01-11',
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.17,
      lunarAgeDays: 2.5,
      lunarAgeSource: 'astronomy-engine moon phases',
      distanceKm: null,
      moonrise: {
        occursAt: '2026-01-10T06:45:00.000Z',
        source: 'astronomy-engine',
      },
      moonset: {
        occursAt: '2026-01-10T19:12:00.000Z',
        source: 'astronomy-engine',
      },
      transit: {
        occursAt: '2026-01-10T12:41:00.000Z',
        source: 'astronomy-engine',
      },
      unavailable: ['distanceKm'],
      source: 'astronomy-engine',
    };
  }

  function yearFixture(): Record<string, unknown> {
    const matarikiMarker = {
      id: 'matariki',
      name: 'Matariki',
      type: 'asterism',
      englishName: 'Pleiades',
      description: 'Pleiades; year-start marker appearing on the dawn horizon.',
      seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
      source: 'Elsdon Best, The Maori Division of Time',
      confidence: 'confirmed',
      observedAt: '2026-01-10T17:00:00.000Z',
      altitudeDegrees: 24,
      azimuthDegrees: 74,
      direction: 'E',
      visibility: 'prominent',
      calculation:
        'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
    };

    return {
      version: 'mita-te-tai-best',
      ruleSet,
      year: 2026,
      timezone: 'Pacific/Auckland',
      startsAt: '2025-12-31T11:00:00.000Z',
      endsAt: '2026-12-31T11:00:00.000Z',
      months: [
        {
          sequence: 1,
          name: 'Te Tahi o Pipiri',
          starMonth: {
            name: 'Te Tahi o Pipiri',
            marker: matarikiMarker,
            rule:
              'Marama is named from a rule-set star or asterism rising in the eastern dawn sky around Whiro',
            source: 'Elsdon Best, The Maori Division of Time',
            note: {
              sequence: 1,
              name: 'Te Tahi o Pipiri',
              markerIds: ['matariki'],
              description:
                'The first named month in Himiona Tikitu\'s list is Te Tahi o Pipiri.',
              sourceText:
                'Te Tahi o Pipiri .. The First of Pipiri. The year commenced with the appearance of Matariki (Pleiades) on the horizon at dawn.',
            },
          },
          starMarkers: [matarikiMarker],
          startsAt: '2026-01-10T06:45:00.000Z',
          endsAt: '2026-02-09T06:45:00.000Z',
          durationDays: 30,
          nightsCount: 30,
          repeatedMata: [],
          anchors: {
            whiro: {
              type: 'whiro',
              label: 'Whiro / Kohititanga',
              occursAt: '2026-01-10T06:45:00.000Z',
              localDate: '2026-01-10',
              localTime: '19:45:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine moonrise',
            },
            fullMoon: {
              type: 'full-moon',
              label: 'Rakaunui / Full Moon',
              occursAt: '2026-01-25T06:45:00.000Z',
              localDate: '2026-01-25',
              localTime: '19:45:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine',
            },
            nextWhiro: {
              type: 'next-whiro',
              label: 'Next Whiro / Kohititanga',
              occursAt: '2026-02-09T06:45:00.000Z',
              localDate: '2026-02-09',
              localTime: '19:45:00',
              timezone: 'Pacific/Auckland',
              source: 'astronomy-engine moonrise',
            },
          },
        },
      ],
      events: [
        {
          type: 'month-start',
          name: 'Te Tahi o Pipiri',
          occursAt: '2026-01-10T06:45:00.000Z',
          monthSequence: 1,
          monthName: 'Te Tahi o Pipiri',
          description: 'Maramataka month begins at Whiro.',
          source: 'astronomy-engine moonrise',
        },
        {
          type: 'star-marker',
          name: 'Matariki',
          occursAt: '2026-01-10T17:00:00.000Z',
          monthSequence: 1,
          monthName: 'Te Tahi o Pipiri',
          description: 'Year-start ariki for Te Tahi o Pipiri',
          source: 'Elsdon Best, The Maori Division of Time',
        },
        {
          type: 'star-marker',
          name: 'Whakaahu',
          occursAt: '2026-01-11T17:00:00.000Z',
          starMarkerScope: 'seasonal',
          description: 'Seasonal dawn marker.',
          source: 'test seasonal marker',
        },
        {
          type: 'star-marker',
          name: 'Rehua',
          occursAt: '2026-01-12T17:00:00.000Z',
          starMarkerScope: 'seasonal',
          description: 'Seasonal dawn marker.',
          source: 'test seasonal marker',
        },
        {
          type: 'new-moon',
          name: 'New Moon',
          occursAt: '2026-01-10T06:45:00.000Z',
          monthSequence: 1,
          monthName: 'Te Tahi o Pipiri',
          description: 'Astronomical New Moon anchor for Whiro.',
          source: 'astronomy-engine',
        },
        {
          type: 'full-moon',
          name: 'Full Moon',
          occursAt: '2026-01-25T06:45:00.000Z',
          monthSequence: 1,
          monthName: 'Te Tahi o Pipiri',
          description: 'Astronomical Full Moon anchor for Rakaunui / Ohua.',
          source: 'astronomy-engine',
        },
        {
          type: 'star-appearance',
          name: 'Matariki appears',
          occursAt: '2026-01-10T18:00:00.000Z',
          description:
            'Matariki first appears in the configured dawn sky window.',
          source: 'test dawn appearance',
        },
        {
          type: 'star-invisibility',
          name: 'Matariki disappears',
          occursAt: '2026-01-11T09:00:00.000Z',
          description:
            'Matariki is not visible during astronomical night until 2026-03-20.',
          source: 'test night invisibility period',
        },
        {
          type: 'public-holiday',
          name: 'Matariki public holiday',
          occursAt: '2026-01-11T12:00:00.000Z',
          monthSequence: 1,
          monthName: 'Te Tahi o Pipiri',
          description:
            'Estimated as the Friday within Te Tahi o Pipiri closest to the four-night Tangaroa period from Tangaroa-ā-mua through Tangaroa whāriki kio-kio.',
          source: 'Matariki public holiday maramataka rule',
        },
        {
          type: 'solar-season',
          name: 'June solstice',
          occursAt: '2026-01-11T13:30:00.000Z',
          description:
            'Astronomical equinox or solstice anchor from the solar year.',
          source: 'astronomy-engine',
        },
      ],
    };
  }

  function ruhanuiYearFixture(): Record<string, unknown> {
    const baseYear = yearFixture();
    const baseMonth = (baseYear['months'] as Record<string, unknown>[])[0];
    const createMonth = (
      sequence: number,
      name: string,
      startsAt: string,
      endsAt: string,
    ) => ({
      ...baseMonth,
      sequence,
      name,
      starMonth: {
        ...(baseMonth['starMonth'] as Record<string, unknown>),
        name,
        note: {
          sequence,
          name,
          markerIds: [],
          description: `${name} test note.`,
          sourceText: `${name} test source.`,
        },
      },
      starMarkers: [],
      startsAt,
      endsAt,
      anchors: {
        ...(baseMonth['anchors'] as Record<string, unknown>),
        whiro: {
          ...((baseMonth['anchors'] as Record<string, unknown>)[
            'whiro'
          ] as Record<string, unknown>),
          occursAt: startsAt,
        },
        nextWhiro: {
          ...((baseMonth['anchors'] as Record<string, unknown>)[
            'nextWhiro'
          ] as Record<string, unknown>),
          occursAt: endsAt,
        },
      },
    });

    return {
      ...baseYear,
      startsAt: '2027-06-25T00:00:00.000Z',
      endsAt: '2028-06-23T00:00:00.000Z',
      months: [
        createMonth(
          1,
          'Te Tahi o Pipiri',
          '2027-06-25T00:00:00.000Z',
          '2027-07-24T00:00:00.000Z',
        ),
        createMonth(
          12,
          'Haki-haratua',
          '2028-04-15T00:00:00.000Z',
          '2028-05-24T00:00:00.000Z',
        ),
        createMonth(
          13,
          'Ruhanui',
          '2028-05-24T00:00:00.000Z',
          '2028-06-23T00:00:00.000Z',
        ),
      ],
      events: [],
    };
  }

  function starMarkersFixture(): Record<string, unknown>[] {
    return [
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
        observedAt: '2026-01-10T17:00:00.000Z',
        altitudeDegrees: 24,
        azimuthDegrees: 74,
        direction: 'E',
        visibility: 'visible',
        calculation:
          'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
      },
      {
        id: 'whakaahu',
        name: 'Whakaahu',
        type: 'star',
        englishName: 'Castor',
        description:
          'A dawn marker that is visible but not assigned to this named month.',
        seasonalAssociation: 'Another rule-set marker',
        source: 'Elsdon Best, The Maori Division of Time',
        confidence: 'confirmed',
        observedAt: '2026-01-10T17:00:00.000Z',
        altitudeDegrees: 18,
        azimuthDegrees: 80,
        direction: 'E',
        visibility: 'prominent',
        calculation:
          'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
      },
      {
        id: 'poututerangi',
        name: 'Poutūterangi',
        type: 'star',
        englishName: 'Altair',
        description:
          'A dawn marker outside the north-to-south field of view.',
        seasonalAssociation: 'Western dawn marker',
        source: 'Living by the Stars',
        confidence: 'working',
        observedAt: '2026-01-10T17:00:00.000Z',
        altitudeDegrees: 16,
        azimuthDegrees: 278,
        direction: 'W',
        visibility: 'visible',
        calculation:
          'Dawn sky position sampled midway between the rising Sun crossing 18° and 12° below the horizon.',
      },
    ];
  }

  function flushSuccessfulMaramatakaRequests(
    requests: ReturnType<typeof flushMaramatakaRequests>,
    month = monthFixture(),
    today = todayFixture(),
    cycle = cycleFixture(month.nights),
    moonDetails = moonDetailsFixture(),
    year = yearFixture(),
    starMarkers = starMarkersFixture(),
  ): void {
    requests.cycleRequest.flush(cycle);
    requests.todayRequest.flush(today);
    requests.moonDetailsRequest.flush(moonDetails);
    requests.yearRequest.flush(year);
    requests.starMarkersRequest.flush(starMarkers);
  }

  it('shows loading states before data arrives', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="month-loading-state"]',
      ),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="today-loading-state"]',
      ),
    ).not.toBeNull();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(flushMaramatakaRequests());
  });

  it('loads and renders month and today data from the API', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    const requests = flushMaramatakaRequests();
    const {
      cycleRequest,
      todayRequest,
      moonDetailsRequest,
      yearRequest,
      starMarkersRequest,
    } = requests;

    expect(todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-11T01:00:00',
    );
    expect(cycleRequest.request.params.get('date')).toBe('2026-01-11');
    expect(cycleRequest.request.params.has('tz')).toBe(false);
    expect(moonDetailsRequest.request.params.get('date')).toBe('2026-01-11');
    expect(yearRequest.request.params.get('date')).toBe('2026-01-11');
    expect(starMarkersRequest.request.params.get('date')).toBe('2026-01-11');

    flushSuccessfulMaramatakaRequests(
      requests,
      monthFixture([
        {
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
            phaseGroup: { name: 'Te Marama i te rā' },
          },
          startsAt: '2026-01-10T06:45:00.000Z',
          endsAt: '2026-01-11T06:45:00.000Z',
        },
        {
          mata: {
            index: 2,
            name: 'Tirea',
            version: 'mita-te-tai-best',
            phaseGroup: { name: 'Te Hua' },
          },
          startsAt: '2026-01-11T06:45:00.000Z',
          endsAt: '2026-01-12T06:45:00.000Z',
        },
      ]),
    );

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Selected day');
    expect(content).toContain('Wellington');
    expect(content).toContain('Whiro');
    expect(content).toContain('Tirea');
    expect(content).toContain('Mita Te Tai / Best observational maramataka');
    expect(content).toContain('Waxing Crescent');
    expect(content).toContain('17%');
    expect(content).toContain('Meridian');
    expect(content).toContain('Year rhythm');
    expect(content).toContain('Year view starts at Te Tahi o Pipiri');
    expect(content).toContain('month and seasonal dawn appearances');
    expect(content).toContain('New Moon');
    expect(content).toContain('Full Moon');
    expect(content).toContain('June solstice');
    expect(content).toContain('Te Tahi o Pipiri');
    expect(content).toContain('Dawn sky');
    expect(content).toContain(
      'Dawn is sampled while the Sun is 12° to 18° below the horizon',
    );
    expect(content).toContain('2 visible');
    expect(content).toContain(
      '1 visible body is outside the north-to-south dawn field',
    );
    const dawnPanelText =
      fixture.nativeElement.querySelector('[data-testid="dawn-sky-panel"]')
        ?.textContent ?? '';
    expect(
      fixture.nativeElement.querySelector('[data-testid="dawn-horizon"]'),
    ).not.toBeNull();
    expect(content).toContain('Matariki');
    expect(content).toContain('Pleiades');
    expect(content).toContain('Whakaahu');
    expect(content).toContain('Castor');
    const dawnCardNames = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.dawn-sky-list strong',
      ) as NodeListOf<HTMLElement>,
    ).map((element) => element.textContent?.trim());
    expect(dawnCardNames).toEqual(['Matariki', 'Whakaahu']);
    expect(dawnPanelText).not.toContain('Poutūterangi');
    expect(dawnPanelText).not.toContain('Star month rule');
    expect(dawnPanelText).not.toContain('Source note');
    expect(content).toContain('Moon phase');
    const cycleStarLayerText =
      fixture.nativeElement.querySelector(
        '[data-testid="cycle-star-marker-layer"]',
      )?.textContent ?? '';
    expect(content).toContain('Star month: Te Tahi o Pipiri');
    expect(cycleStarLayerText).toContain('Star month rule');
    expect(content).toContain('Himiona Tikitu');
    expect(content).toContain('The First of Pipiri');
    expect(content).toContain('Matariki (Pleiades) on the horizon at dawn');
    expect(content).toContain('Fishing guidance');
    expect(content).toContain('Mo te hi');
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="fishing-guidance-layer"] a')
        ?.getAttribute('href'),
    ).toBe(
      'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html',
    );
    expect(
      fixture.nativeElement.querySelector('.wheel-segment.current')
        ?.textContent,
    ).toContain('Whiro');
    const firstWheelSegment = fixture.nativeElement.querySelector(
      '.wheel-segment .segment-path',
    ) as HTMLElement | null;
    expect(firstWheelSegment?.getAttribute('fill')).toMatch(/^rgb\(/);
    const nightEventContent = Array.from(
      fixture.nativeElement.querySelectorAll('.cycle-list .night-event'),
    )
      .map((element) => (element as HTMLElement).textContent)
      .join(' ');
    expect(nightEventContent).toContain('New Moon');
    expect(nightEventContent).toContain('Matariki');
    expect(nightEventContent).toContain('Appears');
    expect(nightEventContent).toContain('Matariki appears');
    expect(nightEventContent).toContain('Disappears');
    expect(nightEventContent).toContain('Matariki disappears');
    expect(nightEventContent).toContain('Holiday');
    expect(nightEventContent).toContain('Matariki public holiday');
    expect(nightEventContent).toContain('Solar');
    expect(nightEventContent).toContain('June solstice');
    expect(nightEventContent).not.toContain('Full Moon');
    expect(content).not.toContain('Te Marama i te rā');
    expect(content).not.toContain('Te Hua');
    expect(
      fixture.nativeElement.querySelector('.cycle-list')?.textContent,
    ).not.toContain('Next Whiro');
    const seasonalTimelineEvents = Array.from(
      fixture.nativeElement.querySelectorAll('.year-event.star-marker'),
    ).filter((element) =>
      (element as HTMLElement).textContent?.includes('Seasonal'),
    ) as HTMLElement[];
    expect(seasonalTimelineEvents).toHaveLength(2);
    expect(
      new Set(seasonalTimelineEvents.map((element) => element.style.top)),
    ).toEqual(new Set(['4.9rem', '7.3rem']));
    expect(
      seasonalTimelineEvents.map((element) =>
        element.classList.contains('lane-0'),
      ),
    ).toContain(true);
    expect(
      seasonalTimelineEvents.map((element) =>
        element.classList.contains('lane-1'),
      ),
    ).toContain(true);
    const solarTimelineEvent = fixture.nativeElement.querySelector(
      '.year-event.solar-season',
    ) as HTMLElement | null;
    expect(solarTimelineEvent?.textContent).toContain('Solar');
    expect(solarTimelineEvent?.style.top).toBe('14.9rem');
    const lunarTimelineEvent = fixture.nativeElement.querySelector(
      '.year-event.new-moon',
    ) as HTMLElement | null;
    const holidayTimelineEvent = fixture.nativeElement.querySelector(
      '.year-event.public-holiday',
    ) as HTMLElement | null;
    expect(lunarTimelineEvent?.style.top).toBe('21.2rem');
    expect(holidayTimelineEvent?.style.top).toBe('25.1rem');
    const selectedYearMarker = fixture.nativeElement.querySelector(
      '[data-testid="year-selected-date-marker"]',
    ) as HTMLElement | null;
    expect(selectedYearMarker).not.toBeNull();
    expect(selectedYearMarker?.textContent).toContain('Selected');
    expect(
      Number.parseFloat(selectedYearMarker?.style.left ?? '0'),
    ).toBeGreaterThan(0);
    expect(
      seasonalTimelineEvents.every((element) =>
        element.classList.contains('seasonal-marker'),
      ),
    ).toBe(true);
  });

  it('updates the next mata countdown while the page is open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(flushMaramatakaRequests());
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="next-mata-countdown"]')
        ?.textContent,
    ).toContain('18h 45m');

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="next-mata-countdown"]')
        ?.textContent,
    ).toContain('18h 44m');
  });

  it('places Ruhanui at the end of a 13-marama year timeline', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture(),
      todayFixture(),
      cycleFixture(),
      moonDetailsFixture(),
      ruhanuiYearFixture(),
    );
    fixture.detectChanges();

    const monthTicks = Array.from(
      fixture.nativeElement.querySelectorAll('.year-month-tick'),
    ) as HTMLElement[];
    const pipiriTick = monthTicks.find((tick) =>
      tick.textContent?.includes('Te Tahi o Pipiri'),
    );
    const ruhanuiTick = monthTicks.find((tick) =>
      tick.textContent?.includes('Ruhanui'),
    );

    expect(pipiriTick?.style.left).toBe('6.5%');
    expect(Number.parseFloat(ruhanuiTick?.style.left ?? '0')).toBeGreaterThan(
      90,
    );
  });

  it('shows overlap and balanced marama states clearly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture([
        {
          mata: { index: 15, name: 'Ohua', version: 'mita-te-tai-best' },
          startsAt: '2026-01-10T06:45:00.000Z',
          endsAt: '2026-01-11T06:45:00.000Z',
        },
        {
          mata: { index: 15, name: 'Ohua', version: 'mita-te-tai-best' },
          startsAt: '2026-01-11T06:45:00.000Z',
          endsAt: '2026-01-12T06:45:00.000Z',
          overlappingMata: [
            {
              mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
              cycleStartsAt: '2026-01-12T06:45:00.000Z',
              reason: 'new-moon-anchor',
            },
          ],
        },
      ]),
      {
        mata: { index: 15, name: 'Ohua' },
        overlappingMata: [
          {
            mata: { index: 1, name: 'Whiro' },
            cycleStartsAt: '2026-01-12T06:45:00.000Z',
            reason: 'new-moon-anchor',
          },
        ],
        startsAt: '2026-01-10T06:45:00.000Z',
        endsAt: '2026-01-11T06:45:00.000Z',
      },
    );
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="today-overlap-state"]',
      ),
    ).not.toBeNull();
    expect(content).toContain('Also Whiro for the next cycle');
    expect(
      fixture.nativeElement.querySelector('[data-testid="balance-note"]')
        ?.textContent,
    ).toContain('Repeated mata: Ohua x2');
  });

  it('selects dates from mata rows and year month cards', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture([
        {
          mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
          startsAt: '2026-01-10T06:45:00.000Z',
          endsAt: '2026-01-11T06:45:00.000Z',
        },
        {
          mata: { index: 2, name: 'Tirea', version: 'mita-te-tai-best' },
          startsAt: '2026-01-11T06:45:00.000Z',
          endsAt: '2026-01-12T06:45:00.000Z',
        },
      ]),
    );
    fixture.detectChanges();

    const mataButtons = fixture.nativeElement.querySelectorAll(
      '.cycle-list-button',
    ) as NodeListOf<HTMLButtonElement>;
    mataButtons[1].click();

    const mataRequests = flushMaramatakaRequests();
    expect(mataRequests.cycleRequest.request.params.get('date')).toBe(
      '2026-01-11',
    );
    expect(mataRequests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-11T19:46:00',
    );
    flushSuccessfulMaramatakaRequests(mataRequests);
    fixture.detectChanges();

    const yearMonthCard = fixture.nativeElement.querySelector(
      '.year-marama-list article',
    ) as HTMLElement;
    yearMonthCard.click();

    const yearMonthRequests = flushMaramatakaRequests();
    expect(yearMonthRequests.cycleRequest.request.params.get('date')).toBe(
      '2026-01-10',
    );
    expect(
      yearMonthRequests.todayRequest.request.params.get('dateTime'),
    ).toBe('2026-01-10T19:45:00');
    flushSuccessfulMaramatakaRequests(yearMonthRequests);
  });

  it('handles unavailable moon detail fields without empty UI', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture(),
      todayFixture(),
      cycleFixture(),
      {
        ...moonDetailsFixture(),
        lunarAgeDays: null,
        unavailable: ['lunarAgeDays', 'distanceKm'],
      },
    );
    fixture.detectChanges();

    const moonDetailsPanel = fixture.nativeElement.querySelector(
      '[data-testid="moon-details-panel"]',
    );

    expect(moonDetailsPanel).not.toBeNull();
    expect(moonDetailsPanel.textContent).toContain('Waxing Crescent');
    expect(moonDetailsPanel.textContent).not.toContain('Distance');
    expect(moonDetailsPanel.textContent).not.toContain('Age');
  });

  it('renders a moon phase visual from the moon details', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture(),
      todayFixture(),
      cycleFixture(),
      moonDetailsFixture(),
    );
    fixture.detectChanges();

    const moonPhaseArt = fixture.nativeElement.querySelector(
      '.moon-phase-art',
    ) as SVGElement | null;

    expect(moonPhaseArt).not.toBeNull();
    expect(moonPhaseArt?.getAttribute('aria-label')).toContain(
      'Waxing Crescent',
    );
    expect(moonPhaseArt?.getAttribute('aria-label')).toContain('17%');

    const litPhase = moonPhaseArt?.querySelector(
      '.moon-phase-light',
    ) as SVGPathElement | null;
    expect(litPhase?.getAttribute('data-phase-side')).toBe('left');
    expect(litPhase?.getAttribute('d')).toContain('A 42 42');
  });

  it('moves the moon shadow direction after the full-moon mata', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(
      flushMaramatakaRequests(),
      monthFixture(),
      {
        ...todayFixture(),
        mata: { index: 24, name: 'Tangaroa-ā-roto' },
      },
      cycleFixture(),
      {
        ...moonDetailsFixture(),
        phase: 'Waning Crescent',
        fractionIlluminated: 0.17,
      },
    );
    fixture.detectChanges();

    const litPhase = fixture.nativeElement.querySelector(
      '.moon-phase-light',
    ) as SVGPathElement | null;

    expect(litPhase?.getAttribute('data-phase-side')).toBe('right');
    expect(litPhase?.getAttribute('d')).toContain('A 42 42');
  });

  it('uses the selected location for API requests', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    fixture.detectChanges();

    const initialRequests = flushMaramatakaRequests();
    flushSuccessfulMaramatakaRequests(initialRequests);

    const page = fixture.componentInstance as unknown as {
      onLocationChange(locationId: string): void;
    };
    page.onLocationChange('auckland');

    const requests = flushMaramatakaRequests('auckland');
    flushSuccessfulMaramatakaRequests(requests, monthFixture(), {
      mata: { index: 2, name: 'Tirea' },
      startsAt: '2026-01-11T06:45:00.000Z',
      endsAt: '2026-01-12T06:45:00.000Z',
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Auckland');
  });

  it('uses the selected demo date for maramataka and moon detail requests', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T22:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(flushMaramatakaRequests());

    const page = fixture.componentInstance as unknown as {
      onDateChange(date: string): void;
    };
    page.onDateChange('2026-06-26');

    const requests = flushMaramatakaRequests();
    expect(requests.cycleRequest.request.params.get('date')).toBe('2026-06-26');
    expect(requests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-06-26T12:00:00',
    );
    expect(requests.moonDetailsRequest.request.params.get('date')).toBe(
      '2026-06-26',
    );
    expect(requests.starMarkersRequest.request.params.get('date')).toBe(
      '2026-06-26',
    );

    flushSuccessfulMaramatakaRequests(requests, monthFixture(), {
      mata: { index: 2, name: 'Tirea' },
      startsAt: '2026-06-25T00:00:00.000Z',
      endsAt: '2026-06-26T00:00:00.000Z',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tirea');
    expect(
      (
        fixture.nativeElement.querySelector(
          '#date-select',
        ) as HTMLInputElement | null
      )?.value,
    ).toBe('2026-06-26');
  });

  it('uses local NZ midday during daylight saving for selected dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    flushInitialRequests().flush(locationsFixture());
    flushSuccessfulMaramatakaRequests(flushMaramatakaRequests());

    const page = fixture.componentInstance as unknown as {
      onDateChange(date: string): void;
    };
    page.onDateChange('2026-01-10');

    const requests = flushMaramatakaRequests();
    expect(requests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-10T12:00:00',
    );

    flushSuccessfulMaramatakaRequests(requests);
  });

  it('reloads data when the NZ calendar date changes on focus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T09:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    const firstRequests = flushMaramatakaRequests();
    expect(firstRequests.cycleRequest.request.params.get('date')).toBe(
      '2026-01-01',
    );

    flushSuccessfulMaramatakaRequests(firstRequests);

    vi.setSystemTime(new Date('2026-01-01T13:30:00.000Z'));
    window.dispatchEvent(new Event('focus'));

    const secondRequests = flushMaramatakaRequests();
    expect(secondRequests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-02T02:30:00',
    );
    expect(secondRequests.cycleRequest.request.params.get('date')).toBe(
      '2026-01-02',
    );
    expect(secondRequests.moonDetailsRequest.request.params.get('date')).toBe(
      '2026-01-02',
    );
    expect(secondRequests.starMarkersRequest.request.params.get('date')).toBe(
      '2026-01-02',
    );

    flushSuccessfulMaramatakaRequests(secondRequests);
  });

  it('sends h23 midnight for today dateTime', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T11:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());

    const requests = flushMaramatakaRequests();

    expect(requests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-02T00:00:00',
    );

    flushSuccessfulMaramatakaRequests(requests);
  });

  it('shows month and today states independently when requests fail or return empty data', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    const {
      cycleRequest,
      todayRequest,
      moonDetailsRequest,
      yearRequest,
      starMarkersRequest,
    } = flushMaramatakaRequests();

    cycleRequest.flush(cycleFixture());
    todayRequest.flush('Failure', { status: 500, statusText: 'Server Error' });
    moonDetailsRequest.flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });
    yearRequest.flush('Failure', { status: 500, statusText: 'Server Error' });
    starMarkersRequest.flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="month-empty-state"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="today-error-state"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="moon-details-error-state"]',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="star-markers-error-state"]',
      ),
    ).toBeNull();
  });

  it('shows location, month, and today errors when locations fail to load', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush('Failure', {
      status: 500,
      statusText: 'Server Error',
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="locations-error-state"]',
      ),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="month-error-state"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="today-error-state"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="month-empty-state"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="today-empty-state"]'),
    ).toBeNull();
  });
});
