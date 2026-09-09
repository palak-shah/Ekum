import { test, expect } from '@playwright/test';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

test.describe('trader curate publish @functional @trader @collections', () => {
  test('curate supplier designs and publish for buyers on Explore', async ({ page }) => {
    const packName = `Trader pack ${Date.now()}`;

    await loginAsKavita(page);
    await page.goto('/collections/seed-col-1');
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });

    // Enter select via long-press (⋯ no longer has a Select pill / collection-select).
    const designTile = page.locator('button').filter({ has: page.locator('img') }).first();
    await designTile.click({ button: 'right' });
    await page.getByTestId('select-all-float-select-all').click();
    await expect(page.getByTestId('select-all-float')).toContainText(/\d+ selected/);

    await page.getByTestId('selection-workspace-bar').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 15_000,
    });
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
    await publishSheet.getByRole('button', { name: 'Publish', exact: true }).click();

    await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });

    const collectionId = page.url().match(/\/collections\/([^/?]+)/)?.[1];
    expect(collectionId).toBeTruthy();

    await loginAsMeena(page);
    await page.goto(`/collections/${collectionId}`);
    await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Ahmedabad Loom Co/i).first()).toBeVisible();
    await expect(page.getByText(/\d+ designs?/i).first()).toBeVisible();
  });
});
