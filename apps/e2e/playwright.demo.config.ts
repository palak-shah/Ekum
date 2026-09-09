import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.EKUM_WEB_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'capture-journey-pdfs.spec.ts',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: WEB_URL,
    ...devices['Pixel 7'],
    screenshot: 'off',
    video: 'off',
  },
});
