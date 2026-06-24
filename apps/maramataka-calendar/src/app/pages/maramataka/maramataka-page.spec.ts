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
    vi.useRealTimers();
  });

  it('calls /api/maramataka/month and renders the returned month', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const request = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month'
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('date')).toBeTruthy();
    expect(request.request.params.get('lat')).toBe('-41.2865');
    expect(request.request.params.get('lon')).toBe('174.7762');
    expect(request.request.params.get('tz')).toBeTruthy();

    request.flush({
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

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Whiro');
    expect(content).toContain('Tirea');
    expect(content).toContain('Version:');
  });

  it('highlights the current maramataka night', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-10T12:00:00.000Z'));

    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const request = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month'
    );
    request.flush({
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

    fixture.detectChanges();

    const currentCards = fixture.nativeElement.querySelectorAll('.night-card.current');
    expect(currentCards.length).toBe(1);
    expect(currentCards[0].textContent).toContain('Whiro');
  });

  it('shows an error state when API request fails', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const request = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month'
    );
    request.flush('Failure', { status: 500, statusText: 'Server Error' });

    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '[data-testid="error-state"]'
    ) as HTMLElement | null;

    expect(error).not.toBeNull();
    expect(error?.textContent).toContain('Unable to load maramataka month');
  });

  it('shows an empty state when no nights are returned', () => {
    const fixture = TestBed.createComponent(MaramatakaPage);
    fixture.detectChanges();

    const request = httpTestingController.expectOne((req) =>
      req.url === '/api/maramataka/month'
    );
    request.flush({
      version: 'mita-te-tai-best',
      whiroStartsAt: '2026-01-10T06:45:00.000Z',
      nights: [],
    });

    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector(
      '[data-testid="empty-state"]'
    ) as HTMLElement | null;

    expect(emptyState).not.toBeNull();
    expect(emptyState?.textContent).toContain(
      'No maramataka nights are available for this month.'
    );
  });
});
