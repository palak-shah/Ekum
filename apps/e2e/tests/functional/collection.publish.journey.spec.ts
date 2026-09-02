import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('seller collection publish @functional @collections', () => {
  test('seller creates collection from designs and publishes for buyers', async ({ page }) => {
    const collectionName = `Seller drop ${Date.now()}`;

    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await page.getByTestId('collection-add-designs').click();
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    await page.getByLabel('Name').fill(collectionName);
    await page.getByRole('button', { name: 'Create & Publish' }).click();

    const publishSheet = page.getByRole('dialog');
    await expect(publishSheet.getByRole('heading', { name: 'Create & Publish' })).toBeVisible({
      timeout: 15_000,
    });
    await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
    await publishSheet.getByRole('button', { name: 'Create & Publish', exact: true }).click();

    await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/catalog/, { timeout: 15_000 });

    const catalogLink = page.getByRole('link', { name: new RegExp(collectionName) }).first();
    await expect(catalogLink).toBeVisible({ timeout: 15_000 });
    const href = await catalogLink.getAttribute('href');
    expect(href).toMatch(/\/collections\//);

    await loginAsMeena(page);
    await page.goto(href!);
    await expect(page.getByRole('heading', { name: collectionName })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Surat Silk House/i).first()).toBeVisible();
  });
});
