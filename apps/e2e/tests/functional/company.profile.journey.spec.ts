import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('company profile shop chrome @functional @network', () => {
  test('1:1 title opens shop with Message; catalogue Find reaches designs', async ({
    page,
  }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    await page.getByRole('link', { name: /Surat Silk House/ }).click();
    await expect(page).toHaveURL(/\/company\/seed-company-ravi/);
    await expect(page.getByTestId('company-follow')).toBeVisible();
    await expect(page.getByTestId('company-message')).toBeVisible();
    await expect(page.getByTestId('showcase-add')).toHaveCount(0);
    await expect(page.getByTestId('company-shop-tab-collections')).toBeVisible();
    await page.getByTestId('company-shop-tab-designs').click();
    await expect(page.getByTestId('company-shop-grid')).toBeVisible();
    await expect(page.getByTestId('business-profile-view-all')).toBeVisible();
    await expect(page.getByTestId('company-more')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await page.getByTestId('company-more').click();
    await expect(page.getByTestId('company-overflow-share')).toBeVisible();
    await page.keyboard.press('Escape');

    // Find lives on the full catalogue page, not the shop preview strip.
    await page.goto('/company/seed-company-ravi/catalogue?tab=products');
    await expect(page.getByTestId('business-profile-catalogue-page')).toBeVisible({
      timeout: 15_000,
    });
    const firstDesign = page.getByTestId(/company-shop-design-/).first();
    await expect(firstDesign).toBeVisible({ timeout: 15_000 });
    const designLabel = (await firstDesign.innerText()).trim().split('\n')[0] ?? '';
    expect(designLabel.length).toBeGreaterThan(0);
    const needle = designLabel.slice(0, Math.min(8, designLabel.length));
    await page.getByTestId('company-shop-search-toggle').click();
    await expect(page.getByTestId('company-shop-search')).toBeVisible();
    await page.getByTestId('company-shop-search').fill(needle);
    await expect(page.getByText(designLabel).first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('company-shop-search').fill('zzzz-no-match');
    await expect(page.getByText('No designs match.')).toBeVisible();
  });

  test('Select on catalogue shows Order dock and hides tab bar', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi/catalogue?tab=products');
    await expect(page.getByTestId('company-shop-grid')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('company-shop-select').click();
    await page.getByTestId(/company-shop-design-/).first().click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await expect(page.getByTestId('company-shop-order')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
  });

  test('Collections catalogue shows names and shop dock after Select', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi/catalogue?tab=collections');
    await expect(page.getByTestId(/^you-collection-row-/).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('company-shop-select').click();
    await page.getByTestId(/^you-collection-row-/).first().click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await page.getByTestId('select-all-float-clear').click();
    await page.getByTestId(/^you-collection-row-/).first().click();
    await expect(page).toHaveURL(/\/collections\//);
    await expect(page.getByTestId('select-all-float')).toHaveCount(0);
  });
});
