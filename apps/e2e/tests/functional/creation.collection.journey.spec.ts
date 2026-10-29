import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';
import { pickYouLibraryFilter } from '../../helpers/youLibrary';
import { SAMPLE_JPG, sampleJpgTimes } from '../../helpers/fixtures';
import { pickFieldSheetOption } from '../../helpers/fieldSheet';

async function stayOnEditorAfterDraftSave(
  page: import('@playwright/test').Page,
  name: string,
) {
  await expect(page).toHaveURL(/\/catalog\/collections\/(?!new)/, { timeout: 20_000 });
  await expect(page.getByLabel('Collection name')).toHaveValue(name);
}

async function reopenOwnDraftFromYou(page: import('@playwright/test').Page, name: string) {
  await page.goto('/catalog?tab=collections');
  await pickYouLibraryFilter(page, 'Draft');
  const tile = page.getByRole('link').filter({ hasText: name }).first();
  await expect(tile).toBeVisible({ timeout: 20_000 });
  await tile.click();
  await expect(page).toHaveURL(/\/catalog\/collections\//, { timeout: 20_000 });
  await expect(page.getByLabel('Collection name')).toHaveValue(name);
}

test.describe('collection creation @functional @release @media @creation @collections', () => {
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

    await expect(page.getByTestId('collection-add-designs')).toBeVisible();
    // Direct file input — ContinuousCamera would open on phone viewport.
    await page.locator('input[type="file"]').setInputFiles(sampleJpgTimes(3));
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]')).toHaveCount(3, {
      timeout: 60_000,
    });
    await expect(page.getByText('Cover')).toHaveCount(0);

    await page.getByLabel('Collection name').fill(name);
    await expect(page.getByTestId('collection-who')).toBeVisible();
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Save in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 60_000 });

    await stayOnEditorAfterDraftSave(page, name);
    await expect(page.locator('img').first()).toBeVisible();
    await reopenOwnDraftFromYou(page, name);
  });

  test('B designs only — save draft and reopen', async ({ page }) => {
    test.setTimeout(120_000);
    const name = `Design pack ${Date.now()}`;
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

    await page.getByLabel('Collection name').fill(name);
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Save in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 45_000 });

    await stayOnEditorAfterDraftSave(page, name);
    await reopenOwnDraftFromYou(page, name);
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
    await expect(page.getByText('Cover')).toHaveCount(0);

    const addDesigns = page.getByTestId('collection-add-designs');
    if (!(await addDesigns.isVisible())) {
      await page.getByTestId('collection-album-change').click();
    }
    await addDesigns.click();
    await expect(page.getByPlaceholder('Search by name')).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Photo + at least one library thumb (strip + grid can show extra copies).
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').nth(1)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByLabel('Collection name').fill(name);
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Save in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 60_000 });

    await stayOnEditorAfterDraftSave(page, name);
    await reopenOwnDraftFromYou(page, name);
  });

  test('Create & Publish from designs', async ({ page }) => {
    test.setTimeout(120_000);
    const name = `Live pack ${Date.now()}`;
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

    await page.getByLabel('Collection name').fill(name);
    await pickFieldSheetOption(page, 'collection-master-category', 0);
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Create & Publish' }).click();

    await expect(page.getByText('Published').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/more\?tab=collections/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/catalog\/collections\//);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Create & Publish catalog lands on Catalogs', async ({ page }) => {
    test.setTimeout(180_000);
    const name = `Live catalog ${Date.now()}`;
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new?kind=catalog');
    await expect(page.getByRole('heading', { name: 'New catalog' })).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('input[type="file"]').setInputFiles(SAMPLE_JPG);
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').first()).toBeVisible({
      timeout: 45_000,
    });
    await page.getByLabel('Catalog name').fill(name);
    await expect(page.getByTestId('collection-apply-all')).toHaveCount(0);
    await pickFieldSheetOption(page, 'collection-master-category', 0);
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Create & Publish' }).click();
    await expect(page.getByText('Published').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/more\?tab=catalogs/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/catalog\/collections\//);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 });
  });

  test('empty Save in Draft stays in the editor', async ({ page }) => {
    test.setTimeout(60_000);
    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Save in Draft' }).click();
    await expect(page.getByText('Collection saved').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/catalog\/collections\/(?!new)/);
    const name = `Stay ${Date.now()}`;
    await page.getByLabel('Collection name').fill(name);
    await expect(page.getByLabel('Collection name')).toHaveValue(name);
  });

  test('/collections/new opens create', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/collections/new');
    await expect(page).toHaveURL(/\/catalog\/collections\/new/);
    await expect(page.getByTestId('collection-add-designs')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("isn't available")).toHaveCount(0);
    await expect(page.getByTestId('collection-who')).toBeVisible();
  });
});
