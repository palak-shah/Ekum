import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';
import { SAMPLE_JPG, sampleJpgTimes } from '../../helpers/fixtures';

async function openDraftCollectionByName(page: import('@playwright/test').Page, name: string) {
  await expect(page).toHaveURL(/\/catalog/, { timeout: 20_000 });
  await page.getByRole('button', { name: 'Draft', exact: true }).click();
  const tile = page.getByRole('button').filter({ hasText: name }).first();
  await expect(tile).toBeVisible({ timeout: 20_000 });
  await tile.click();
  await expect(page).toHaveURL(/\/collections\//, { timeout: 20_000 });
}

test.describe('collection creation @functional @media @creation @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('A photos only — save draft and reopen', async ({ page }) => {
    test.setTimeout(180_000);
    const name = `Photo pack ${Date.now()}`;
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await expect(page.getByText(/First item is the cover/i)).toBeVisible();
    // Direct file input — ContinuousCamera would open on phone viewport.
    await page.locator('input[type="file"]').setInputFiles(sampleJpgTimes(3));
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]')).toHaveCount(3, {
      timeout: 60_000,
    });
    await expect(page.getByText('Cover').first()).toBeVisible();

    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save Collection in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 60_000 });

    await openDraftCollectionByName(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('img').first()).toBeVisible();
  });

  test('B designs only — save draft and reopen', async ({ page }) => {
    test.setTimeout(120_000);
    const name = `Design pack ${Date.now()}`;
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

    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save Collection in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 45_000 });

    await openDraftCollectionByName(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 });
  });

  test('C photos + designs — save draft and reopen', async ({ page }) => {
    test.setTimeout(180_000);
    const name = `Mixed pack ${Date.now()}`;
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');

    await page.locator('input[type="file"]').setInputFiles(SAMPLE_JPG);
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText('Cover').first()).toBeVisible();

    await page.getByTestId('collection-add-designs').click();
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Photo + at least one library thumb.
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]')).toHaveCount(2, {
      timeout: 30_000,
    });

    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Save Collection in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 60_000 });

    await openDraftCollectionByName(page, name);
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 });
  });

  test('Create & Publish from designs', async ({ page }) => {
    test.setTimeout(120_000);
    const name = `Live pack ${Date.now()}`;
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

    await page.getByLabel('Name').fill(name);
    await page.getByRole('button', { name: 'Create & Publish' }).click();

    const publishSheet = page.getByRole('dialog');
    await expect(publishSheet.getByRole('heading', { name: 'Create & Publish' })).toBeVisible({
      timeout: 15_000,
    });
    await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
    await publishSheet.getByRole('button', { name: 'Create & Publish', exact: true }).click();

    await expect(page.getByText('Published').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/catalog/);
    await page.getByRole('button', { name: 'Published', exact: true }).click();
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  });
});
