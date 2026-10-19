import { defineConfig } from '@playwright/test';
import { ciReporter, diagnosticsUse, mobileProjects } from './helpers/playwrightShared';

/**
 * Smoke against a running Compose stack (nginx :8080, production web image, service worker).
 * Does not boot Vite. Start with `pnpm docker:up` and `pnpm docker:seed` first.
 * WebKit here is not real iOS. Home Screen / soft keyboard stay on the device checklist.
 */
process.env.EKUM_WEB_URL ??= 'http://127.0.0.1:8080';
process.env.EKUM_API_URL ??= 'http://127.0.0.1:8080/api/v1';
process.env.EKUM_EXPECT_SW ??= '1';
process.env.EKUM_EXPECT_GATEWAY ??= '1';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: ciReporter,
  grep: /@smoke/,
  use: {
    baseURL: process.env.EKUM_WEB_URL,
    ...diagnosticsUse,
  },
  projects: mobileProjects(true),
});
