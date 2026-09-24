import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('company profile shop chrome @functional @network', () => {
  test('1:1 title opens shop without Message; design cells show names', async ({
    page,
  }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    await page.getByRole('link', { name: /Surat Silk House/ }).click();
    await expect(page).toHaveURL(/\/company\/seed-company-ravi/);
    await expect(page.getByTestId('company-follow')).toBeVisible();
    await expect(page.getByTestId('company-message')).toHaveCount(0);
    await expect(page.getByTestId('company-shop-grid')).toBeVisible();
    await expect(page.getByText('Banarasi Silk Saree').first()).toBeVisible();
    await expect(page.getByTestId('company-shop-search')).toHaveCount(0);
    await page.getByTestId('company-shop-search-toggle').click();
    await expect(page.getByTestId('company-shop-search')).toBeVisible();
    await page.getByTestId('company-shop-search').fill('Banarasi');
    await expect(page.getByText('Banarasi Silk Saree').first()).toBeVisible();
    await page.getByTestId('company-shop-search').fill('zzzz-no-match');
    await expect(page.getByText('No designs match.')).toBeVisible();
    await page.getByTestId('company-shop-search').fill('');
    await expect(page.getByTestId('company-share')).toBeVisible();
  });

  test('Select on shop shows Order dock and hides tab bar', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi');
    await expect(page.getByTestId('company-shop-grid')).toBeVisible();
    await page.getByRole('button', { name: 'Select' }).click();
    await page.getByTestId(/company-shop-design-/).first().click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await expect(page.getByTestId('company-shop-order')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
  });

  test('Collections tab shows names and shop dock after Select', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi');
    await page.getByTestId('company-shop-tab-collections').click();
    await expect(page.getByTestId(/company-shop-collection-/).first()).toBeVisible();
    await expect(page.getByText(/designs?/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Select' }).click();
    await page.locator('[data-testid^="company-shop-collection-"]:not([data-testid*="-open-"])').first().click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await page.getByTestId(/company-shop-collection-open-/).first().click();
    await expect(page).toHaveURL(/\/collections\//);
    await expect(page.getByTestId('select-all-float')).toHaveCount(0);
  });
});
