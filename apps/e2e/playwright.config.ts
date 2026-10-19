import { defineConfig } from '@playwright/test';
import { API_URL, WEB_URL } from './helpers/env';
import { ciReporter, diagnosticsUse, mobileProjects } from './helpers/playwrightShared';

const apiOrigin = API_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Day-to-day journeys: Vite dev + API dev.
 * Service worker is off in Vite dev — PWA checks belong on preview/docker configs.
 * WebKit project is engine simulation only, not a real iPhone.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: ciReporter,
  use: {
    baseURL: WEB_URL,
    ...diagnosticsUse,
  },
  projects: mobileProjects(true),
  webServer: [
    {
      command: 'pnpm --filter @ekum/api dev',
      url: `${apiOrigin}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        OTP_EXPOSE_DEV_CODE: 'true',
      },
    },
    {
      command: 'pnpm --filter @ekum/web dev',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
