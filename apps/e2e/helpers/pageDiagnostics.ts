import { test as base, expect, type Page, type TestInfo } from '@playwright/test';

/**
 * Collect console errors and failed/HTTP≥400 responses.
 * Attached only when the test does not match its expected status.
 */
export function watchPageDiagnostics(page: Page) {
  const consoleErrors: string[] = [];
  const failedNetwork: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (req) => {
    failedNetwork.push(`FAILED ${req.failure()?.errorText ?? ''} ${req.method()} ${req.url()}`);
  });
  page.on('response', (res) => {
    if (res.status() < 400) return;
    const url = res.url();
    // Vite dev has no gateway web-build route; the client polls it and falls back.
    if (url.includes('/web-build') || url.endsWith('/version.json')) return;
    failedNetwork.push(`${res.status()} ${res.request().method()} ${url}`);
  });
  return { consoleErrors, failedNetwork };
}

export async function attachPageDiagnostics(
  testInfo: TestInfo,
  logs: { consoleErrors: string[]; failedNetwork: string[] },
) {
  if (testInfo.status === testInfo.expectedStatus) return;
  await testInfo.attach('console-errors.txt', {
    body: logs.consoleErrors.join('\n') || '(none)',
    contentType: 'text/plain',
  });
  await testInfo.attach('failed-network.txt', {
    body: logs.failedNetwork.join('\n') || '(none)',
    contentType: 'text/plain',
  });
}

/** Drop-in `test` that records diagnostics for smoke and mobile regressions. */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const logs = watchPageDiagnostics(page);
    await use(page);
    await attachPageDiagnostics(testInfo, logs);
  },
});

export { expect };
