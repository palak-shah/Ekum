import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('You library tabs @functional @collections', () => {
  test('Collections · Catalogs · Designs; Designs + opens Add designs; Deleted not Restore', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);
    await page.goto('/more');
    await expect(page.getByTestId('you-tab-collections')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('you-tab-catalogs')).toBeVisible();
    await expect(page.getByTestId('you-tab-designs')).toBeVisible();
    await expect(page.getByTestId('you-library-add-designs')).toHaveCount(0);
    await page.getByTestId('you-tab-designs').click();
    await expect(page.getByTestId('you-library-add-designs')).toBeVisible();
    await page.getByTestId('you-library-add-designs').click();
    await expect(page.getByRole('heading', { name: 'Add designs' })).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('you-tab-designs')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('you-tab-collections').click();
    await expect(page.getByTestId('you-library-add-designs')).toHaveCount(0);
    await expect(page.getByTestId('you-collection-general-badge').first()).toBeVisible();
    await expect(page.getByTestId('you-new-collection')).toBeVisible();
    await page.getByTestId('you-new-collection').click();
    await expect(page.getByRole('heading', { name: 'New collection' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('catalog-exclusive-note')).toHaveCount(0);
    await expect(page.getByTestId('collection-order-mode')).toHaveCount(0);
    await page.goBack();
    await expect(page.getByTestId('you-tab-catalogs')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('you-tab-catalogs').click();
    await expect(page.getByTestId('you-new-catalog')).toBeVisible();
    await page.getByTestId('you-new-catalog').click();
    await expect(page.getByRole('heading', { name: 'New catalog' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('catalog-exclusive-note')).toBeVisible();
    await expect(page.getByTestId('collection-order-mode')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('you-tab-collections')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('you-tab-collections').click();
    await page.getByTestId('you-library-page-more').click();
    await expect(page.getByTestId('you-library-page-archived')).toHaveText(/Deleted/);
    await expect(page.getByText('Restore')).toHaveCount(0);
  });
});
