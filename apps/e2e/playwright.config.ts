import { defineConfig, devices } from '@playwright/test';
import { WEB_URL } from './helpers/env';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    ...devices['Pixel 7'],
  },
  // Prefer starting servers outside CI locally; in CI set webServer or workflow services.
});
