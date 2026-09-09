import { test, expect, type Page } from '@playwright/test';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';

type NoiseHit = { where: string; text: string };

async function collectVisibleNoise(page: Page): Promise<NoiseHit[]> {
  const hits: NoiseHit[] = [];
  const alerts = page.getByRole('alert');
  const n = await alerts.count();
  for (let i = 0; i < n; i += 1) {
    const text = (await alerts.nth(i).innerText()).trim();
    if (text) hits.push({ where: 'alert', text });
  }
  const toast = page.getByTestId('app-toast');
  if ((await toast.count()) > 0 && (await toast.first().isVisible().catch(() => false))) {
    const text = (await toast.first().innerText()).trim();
    if (text) hits.push({ where: 'toast', text });
  }
  return hits;
}

async function wander(page: Page, paths: string[]): Promise<NoiseHit[]> {
  const noise: NoiseHit[] = [];
  for (const path of paths) {
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    const crashed = page.getByText(/Unexpected Application Error|404 Not Found/i);
    if ((await crashed.count()) > 0) {
      noise.push({ where: path, text: `route crash: ${(await crashed.first().innerText()).slice(0, 120)}` });
    }
    const pageNoise = await collectVisibleNoise(page);
    for (const hit of pageNoise) {
      noise.push({ where: `${path} · ${hit.where}`, text: hit.text });
    }
  }
  return noise;
}

const BUYER_PATHS = [
  '/',
  '/chats',
  '/explore',
  '/orders',
  '/more',
  '/selection',
  '/saved',
  '/network',
  '/network/requests',
  '/grants',
  '/settings',
  '/settings/paths',
  '/collections/seed-col-1',
  '/samples',
  '/returns',
  '/referrals',
  '/broadcast',
  '/team',
];

const SELLER_PATHS = [
  '/',
  '/chats',
  '/explore',
  '/orders',
  '/more',
  '/catalog',
  '/selection',
  '/saved',
  '/network',
  '/settings',
  '/settings/paths',
  '/samples',
  '/returns',
  '/broadcast',
  '/team',
];

/**
 * Naive surface walk: open main homes without doing a known happy path.
 * Fails if a danger toast/alert appears just from visiting (Class A/B noise).
 */
test.describe('phase1 chaos noise @functional @chaos', () => {
  test('Meena can open core surfaces without stray alerts', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginAsMeena(page);
    const noise = await wander(page, BUYER_PATHS);

    expect(noise, JSON.stringify(noise, null, 2)).toEqual([]);
    const hard = consoleErrors.filter(
      (line) =>
        !line.includes('VITE_PUBLIC_ORIGIN') &&
        !line.includes('Download the React DevTools') &&
        !/favicon/i.test(line),
    );
    expect(hard, hard.join('\n')).toEqual([]);
  });

  test('Ravi can open core surfaces without stray alerts', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginAsRavi(page);
    const noise = await wander(page, SELLER_PATHS);

    expect(noise, JSON.stringify(noise, null, 2)).toEqual([]);
    const hard = consoleErrors.filter(
      (line) =>
        !line.includes('VITE_PUBLIC_ORIGIN') &&
        !line.includes('Download the React DevTools') &&
        !/favicon/i.test(line),
    );
    expect(hard, hard.join('\n')).toEqual([]);
  });

  test('Kavita can open Explore and Orders without stray alerts', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await loginAsKavita(page);
    const noise = await wander(page, ['/', '/explore', '/orders', '/more', '/catalog']);
    expect(noise, JSON.stringify(noise, null, 2)).toEqual([]);
    expect(consoleErrors.filter((line) => !line.includes('VITE_PUBLIC_ORIGIN'))).toEqual([]);
  });
});
