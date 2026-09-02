import { defineConfig, devices } from '@playwright/test';
import { API_URL, WEB_URL } from './helpers/env';

const apiOrigin = API_URL.replace(/\/api\/v1\/?$/, '');

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    ...devices['Pixel 7'],
  },
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
