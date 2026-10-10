import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('seller collection publish @functional @collections', () => {
  test('add-and-go chrome; sticky dock; no bottom nav', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await expect(page.getByTestId('collection-create-dock')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chats' })).toHaveCount(0);
    await expect(page.getByLabel('Collection name')).toHaveAttribute(
      'placeholder',
      'Name this collection',
    );
    await expect(page.getByTestId('collection-rate-mode-single')).toBeVisible();
    await expect(page.getByTestId('collection-rate-mode-range')).toBeVisible();
    await expect(page.getByTestId('collection-rate-caption')).toHaveCount(0);
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByTestId('collection-tag-item')).toBeVisible();
    await expect(page.getByTestId('collection-apply-all')).toBeVisible();
    await expect(page.getByTestId('collection-order-dispatch')).toBeVisible();
    await expect(page.getByTestId('collection-order-dispatch-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(page.getByTestId('collection-set-contains')).toHaveCount(0);
    await page.getByTestId('collection-order-dispatch-toggle').click();
    await expect(page.getByTestId('collection-order-dispatch-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(page.getByRole('dialog', { name: 'Same for new photos' })).toHaveCount(0);
    await expect(page.getByTestId('collection-who')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create & Publish' })).toHaveCount(0);

    await expect(page.getByTestId('collection-set-contains')).toBeVisible();
    await expect(page.getByTestId('collection-order-preview')).toBeVisible();

    await page.getByTestId('collection-add-designs').click();
    await expect(page.getByPlaceholder('Search by name')).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByTestId('collection-add-designs')).toHaveText(/Add from existing designs/i);
    await expect(page.getByTestId('collection-add-photos')).toHaveText(/Add photos/i);

    await page
      .getByTestId('collection-member-tile')
      .or(page.locator('[aria-label^="Edit design"]'))
      .first()
      .click();
    const memberSheet = page.getByRole('dialog').filter({ hasText: 'Update this design' });
    await expect(memberSheet.getByRole('heading', { name: 'Update this design' })).toBeVisible();
    await expect(memberSheet.getByTestId('collection-member-add-photos')).toBeVisible();
    await expect(memberSheet.getByRole('button', { name: 'Use same as all designs' })).toBeVisible();
    await memberSheet.getByRole('button', { name: 'Done' }).click();
  });

  test('seller creates collection from designs and publishes for buyers', async ({ page }) => {
    const collectionName = `Seller drop ${Date.now()}`;

    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await page.getByTestId('collection-add-designs').click();
    await expect(page.getByPlaceholder('Search by name')).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    await page.getByLabel('Collection name').fill(collectionName);
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Create & Publish' }).click();

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
