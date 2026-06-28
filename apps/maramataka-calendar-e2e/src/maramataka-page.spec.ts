import { expect, test } from '@playwright/test';

test('renders API data for the selected location and updates when the location changes', async ({ page }) => {
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

  await page.addInitScript(({ now }) => {
    const fixedNow = new Date(now).valueOf();
    const RealDate = Date;

    class FixedDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length === 0) {
          super(fixedNow);
          return;
        }

        super(...args);
      }

      static now(): number {
        return fixedNow;
      }
    }

    Object.defineProperty(window, 'Date', {
      configurable: true,
      writable: true,
      value: FixedDate,
    });
  }, { now: fixedNowIso });

  await page.route('**/api/maramataka/month**', async (route) => {
    const location = new URL(route.request().url()).searchParams.get('location');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        ruleSet,
        whiroStartsAt: '2026-06-24T06:00:00.000Z',
        nights: location === 'auckland'
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
    const location = new URL(route.request().url()).searchParams.get('location');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        mata: {
          index: 1,
          name: location === 'auckland' ? 'Mako' : 'Whiro',
        },
        startsAt: location === 'auckland'
          ? '2026-06-25T04:30:00.000Z'
          : '2026-06-25T04:30:00.000Z',
        endsAt: location === 'auckland'
          ? '2026-06-25T05:30:00.000Z'
          : '2026-06-25T05:30:00.000Z',
      }),
    });
  });

  await page.goto('/pages/maramataka');

  await expect(page.getByTestId('today-card')).toContainText('Whiro');
  await expect(page.locator('.night-card')).toHaveCount(2);
  await expect(page.locator('.night-card.current')).toHaveCount(1);
  await expect(page.locator('.night-card.current')).toContainText('Whiro');
  await expect(page.getByText('Mita Te Tai / Best observational maramataka')).toBeVisible();

  await page.selectOption('#location-select', 'auckland');

  await expect(page.getByTestId('today-card')).toContainText('Mako');
  await expect(page.locator('.night-card')).toHaveCount(1);
  await expect(page.locator('.night-card.current')).toHaveCount(1);
  await expect(page.locator('.night-card.current')).toContainText('Mako');
});
