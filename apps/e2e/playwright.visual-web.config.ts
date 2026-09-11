import { defineConfig, devices } from '@playwright/test';

/** Visual-only: gallery route needs web, not API. */
export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:5173',
    ...devices['Pixel 7'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm --filter @ekum/web dev --host 127.0.0.1 --port 5173',
    url: process.env.WEB_URL ?? 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
