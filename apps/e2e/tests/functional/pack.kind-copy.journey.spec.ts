import { expect, test } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('collection vs catalog copy @functional @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('New collection says collection; New catalog says catalog', async ({ page }) => {
    await loginAsRavi(page);

    await page.goto('/catalog/collections/new');
    await expect(page.getByRole('heading', { name: 'New collection' })).toBeVisible();
    await expect(page.getByLabel('Collection name')).toBeVisible();
    await expect(page.getByLabel('Catalog name')).toHaveCount(0);
    await expect(page.getByText('Catalog name')).toHaveCount(0);

    await page.goto('/catalog/collections/new?kind=catalog');
    await expect(page.getByRole('heading', { name: 'New catalog' })).toBeVisible();
    await expect(page.getByLabel('Catalog name')).toBeVisible();
    await expect(page.getByLabel('Collection name')).toHaveCount(0);
    await expect(page.getByText('Collection name')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'New collection' })).toHaveCount(0);
  });
});
