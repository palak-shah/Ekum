import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('seller collection publish @functional @collections', () => {
  test('same-for-all is optional and member sheet can add photos', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    const sameForAll = page.getByTestId('collection-same-for-all');
    await expect(sameForAll).toBeVisible();
    await expect(sameForAll.getByText(/Optional/i)).toBeVisible();

    await sameForAll.click();
    const sameSheet = page.getByRole('dialog').filter({ hasText: 'Same for all designs' });
    await expect(sameSheet.getByRole('heading', { name: 'Same for all designs' })).toBeVisible();
    await sameSheet.getByPlaceholder('1200 or 1200-1400').fill('1200-1400');
    await sameSheet.getByRole('button', { name: 'Done' }).click();
    await expect(sameForAll.getByText(/1200-1400/)).toBeVisible();

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

    await page
      .getByTestId('collection-member-tile')
      .or(page.locator('[aria-label^="Edit design"]'))
      .first()
      .click();
    const memberSheet = page.getByRole('dialog').filter({ hasText: 'Update this design' });
    await expect(memberSheet.getByRole('heading', { name: 'Update this design' })).toBeVisible();
    await expect(memberSheet.getByTestId('collection-member-add-photos')).toBeVisible();
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
