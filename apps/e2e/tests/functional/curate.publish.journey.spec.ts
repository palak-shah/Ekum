import { test, expect } from '@playwright/test';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

test.describe('trader curate publish @functional @trader @collections', () => {
  test('curate supplier designs and publish for buyers on Explore', async ({ page }) => {
    const packName = `Trader pack ${Date.now()}`;

    await loginAsKavita(page);
    await page.goto('/collections/seed-col-1');

    await page.getByTestId('collection-select').click();
    await page.getByRole('button', { name: 'Select all' }).first().click();
    await expect(page.getByText(/\d+ selected/)).toBeVisible();

    await page.getByRole('button', { name: 'Curate', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Curate pack' })).toBeVisible();

    await page.getByLabel('Name').fill(packName);
    await page.getByRole('button', { name: 'Publish…' }).click();

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
