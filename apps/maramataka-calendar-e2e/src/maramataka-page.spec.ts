import { expect, test } from '@playwright/test';

test('renders maramataka month and highlights current night', async ({ page }) => {
  const fixedNowIso = '2026-06-25T05:00:00.000Z';

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
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        version: 'mita-te-tai-best',
        whiroStartsAt: '2026-06-24T06:00:00.000Z',
        nights: [
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

  await page.goto('/pages/maramataka');

  await expect(page.getByRole('heading', { name: 'Maramataka Calendar' })).toBeVisible();
  await expect(page.locator('.night-card')).toHaveCount(2);
  await expect(page.locator('.night-card.current')).toHaveCount(1);
  await expect(page.locator('.night-card.current')).toContainText('Whiro');
});