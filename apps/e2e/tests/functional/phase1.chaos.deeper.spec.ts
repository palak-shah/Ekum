import { test, expect, type Page } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { createShareLink } from '../../helpers/share-link';
import { loginAsAmit, loginAsMeena, loginAsRavi } from '../../helpers/persona';

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

async function assertNoNoise(page: Page, where: string) {
  const noise = await collectVisibleNoise(page);
  expect(noise, `${where}: ${JSON.stringify(noise)}`).toEqual([]);
  await expect(page.getByText(/Unexpected Application Error/i)).toHaveCount(0);
}

test.describe('phase1 deeper chaos @functional @chaos', () => {
  test('Meena abandons sheets and select mode without stray errors', async ({ page }) => {
    await loginAsMeena(page);

    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('explore-filter').click();
    await expect(page.getByTestId('explore-filter-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('explore-filter-menu')).toHaveCount(0);
    await assertNoNoise(page, 'explore after Escape filter');

    await page.goto('/chats');
    await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'New chat' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // Backdrop + header both say Close — header X is the square control.
    await dialog.locator('button[aria-label="Close"]').nth(1).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await assertNoNoise(page, 'chats after abandon new chat');

    await page.goto('/collections/seed-col-1');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    const designTile = page.locator('button, a').filter({ has: page.locator('img') }).first();
    await designTile.click({ button: 'right' });
    await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('select-all-float-select-all').click();
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await page.waitForTimeout(500);
    await assertNoNoise(page, 'after Back mid-select');

    await page.goto('/collections/seed-col-1');
    await designTile.click({ button: 'right' });
    await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('select-all-float-clear').click();
    await expect(page.getByTestId('select-all-float')).toHaveCount(0);
    await assertNoNoise(page, 'after Clear select');
  });

  test('Meena selection chrome does not clip last design (BM-07)', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/collections/seed-col-1');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    const designTile = page.locator('button, a').filter({ has: page.locator('img') }).first();
    await designTile.click({ button: 'right' });
    await page.getByTestId('select-all-float-select-all').click();
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible();

    // AppShell scrolls in <main>, not window.
    await page.locator('main').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(400);
    const lastTile = page
      .locator('[class*="grid"]')
      .locator('button')
      .filter({ has: page.locator('img') })
      .last();
    await expect(lastTile).toBeVisible();
    const box = await lastTile.boundingBox();
    const chromeBox = await page.getByTestId('selection-workspace-bar').boundingBox();
    expect(box, 'last design box').toBeTruthy();
    expect(chromeBox, 'selection chrome box').toBeTruthy();
    // Last tile bottom must not sit under the floater (allow 4px subpixel).
    expect(box!.y + box!.height).toBeLessThanOrEqual(chromeBox!.y + 4);
  });

  test('Ravi opens Orders filter/new and Catalog without stray errors', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/orders');
    await expect(page.getByTestId('orders-filter')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('orders-filter').click();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await assertNoNoise(page, 'orders after filter Escape');

    await page.getByRole('button', { name: 'New order' }).click();
    await expect(page).toHaveURL(/\/orders\/new/);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/orders/);
    await assertNoNoise(page, 'orders after abandon new');

    await page.goto('/catalog');
    await expect(page.getByRole('button', { name: 'Designs' })).toBeVisible({ timeout: 15_000 });
    await assertNoNoise(page, 'catalog open');

    await page.goto('/more');
    await expect(page.getByRole('heading', { name: 'You' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /Your paths/i }).click();
    await expect(page.getByTestId('your-paths-page')).toBeVisible({ timeout: 15_000 });
    await assertNoNoise(page, 'your paths');

    await page.goto('/samples');
    await assertNoNoise(page, 'samples');
    await page.goto('/returns');
    await assertNoNoise(page, 'returns');
  });

  test('staff Amit walks core surfaces without stray alerts', async ({ page }) => {
    await loginAsAmit(page);
    for (const path of ['/', '/chats', '/explore', '/orders', '/more', '/catalog']) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(600);
      await assertNoNoise(page, `amit ${path}`);
    }
  });

  test('guest share landing has no crash toast before login', async ({ page }) => {
    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const link = await createShareLink(page.request, token, { collectionId: 'seed-col-1' });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('ekum.tokens'));
    await page.goto(`/s/${link.token}`);
    await expect(page.getByText(/Wedding Edit|48 hours/i).first()).toBeVisible({ timeout: 15_000 });
    await assertNoNoise(page, 'guest share landing');
    await expect(page.getByRole('button', { name: /Open on Ekum|Request access/ })).toBeVisible();
  });
});
