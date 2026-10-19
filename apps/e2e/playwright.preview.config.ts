import { defineConfig } from '@playwright/test';
import { ciReporter, diagnosticsUse, mobileProjects } from './helpers/playwrightShared';

/**
 * Production Vite build via `vite preview` (service worker on).
 * Same-origin /api and /media are proxied to the API (see vite `preview.proxy`).
 * Not the nginx gateway — Docker smoke covers `/api/v1/web-build`.
 * WebKit here is not real iOS.
 */
process.env.EKUM_WEB_URL ??= 'http://127.0.0.1:4173';
process.env.EKUM_API_URL ??= 'http://127.0.0.1:3000/api/v1';
process.env.EKUM_EXPECT_SW ??= '1';

const WEB_URL = process.env.EKUM_WEB_URL;
const API_URL = process.env.EKUM_API_URL;
const apiOrigin = API_URL.replace(/\/api\/v1\/?$/, '');

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
      command: 'pnpm --filter @ekum/api start',
      url: `${apiOrigin}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        OTP_EXPOSE_DEV_CODE: 'true',
        CORS_ORIGINS: 'http://127.0.0.1:4173,http://127.0.0.1:5173,http://localhost:5173',
      },
    },
    {
      command:
        'pnpm --filter @ekum/web build && pnpm --filter @ekum/web exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: {
        ...process.env,
        VITE_API_BASE_URL: '/api/v1',
        EKUM_EXPECT_SW: '1',
      },
    },
  ],
});
