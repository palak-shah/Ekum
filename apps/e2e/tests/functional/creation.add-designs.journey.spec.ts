import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';
import { SAMPLE_JPG, sampleJpgTimes } from '../../helpers/fixtures';

test.describe('add designs creation @functional @media @creation @catalog', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: false,
    hasTouch: false,
    // Override Pixel 7 UA from playwright.config so isPhoneLike() uses gallery path.
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  test('upload one photo, save draft, open from My designs', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsRavi(page);
    await page.goto('/catalog/products/new');

    await expect(page.getByRole('heading', { name: 'Add designs' })).toBeVisible();

    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await expect(fileInput).toHaveCount(1);
    await fileInput.setInputFiles(SAMPLE_JPG);
    await expect(page.getByText('1 design', { exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').first()).toBeVisible({
      timeout: 30_000,
    });

    // Wait until upload finishes (blob may become /media URL).
    await expect(page.getByRole('button', { name: /Save 1 design in Draft/ })).toBeEnabled({
      timeout: 45_000,
    });

    const sku = await page.getByLabel('SKU').first().inputValue();
    expect(sku).toMatch(/^EK-[0-9A-F]{8}$/);

    await page.getByRole('button', { name: /Save 1 design in Draft/ }).click();
    await expect(page.getByText('Designs saved').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/catalog/, { timeout: 20_000 });

    await page.getByRole('button', { name: 'Draft', exact: true }).click();

    const tile = page.getByTestId('catalog-product-tile').filter({ hasText: sku });
    await expect(tile).toBeVisible({ timeout: 20_000 });
    await tile.click();

    await expect(page).toHaveURL(/\/catalog\/products\//, { timeout: 15_000 });
    await expect(page.getByLabel(/Reference \/ SKU|SKU/i)).toHaveValue(sku);
    await expect(
      page.locator('img[src*="/media"], img[src*="http"], img[src^="blob:"]').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('upload three photos creates three designs then save drafts', async ({ page }) => {
    test.setTimeout(180_000);
    await loginAsRavi(page);
    await page.goto('/catalog/products/new');

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(sampleJpgTimes(3));
    await expect(page.getByText('3 designs', { exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]')).toHaveCount(3, {
      timeout: 60_000,
    });
    await expect(page.getByLabel('SKU')).toHaveCount(3);

    await expect(page.getByRole('button', { name: /Save 3 designs in Draft/ })).toBeEnabled({
      timeout: 60_000,
    });
    const firstSku = await page.getByLabel('SKU').first().inputValue();

    await page.getByRole('button', { name: /Save 3 designs in Draft/ }).click();
    await expect(page.getByText('Designs saved').first()).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/catalog/);

    await page.getByRole('button', { name: 'Draft', exact: true }).click();
    await expect(
      page.getByTestId('catalog-product-tile').filter({ hasText: firstSku }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('publish path posts design to published filter', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAsRavi(page);
    await page.goto('/catalog/products/new');

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(SAMPLE_JPG);
    await expect(page.getByRole('button', { name: /Save 1 design in Draft/ })).toBeEnabled({
      timeout: 45_000,
    });
    const sku = await page.getByLabel('SKU').first().inputValue();

    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByRole('heading', { name: 'Publish designs' })).toBeVisible({
      timeout: 10_000,
    });
    // Ravi already sells — consent may be hidden.
    await sheet.getByRole('button', { name: /Publish 1/ }).click();

    await expect(page.getByText('Published').first()).toBeVisible({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/catalog/);

    await page.getByRole('button', { name: 'Published', exact: true }).click();
    await expect(
      page.getByTestId('catalog-product-tile').filter({ hasText: sku }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
