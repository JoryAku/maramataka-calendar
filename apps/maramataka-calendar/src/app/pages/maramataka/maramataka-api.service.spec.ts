import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MaramatakaApiService } from './maramataka-api.service';
import { MaramatakaCycleDetails } from './maramataka.models';

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
    maramaStart: 'new-moon-moonrise',
    mataBoundary: 'moonrise-to-moonrise',
    calibration: 'full-moon-ohua',
    balancing: 'duplicate-ohua-drop-final-mata',
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
          source: 'usno moonrise',
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
          source: 'usno',
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
          source: 'usno moonrise',
          mata: {
            index: 1,
            name: 'Whiro',
            version: 'mita-te-tai-best',
          },
        },
      },
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
  });
});
