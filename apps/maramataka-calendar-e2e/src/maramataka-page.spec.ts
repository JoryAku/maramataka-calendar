import { expect, test } from '@playwright/test';

test('renders the MVP moon tracker and cycle wheel for the selected location', async ({
  page,
}) => {
  const fixedNowIso = '2026-06-25T05:00:00.000Z';
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

  await page.addInitScript(
    ({ now }) => {
      const fixedNow = new Date(now).valueOf();
      const RealDate = Date;

      class FixedDate extends RealDate {
        constructor(
          valueOrYear?: string | number | Date,
          monthIndex?: number,
          date?: number,
          hours?: number,
          minutes?: number,
          seconds?: number,
          ms?: number,
        ) {
          if (arguments.length === 0) {
            super(fixedNow);
            return;
          }

          if (
            typeof monthIndex === 'number' &&
            typeof valueOrYear === 'number'
          ) {
            super(valueOrYear, monthIndex, date, hours, minutes, seconds, ms);
            return;
          }

          super(valueOrYear as string | number | Date);
        }

        static override now(): number {
          return fixedNow;
        }
      }

      Object.defineProperty(window, 'Date', {
        configurable: true,
        writable: true,
        value: FixedDate,
      });
    },
    { now: fixedNowIso },
  );

  await page.route('**/api/maramataka/month**', async (route) => {
    const location = new URL(route.request().url()).searchParams.get(
      'location',
    );
    const isAuckland = location === 'auckland';

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: '2026-06-24T06:00:00.000Z',
        nights: isAuckland
          ? [
              {
                mata: { index: 1, name: 'Mako', version: 'mita-te-tai-best' },
                startsAt: '2026-06-25T04:30:00.000Z',
                endsAt: '2026-06-25T05:30:00.000Z',
              },
            ]
          : [
              {
                mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
                startsAt: '2026-06-25T04:30:00.000Z',
                endsAt: '2026-06-25T05:30:00.000Z',
              },
              {
                mata: { index: 2, name: 'Tirea', version: 'mita-te-tai-best' },
                startsAt: '2026-06-25T05:30:00.000Z',
                endsAt: '2026-06-25T06:30:00.000Z',
              },
            ],
      }),
    });
  });

  await page.route('**/api/maramataka/cycle**', async (route) => {
    const location = new URL(route.request().url()).searchParams.get(
      'location',
    );
    const isAuckland = location === 'auckland';
    const mata = {
      index: 1,
      name: isAuckland ? 'Mako' : 'Whiro',
      version: 'mita-te-tai-best',
    };

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        ruleSet,
        timezone: 'Pacific/Auckland',
        currentMataIndex: 1,
        currentNight: {
          mata,
          startsAt: '2026-06-25T04:30:00.000Z',
          endsAt: '2026-06-25T05:30:00.000Z',
        },
        anchors: {
          whiro: {
            type: 'whiro',
            label: 'Whiro / Kohititanga',
            occursAt: '2026-06-25T04:30:00.000Z',
            localDate: '2026-06-25',
            localTime: '16:30:00',
            timezone: 'Pacific/Auckland',
            source: 'stub moonrise',
            mata,
          },
          fullMoon: {
            type: 'full-moon',
            label: 'Rakaunui / Full Moon',
            occursAt: '2026-06-25T05:00:00.000Z',
            localDate: '2026-06-25',
            localTime: '17:00:00',
            timezone: 'Pacific/Auckland',
            source: 'stub',
            mata,
          },
          nextWhiro: {
            type: 'next-whiro',
            label: 'Next Whiro / Kohititanga',
            occursAt: '2026-06-25T06:30:00.000Z',
            localDate: '2026-06-25',
            localTime: '18:30:00',
            timezone: 'Pacific/Auckland',
            source: 'stub moonrise',
            mata: { index: 1, name: 'Whiro', version: 'mita-te-tai-best' },
          },
        },
        nights: [
          {
            mata,
            startsAt: '2026-06-25T04:30:00.000Z',
            endsAt: '2026-06-25T05:30:00.000Z',
          },
        ],
      }),
    });
  });

  await page.route('**/api/locations**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'wellington', name: 'Wellington' },
        { id: 'auckland', name: 'Auckland' },
        { id: 'christchurch', name: 'Christchurch' },
        { id: 'gisborne', name: 'Gisborne' },
      ]),
    });
  });

  await page.route('**/api/maramataka/today**', async (route) => {
    const location = new URL(route.request().url()).searchParams.get(
      'location',
    );
    const isAuckland = location === 'auckland';

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mata: {
          index: 1,
          name: isAuckland ? 'Mako' : 'Whiro',
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
              recommendations: isAuckland
                ? ['Mo te rama']
                : ['Mo te hi', 'Mo te rama'],
            },
          ],
        },
        startsAt: isAuckland
          ? '2026-06-25T04:30:00.000Z'
          : '2026-06-25T04:30:00.000Z',
        endsAt: isAuckland
          ? '2026-06-25T05:30:00.000Z'
          : '2026-06-25T05:30:00.000Z',
      }),
    });
  });

  await page.route('**/api/maramataka/moon-details**', async (route) => {
    const location = new URL(route.request().url()).searchParams.get(
      'location',
    );

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        date: '2026-06-25',
        phase: location === 'auckland' ? 'First Quarter' : 'Waxing Crescent',
        fractionIlluminated: location === 'auckland' ? 0.5 : 0.25,
        lunarAgeDays: location === 'auckland' ? 7.1 : 2.5,
        distanceKm: null,
        lunarAgeSource: 'stub',
        closestPhase: {
          phase: 'Full Moon',
          occursAt: '2026-06-25T05:00:00.000Z',
          source: 'stub',
        },
        moonrise: {
          occursAt: '2026-06-25T04:30:00.000Z',
          source: 'stub',
        },
        moonset: {
          occursAt: '2026-06-25T18:15:00.000Z',
          source: 'stub',
        },
        transit: {
          occursAt: '2026-06-25T12:00:00.000Z',
          source: 'stub',
        },
        unavailable: ['distanceKm'],
        source: 'stub',
      }),
    });
  });

  await page.goto('/pages/maramataka');

  await expect(page.getByTestId('today-card')).toContainText('Whiro');
  await expect(page.getByTestId('fishing-guidance-layer')).toContainText(
    'Mo te hi',
  );
  await expect(page.getByTestId('fishing-guidance-layer')).toContainText(
    'Source',
  );
  await expect(
    page.getByTestId('fishing-guidance-layer').getByRole('link'),
  ).toHaveAttribute(
    'href',
    'https://ndhadeliver.natlib.govt.nz/webarchive/20260627031905/https://nzetc.victoria.ac.nz/tm/scholarly/tei-BesFish-t1-body-d8-d1.html',
  );
  await expect(page.getByTestId('next-mata-countdown')).toContainText(
    '30m until next mata',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText(
    'Waxing Crescent',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText('25%');
  await expect(page.getByTestId('moon-details-panel')).toContainText(
    '2.5 days',
  );
  await expect(page.getByLabel('Moon timings')).toContainText('Moonset');
  await expect(page.getByLabel('Moon timings')).toContainText('Meridian');
  await expect(page.locator('.cycle-wheel')).toBeVisible();
  await expect(page.locator('.wheel-segment')).toHaveCount(2);
  await expect(page.locator('.wheel-segment.current')).toHaveCount(1);
  await expect(page.locator('.wheel-segment.current')).toHaveAttribute(
    'aria-label',
    /Whiro/,
  );
  await expect(
    page.getByText('Mita Te Tai / Best observational maramataka'),
  ).toBeVisible();

  await page.selectOption('#location-select', 'auckland');

  await expect(page.getByTestId('today-card')).toContainText('Mako');
  await expect(page.getByTestId('fishing-guidance-layer')).toContainText(
    'Mo te rama',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText(
    'First Quarter',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText('50%');
  await expect(page.locator('.wheel-segment')).toHaveCount(1);
  await expect(page.locator('.wheel-segment.current')).toHaveAttribute(
    'aria-label',
    /Mako/,
  );
});
