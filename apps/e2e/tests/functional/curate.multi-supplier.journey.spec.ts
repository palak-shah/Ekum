import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena } from '../../helpers/persona';

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
    await expect(page.getByTestId('selection-workspace-bar')).toContainText(/2 selected/i, {
      timeout: 10_000,
    });

    await page.getByTestId('selection-workspace-bar').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('selection-list')).toContainText(/Surat Silk House/i);
    await expect(page.getByTestId('selection-list')).toContainText(/Ahmedabad Loom Co/i);

    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Curate pack' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByLabel('Name').fill(packName);
    await page.getByRole('button', { name: 'Publish to Collection' }).click();

    await expect(page).toHaveURL(/\/catalog\/collections\//, { timeout: 20_000 });
    const publishSheet = page.getByRole('dialog');
    await expect(publishSheet.getByRole('heading', { name: 'Publish collection' })).toBeVisible({
      timeout: 15_000,
    });
    await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
    const consent = publishSheet.getByText(/Start selling/i);
    if (await consent.isVisible()) {
      await publishSheet.locator('input[type="checkbox"]').last().check();
    }
    await publishSheet.getByRole('button', { name: 'Publish', exact: true }).click();
    await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });

    const collectionId = page.url().match(/\/collections\/([^/?]+)/)?.[1];
    expect(collectionId).toBeTruthy();

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
    await expect(page.getByText(/From Surat Silk House/i).first()).toBeVisible();
    await expect(page.getByText(/From Ahmedabad Loom Co/i).first()).toBeVisible();
  });
});
