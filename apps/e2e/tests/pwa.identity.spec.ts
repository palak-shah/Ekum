import { test, expect } from '../helpers/pageDiagnostics';
import { API_URL, WEB_URL } from '../helpers/env';

/**
 * Production-build only. Vite dev leaves the service worker disabled, so these
 * tests skip unless preview or Docker smoke set EKUM_EXPECT_SW=1.
 * A registered worker in WebKit is still not iOS Safari or a Home Screen install.
 */
test.describe('pwa identity @smoke @regression @pwa', () => {
  test.skip(
    process.env.EKUM_EXPECT_SW !== '1',
    'Service worker is off on Vite dev. Use test:e2e:smoke:preview or test:e2e:smoke:docker.',
  );

  test('service worker registers and version.json matches the page build', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const reg = await navigator.serviceWorker?.getRegistration();
            return reg?.active?.scriptURL ?? reg?.installing?.scriptURL ?? reg?.waiting?.scriptURL ?? '';
          }),
        { timeout: 20_000 },
      )
      .toMatch(/sw\.js/);

    const versionRes = await page.request.get(`${WEB_URL}/version.json`);
    expect(versionRes.ok()).toBeTruthy();
    const versionJson = (await versionRes.json()) as { build?: string; version?: string };
    expect(versionJson.build).toBeTruthy();
    expect(versionJson.version).toBeTruthy();

    const metaBuild = await page.locator('meta[name="ekum-web-build"]').getAttribute('content');
    expect(metaBuild).toBe(versionJson.build);

    const apiVersion = await page.request.get(`${API_URL}/version`);
    expect(apiVersion.ok()).toBeTruthy();
    const apiBody = (await apiVersion.json()) as { version?: string };
    expect(apiBody.version).toBeTruthy();
  });

  test('media navigation is not the app shell', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const reg = await navigator.serviceWorker?.getRegistration();
            return Boolean(reg?.active || reg?.installing || reg?.waiting);
          }),
        { timeout: 20_000 },
      )
      .toBe(true);

    // Second navigation is the one a controlling worker can intercept.
    const response = await page.goto('/media/e2e-does-not-exist.jpg');
    const html = await page.content();
    expect(html).not.toContain('id="root"');
    expect(response?.status() ?? 0).not.toBe(200);
  });

  test('gateway web-build matches version.json', async ({ page }) => {
    test.skip(
      process.env.EKUM_EXPECT_GATEWAY !== '1',
      'Nginx /api/v1/web-build proxy is covered by Docker smoke, not vite preview.',
    );
    const webBuild = await page.request.get(`${API_URL}/web-build`);
    expect(webBuild.ok()).toBeTruthy();
    const remote = (await webBuild.json()) as { build?: string };
    const versionRes = await page.request.get(`${WEB_URL}/version.json`);
    const versionJson = (await versionRes.json()) as { build?: string };
    expect(remote.build).toBe(versionJson.build);
  });
});
