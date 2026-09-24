import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('seller collection publish @functional @collections', () => {
  test('add-and-go chrome; sticky dock; no bottom nav', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await expect(page.getByTestId('collection-create-dock')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chats' })).toHaveCount(0);
    await expect(page.getByLabel('Name')).toHaveAttribute('placeholder', 'Name this pack');
    await expect(page.getByLabel('Description')).toBeVisible();
    await expect(page.getByTestId('tags-field-open')).toBeVisible();
    const sameForAll = page.getByTestId('collection-same-for-all');
    await expect(sameForAll).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Same for new photos' })).toHaveCount(0);
    await expect(page.getByTestId('collection-who')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create & Publish' })).toHaveCount(0);

    await page.getByTestId('collection-same-for-all-toggle').click();
    await expect(sameForAll.getByTestId('tags-field-open')).toHaveCount(0);
    const unit = sameForAll.getByLabel('Unit');
    if ((await unit.inputValue()) !== 'set') {
      await expect(sameForAll.getByLabel('Pieces in one set')).toHaveCount(0);
      await unit.selectOption('set');
    }
    await expect(sameForAll.getByLabel('Pieces in one set')).toBeVisible();
    await sameForAll.getByTestId('collection-same-for-all-done').click();

    await page.getByTestId('collection-add-designs').click();
    const fromCamera = page.getByTestId('continuous-camera-designs');
    const fromMenu = page.getByTestId('collection-source-designs');
    await expect(fromCamera.or(fromMenu)).toBeVisible({ timeout: 8_000 });
    if (await fromCamera.isVisible()) {
      await fromCamera.click();
    } else {
      await fromMenu.click();
    }
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect(page.getByTestId('collection-add-designs')).toHaveText(/Add designs/i);

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
    const fromCamera = page.getByTestId('continuous-camera-designs');
    const fromMenu = page.getByTestId('collection-source-designs');
    await expect(fromCamera.or(fromMenu)).toBeVisible({ timeout: 8_000 });
    if (await fromCamera.isVisible()) {
      await fromCamera.click();
    } else {
      await fromMenu.click();
    }
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    await page.getByLabel('Name').fill(collectionName);
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
