import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('add designs batch @functional @catalog', () => {
  test('SKU thumbs, one vs many details, no filename names', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog/products/new');

    await expect(page.getByRole('heading', { name: 'Add designs' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Add designs — one photo per design' }),
    ).toBeVisible();
    await expect(page.getByText('One photo per design')).toBeVisible();
    await expect(
      page.getByText('Each photo becomes its own design — not more shots of the same one.'),
    ).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles(fixture);
    await expect(page.locator('img[src^="blob:"]').first()).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText('1 design', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Tap a design to edit details or add more photos.'),
    ).toBeVisible();
    await expect(page.getByText('This design')).toBeVisible();
    await expect(page.getByText('Same for all designs')).toHaveCount(0);

    const sku = page.getByLabel('SKU').first();
    await expect(sku).toHaveValue(/^EK-[0-9A-F]{8}$/);
    await expect(sku).not.toHaveValue(/sample/i);

    await page.locator('input[type="file"]').setInputFiles(fixture);
    await expect(page.getByText('2 designs', { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Same for all designs')).toBeVisible();
    await expect(page.getByLabel('SKU')).toHaveCount(2);

    await page.locator('img[src^="blob:"]').first().click();
    await expect(page.getByRole('heading', { name: 'Update this design' })).toBeVisible();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText('Category')).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Use same as all designs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Details for this design' })).toHaveCount(0);
  });
});
