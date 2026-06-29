import { defineConfig, devices } from '@playwright/test';
import { join } from 'node:path';

// For CI, you may want to set BASE_URL to the deployed application.
const e2ePort = process.env['E2E_PORT'] || '4200';
const baseURL = process.env['BASE_URL'] || `http://localhost:${e2ePort}`;
const workspaceRoot = join(__dirname, '../..');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import 'dotenv/config';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Keep this file as plain `.ts`; Nx reads Playwright configs while building
 * the project graph, and `.mts` is not supported by its local loader here.
 */
export default defineConfig({
  testDir: './src',
  outputDir: '../../dist/playwright/apps/maramataka-calendar-e2e',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npx nx run maramataka-calendar:serve --port=${e2ePort}`,
    url: baseURL,
    reuseExistingServer: true,
    cwd: workspaceRoot,
    env: {
      MARAMATAKA_ASTRONOMY_MODE: 'stub',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Uncomment for mobile browsers support
    /* {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    }, */

    // Uncomment for branded browsers
    /* {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    } */
  ],
});
