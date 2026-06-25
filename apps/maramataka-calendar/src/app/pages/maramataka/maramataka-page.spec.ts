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
    return httpTestingController.expectOne((req) => req.url === '/api/locations');
  }

  function flushMaramatakaRequests(locationId = 'wellington') {
    const monthRequest = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month' && req.params.get('location') === locationId
    );
    const todayRequest = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/today' && req.params.get('location') === locationId
    );

    return { monthRequest, todayRequest };
  }

  it('shows loading states before data arrives', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="month-loading-state"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="today-loading-state"]')).not.toBeNull();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);
    const { monthRequest, todayRequest } = flushMaramatakaRequests();
    monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });
  });

  it('loads and renders month and today data from the API', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);
    const { monthRequest, todayRequest } = flushMaramatakaRequests();

    expect(monthRequest.request.params.get('date')).toBe('2026-01-11');
    expect(monthRequest.request.params.get('tz')).toBe('13');
    expect(todayRequest.request.params.get('dateTime')).toBe('2026-01-11T01:00:00');

    monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [
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
      ],
    });
    todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Today');
    expect(content).toContain('Wellington');
    expect(content).toContain('Whiro');
    expect(content).toContain('Tirea');
    expect(fixture.nativeElement.querySelector('.night-card.current')?.textContent).toContain('Whiro');
  });

  it('uses the selected location for API requests', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);
    fixture.detectChanges();

    const initialRequests = flushMaramatakaRequests();
    initialRequests.monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    initialRequests.todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });

    const page = fixture.componentInstance as unknown as {
      onLocationChange(locationId: string): void;
    };
    page.onLocationChange('auckland');

    const monthRequest = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month' && req.params.get('location') === 'auckland'
    );
    const todayRequest = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/today' && req.params.get('location') === 'auckland'
    );

    monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    todayRequest.flush({
      mata: { index: 2, name: 'Tirea' },
      startsAt: '2026-01-11T06:45:00.000Z',
      endsAt: '2026-01-12T06:45:00.000Z',
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Auckland');
  });

  it('reloads data when the NZ calendar date changes on focus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T09:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);
    const firstRequests = flushMaramatakaRequests();
    expect(firstRequests.monthRequest.request.params.get('date')).toBe('2026-01-01');

    firstRequests.monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    firstRequests.todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });

    vi.setSystemTime(new Date('2026-01-01T13:30:00.000Z'));
    window.dispatchEvent(new Event('focus'));

    const secondRequests = flushMaramatakaRequests();
    expect(secondRequests.monthRequest.request.params.get('date')).toBe('2026-01-02');
    expect(secondRequests.todayRequest.request.params.get('dateTime')).toBe('2026-01-02T02:30:00');

    secondRequests.monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    secondRequests.todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });
  });

  it('sends h23 midnight for today dateTime', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T11:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);

    const { monthRequest, todayRequest } = flushMaramatakaRequests();

    expect(todayRequest.request.params.get('dateTime')).toBe('2026-01-02T00:00:00');

    monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    todayRequest.flush({
      mata: { index: 1, name: 'Whiro' },
      startsAt: '2026-01-10T06:45:00.000Z',
      endsAt: '2026-01-11T06:45:00.000Z',
    });
  });

  it('shows month and today states independently when requests fail or return empty data', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush([
      { id: 'wellington', name: 'Wellington' },
      { id: 'auckland', name: 'Auckland' },
      { id: 'christchurch', name: 'Christchurch' },
      { id: 'gisborne', name: 'Gisborne' },
    ]);
    const { monthRequest, todayRequest } = flushMaramatakaRequests();

    monthRequest.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });
    todayRequest.flush('Failure', { status: 500, statusText: 'Server Error' });

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="month-empty-state"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="today-error-state"]')).not.toBeNull();
  });

  it('shows location, month, and today errors when locations fail to load', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const locationsRequest = flushInitialRequests();
    locationsRequest.flush('Failure', { status: 500, statusText: 'Server Error' });

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="locations-error-state"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="month-error-state"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="today-error-state"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="month-empty-state"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="today-empty-state"]')).toBeNull();
  });
});