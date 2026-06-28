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
    maramaStart: 'new-moon-moonrise',
    mataBoundary: 'moonrise-to-moonrise',
    calibration: 'full-moon-ohua',
    balancing: 'duplicate-ohua-drop-final-mata',
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
    const monthRequest = httpTestingController.expectOne(
      (req) =>
        req.url === '/api/maramataka/month' &&
        req.params.get('location') === locationId,
    );
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

    return { monthRequest, cycleRequest, todayRequest, moonDetailsRequest };
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
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    };
  }

  function cycleFixture() {
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
          source: 'usno moonrise',
        },
        fullMoon: {
          type: 'full-moon',
          label: 'Rakaunui / Full Moon',
          occursAt: '2026-01-11T03:00:00.000Z',
          localDate: '2026-01-11',
          localTime: '16:00:00',
          timezone: 'Pacific/Auckland',
          source: 'usno',
        },
        nextWhiro: {
          type: 'next-whiro',
          label: 'Next Whiro / Kohititanga',
          occursAt: '2026-01-12T06:45:00.000Z',
          localDate: '2026-01-12',
          localTime: '19:45:00',
          timezone: 'Pacific/Auckland',
          source: 'usno moonrise',
        },
      },
      nights: [],
    };
  }

  function moonDetailsFixture(): Record<string, unknown> {
    return {
      date: '2026-01-11',
      phase: 'Waxing Crescent',
      fractionIlluminated: 0.17,
      lunarAgeDays: 2.5,
      lunarAgeSource: 'usno moon phases',
      distanceKm: null,
      moonrise: {
        occursAt: '2026-01-10T06:45:00.000Z',
        source: 'usno',
      },
      moonset: {
        occursAt: '2026-01-10T19:12:00.000Z',
        source: 'usno',
      },
      transit: {
        occursAt: '2026-01-10T12:41:00.000Z',
        source: 'usno',
      },
      unavailable: ['distanceKm'],
      source: 'usno',
    };
  }

  function flushSuccessfulMaramatakaRequests(
    requests: ReturnType<typeof flushMaramatakaRequests>,
    month = monthFixture(),
    today = todayFixture(),
    cycle = cycleFixture(),
    moonDetails = moonDetailsFixture(),
  ): void {
    requests.monthRequest.flush(month);
    requests.cycleRequest.flush(cycle);
    requests.todayRequest.flush(today);
    requests.moonDetailsRequest.flush(moonDetails);
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
    const { monthRequest, cycleRequest, todayRequest, moonDetailsRequest } =
      requests;

    expect(monthRequest.request.params.get('date')).toBe('2026-01-11');
    expect(monthRequest.request.params.has('tz')).toBe(false);
    expect(todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-11T01:00:00',
    );
    expect(cycleRequest.request.params.get('date')).toBe('2026-01-11');
    expect(moonDetailsRequest.request.params.get('date')).toBe('2026-01-11');

    flushSuccessfulMaramatakaRequests(
      requests,
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

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Today');
    expect(content).toContain('Wellington');
    expect(content).toContain('Whiro');
    expect(content).toContain('Tirea');
    expect(content).toContain('Mita Te Tai / Best observational maramataka');
    expect(content).toContain('Waxing Crescent');
    expect(content).toContain('17%');
    expect(content).toContain('Meridian');
    expect(
      fixture.nativeElement.querySelector('.wheel-segment.current')?.textContent,
    ).toContain('Whiro');
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
      fixture.nativeElement.querySelector(
        '[data-testid="next-mata-countdown"]',
      )?.textContent,
    ).toContain('18h 45m');

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="next-mata-countdown"]',
      )?.textContent,
    ).toContain('18h 44m');
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
      fixture.nativeElement.querySelector('[data-testid="today-overlap-state"]'),
    ).not.toBeNull();
    expect(content).toContain('Also Whiro for the next cycle');
    expect(
      fixture.nativeElement.querySelector('[data-testid="balance-note"]')
        ?.textContent,
    ).toContain('Repeated mata: Ohua x2');
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
    flushSuccessfulMaramatakaRequests(
      requests,
      monthFixture(),
      {
        mata: { index: 2, name: 'Tirea' },
        startsAt: '2026-01-11T06:45:00.000Z',
        endsAt: '2026-01-12T06:45:00.000Z',
      },
    );

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Auckland');
  });

  it('reloads data when the NZ calendar date changes on focus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T09:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush(locationsFixture());
    const firstRequests = flushMaramatakaRequests();
    expect(firstRequests.monthRequest.request.params.get('date')).toBe(
      '2026-01-01',
    );

    flushSuccessfulMaramatakaRequests(firstRequests);

    vi.setSystemTime(new Date('2026-01-01T13:30:00.000Z'));
    window.dispatchEvent(new Event('focus'));

    const secondRequests = flushMaramatakaRequests();
    expect(secondRequests.monthRequest.request.params.get('date')).toBe(
      '2026-01-02',
    );
    expect(secondRequests.todayRequest.request.params.get('dateTime')).toBe(
      '2026-01-02T02:30:00',
    );
    expect(secondRequests.cycleRequest.request.params.get('date')).toBe(
      '2026-01-02',
    );
    expect(secondRequests.moonDetailsRequest.request.params.get('date')).toBe(
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
    const { monthRequest, cycleRequest, todayRequest, moonDetailsRequest } =
      flushMaramatakaRequests();

    monthRequest.flush(monthFixture());
    cycleRequest.flush(cycleFixture());
    todayRequest.flush('Failure', { status: 500, statusText: 'Server Error' });
    moonDetailsRequest.flush('Failure', {
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
