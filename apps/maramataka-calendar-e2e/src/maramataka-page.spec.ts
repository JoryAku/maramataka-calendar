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
  const starMarker = {
    id: 'matariki',
    name: 'Matariki',
    type: 'asterism',
    englishName: 'Pleiades',
    description: 'Pleiades; year-start marker appearing on the dawn horizon.',
    seasonalAssociation: 'Year-start ariki for Te Tahi o Pipiri',
    source: 'Elsdon Best, The Maori Division of Time',
    confidence: 'confirmed',
    observedAt: '2026-06-24T18:00:00.000Z',
    altitudeDegrees: 24,
    azimuthDegrees: 74,
    direction: 'E',
    visibility: 'prominent',
    calculation:
      'Dawn sky position sampled at 06:00 local time for the selected location.',
  };
  const otherVisibleStarMarker = {
    id: 'puanga',
    name: 'Puanga',
    type: 'star',
    englishName: 'Rigel',
    description:
      'A visible marker that is not assigned to the active named month.',
    seasonalAssociation: 'Another rule-set marker',
    source: 'Elsdon Best, The Maori Division of Time',
    confidence: 'confirmed',
    observedAt: '2026-06-24T18:00:00.000Z',
    altitudeDegrees: 18,
    azimuthDegrees: 80,
    direction: 'E',
    visibility: 'visible',
    calculation:
      'Dawn sky position sampled at 06:00 local time for the selected location.',
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
    const url = new URL(route.request().url());
    const location = url.searchParams.get('location');
    const date = url.searchParams.get('date');
    const isAuckland = location === 'auckland';
    const isDemoDate = date === '2026-06-26';

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: '2026-06-24T06:00:00.000Z',
        nights: isDemoDate
          ? [
              {
                mata: { index: 14, name: 'Atua', version: 'mita-te-tai-best' },
                startsAt: '2026-06-26T04:30:00.000Z',
                endsAt: '2026-06-26T05:30:00.000Z',
              },
              {
                mata: { index: 15, name: 'Ohua', version: 'mita-te-tai-best' },
                startsAt: '2026-06-26T05:30:00.000Z',
                endsAt: '2026-06-26T06:30:00.000Z',
              },
            ]
          : isAuckland
            ? [
                {
                  mata: { index: 1, name: 'Mako', version: 'mita-te-tai-best' },
                  startsAt: '2026-06-25T04:30:00.000Z',
                  endsAt: '2026-06-25T05:30:00.000Z',
                },
              ]
            : [
                {
                  mata: {
                    index: 1,
                    name: 'Whiro',
                    version: 'mita-te-tai-best',
                  },
                  startsAt: '2026-06-25T04:30:00.000Z',
                  endsAt: '2026-06-25T05:30:00.000Z',
                },
                {
                  mata: {
                    index: 2,
                    name: 'Tirea',
                    version: 'mita-te-tai-best',
                  },
                  startsAt: '2026-06-25T05:30:00.000Z',
                  endsAt: '2026-06-25T06:30:00.000Z',
                },
              ],
      }),
    });
  });

  await page.route('**/api/maramataka/cycle**', async (route) => {
    const url = new URL(route.request().url());
    const location = url.searchParams.get('location');
    const date = url.searchParams.get('date');
    const isAuckland = location === 'auckland';
    const isDemoDate = date === '2026-06-26';
    const mata = {
      index: isDemoDate ? 14 : 1,
      name: isDemoDate ? 'Atua' : isAuckland ? 'Mako' : 'Whiro',
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
        starMonth: {
          name: 'Te Tahi o Pipiri',
          marker: starMarker,
          rule: ruleSet.starMonthNaming.strategy,
          source: ruleSet.starMonthNaming.source,
          note: ruleSet.starMonthNaming.months[0],
        },
        starMarkers: [starMarker],
        nights: [
          {
            mata,
            startsAt: '2026-06-25T04:30:00.000Z',
            endsAt: '2026-06-25T05:30:00.000Z',
          },
        ],
        events: [
          {
            type: 'month-start',
            name: 'Te Tahi o Pipiri',
            occursAt: '2026-06-25T04:30:00.000Z',
            monthSequence: 1,
            monthName: 'Te Tahi o Pipiri',
            description: 'Maramataka month begins at Whiro.',
            source: 'stub moonrise',
          },
          {
            type: 'star-marker',
            name: 'Matariki',
            occursAt: '2026-06-25T18:00:00.000Z',
            monthSequence: 1,
            monthName: 'Te Tahi o Pipiri',
            description: 'Year-start ariki for Te Tahi o Pipiri',
            source: 'Elsdon Best, The Maori Division of Time',
          },
          {
            type: 'new-moon',
            name: 'New Moon',
            occursAt: '2026-06-25T03:30:00.000Z',
            monthSequence: 1,
            monthName: 'Te Tahi o Pipiri',
            description: 'Astronomical New Moon anchor for Whiro.',
            source: 'stub',
          },
          {
            type: 'full-moon',
            name: 'Full Moon',
            occursAt: '2026-07-09T04:30:00.000Z',
            monthSequence: 1,
            monthName: 'Te Tahi o Pipiri',
            description: 'Astronomical Full Moon anchor for Rakaunui / Ohua.',
            source: 'stub',
          },
        ],
      }),
    });
  });

  await page.route('**/api/maramataka/year**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        ruleSet,
        year: 2026,
        timezone: 'Pacific/Auckland',
        startsAt: '2025-12-31T11:00:00.000Z',
        endsAt: '2026-12-31T11:00:00.000Z',
        months: [
          {
            sequence: 1,
            name: 'Marama 1',
            startsAt: '2026-06-25T04:30:00.000Z',
            endsAt: '2026-07-24T04:30:00.000Z',
            durationDays: 29,
            nightsCount: 29,
            repeatedMata: [],
            anchors: {
              whiro: {
                type: 'whiro',
                label: 'Whiro / Kohititanga',
                occursAt: '2026-06-25T04:30:00.000Z',
                localDate: '2026-06-25',
                localTime: '16:30:00',
                timezone: 'Pacific/Auckland',
                source: 'stub moonrise',
              },
              fullMoon: {
                type: 'full-moon',
                label: 'Rakaunui / Full Moon',
                occursAt: '2026-07-09T04:30:00.000Z',
                localDate: '2026-07-09',
                localTime: '16:30:00',
                timezone: 'Pacific/Auckland',
                source: 'stub',
              },
              nextWhiro: {
                type: 'next-whiro',
                label: 'Next Whiro / Kohititanga',
                occursAt: '2026-07-24T04:30:00.000Z',
                localDate: '2026-07-24',
                localTime: '16:30:00',
                timezone: 'Pacific/Auckland',
                source: 'stub moonrise',
              },
            },
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
    const url = new URL(route.request().url());
    const location = url.searchParams.get('location');
    const dateTime = url.searchParams.get('dateTime') ?? '';
    const isAuckland = location === 'auckland';
    const isDemoDate = dateTime.startsWith('2026-06-26');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mata: {
          index: isDemoDate ? 14 : 1,
          name: isDemoDate ? 'Atua' : isAuckland ? 'Mako' : 'Whiro',
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
              recommendations: isDemoDate
                ? ['He marama pai']
                : isAuckland
                  ? ['Mo te rama']
                  : ['Mo te hi', 'Mo te rama'],
            },
          ],
        },
        startsAt:
          location === 'auckland'
            ? '2026-06-25T04:30:00.000Z'
            : '2026-06-25T04:30:00.000Z',
        endsAt:
          location === 'auckland'
            ? '2026-06-25T05:30:00.000Z'
            : '2026-06-25T05:30:00.000Z',
      }),
    });
  });

  await page.route('**/api/maramataka/moon-details**', async (route) => {
    const url = new URL(route.request().url());
    const location = url.searchParams.get('location');
    const date = url.searchParams.get('date');
    const isDemoDate = date === '2026-06-26';

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        date: isDemoDate ? '2026-06-26' : '2026-06-25',
        phase: isDemoDate
          ? 'Full Moon'
          : location === 'auckland'
            ? 'First Quarter'
            : 'Waxing Crescent',
        fractionIlluminated: isDemoDate
          ? 0.99
          : location === 'auckland'
            ? 0.5
            : 0.25,
        lunarAgeDays: isDemoDate ? 14 : location === 'auckland' ? 7.1 : 2.5,
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

  await page.route('**/api/maramataka/star-markers**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([starMarker, otherVisibleStarMarker]),
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
  await expect(page.getByTestId('star-marker-layer')).toContainText(
    'Matariki',
  );
  await expect(page.getByTestId('star-marker-layer')).not.toContainText(
    'Rigel',
  );
  await expect(page.getByTestId('cycle-star-marker-layer')).toContainText(
    'Star month: Te Tahi o Pipiri',
  );
  await expect(page.getByTestId('cycle-star-marker-layer')).toContainText(
    'The First of Pipiri',
  );
  await expect(page.getByTestId('cycle-star-marker-layer')).toContainText(
    'Matariki (Pleiades) on the horizon at dawn',
  );
  await expect(page.getByLabel('Moon timings')).toContainText('Moonset');
  await expect(page.getByLabel('Moon timings')).toContainText('Meridian');
  await expect(page.locator('.cycle-wheel')).toBeVisible();
  await expect(page.getByTestId('year-rhythm-timeline')).toContainText(
    'Matariki',
  );
  await expect(page.getByTestId('year-rhythm-timeline')).toContainText(
    'New Moon',
  );
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

  await page.locator('#date-select').fill('2026-06-26');
  await page.locator('#date-select').dispatchEvent('change');

  await expect(page.getByTestId('today-card')).toContainText('Atua');
  await expect(page.getByTestId('fishing-guidance-layer')).toContainText(
    'He marama pai',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText(
    'Full Moon',
  );
  await expect(page.getByTestId('moon-details-panel')).toContainText('99%');
  await expect(page.locator('.wheel-segment')).toHaveCount(2);
  await expect(page.locator('.wheel-segment.current')).toHaveAttribute(
    'aria-label',
    /Atua/,
  );
});
