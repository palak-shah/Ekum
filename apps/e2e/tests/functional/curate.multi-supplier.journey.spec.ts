import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena } from '../../helpers/persona';
import { publishRepostNew } from '../../helpers/repost';

/**
 * C1 — Curate designs from two suppliers into one pack.
 * Trader: Meena. Suppliers: Ravi (seed-col-1) + Kavita (seed-col-fabric).
 */
test.describe('multi-supplier curate @functional @trader @collections', () => {
  test('curate designs from A + B and publish one pack', async ({ page }) => {
    const packName = `A+B pack ${Date.now()}`;

    await loginAsMeena(page);

    // Supplier A — Surat Silk House
    await page.goto('/collections/seed-col-1');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('button').filter({ has: page.locator('img') }).first().click({
      button: 'right',
    });
    await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });

    // Supplier B — Ahmedabad Loom Co (keep prior selection)
    await page.goto('/collections/seed-col-fabric');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('button').filter({ has: page.locator('img') }).first().click({
      button: 'right',
    });
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId('selection-workspace-cart').click();
    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('selection-list')).toContainText(/Surat Silk House/i);
    await expect(page.getByTestId('selection-list')).toContainText(/Ahmedabad Loom Co/i);

    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Repost' })).toBeVisible({
      timeout: 15_000,
    });
    const collectionId = await publishRepostNew(page, packName);

    const token = await accessTokenFromPage(page);
    const detail = await page.request.get(`${API_URL}/collections/${collectionId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(detail.ok()).toBeTruthy();
    const body = (await detail.json()) as {
      products: Array<{ companyId: string; companyName?: string | null }>;
    };
    const owners = new Set(body.products.map((p) => p.companyId));
    expect(owners.has('seed-company-ravi')).toBe(true);
    expect(owners.has('seed-company-kavita')).toBe(true);
    expect(owners.size).toBeGreaterThanOrEqual(2);

    await page.goto(`/collections/${collectionId}`);
    await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 15_000 });
    const source = page.getByTestId('collection-owner-source');
    await expect(source).toBeVisible();
    await expect(source).toContainText(/Surat Silk House/i);
    await expect(source).toContainText(/Ahmedabad Loom Co/i);
  });
});
