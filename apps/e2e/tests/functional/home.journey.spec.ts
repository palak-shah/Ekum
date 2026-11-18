import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('home journey @functional @home', () => {
  test('Home shows own Business Profile with shell chrome', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('business-profile-home')).toBeVisible();
    await expect(page.getByTestId('business-profile-name')).toBeVisible();
    await expect(page.getByTestId('business-profile-avatar-camera')).toBeVisible();
    await expect(page.getByTestId('business-profile-view-showcase')).toBeVisible();
    await expect(page.getByTestId('business-profile-showcase')).toHaveCount(0);
    await expect(page.getByTestId('business-profile-showcase-0')).toHaveCount(0);
    await expect(page.getByTestId('company-edit')).toBeVisible();
    await expect(page.getByTestId('business-profile-share')).toBeVisible();
    await expect(page.getByTestId('business-profile-network')).toBeVisible();
    await expect(page.getByTestId('business-profile-saved')).toBeVisible();
    await expect(page.getByTestId('company-follow')).toHaveCount(0);
    await expect(page.getByTestId('app-bottom-nav')).toBeVisible();
    await expect(page.getByTestId('home-account')).toBeVisible();
    await expect(page.getByTestId('home-need-order-confirm_order')).toHaveCount(0);
    await expect(page.getByTestId('business-info-team')).toBeVisible();
    await expect(page.getByTestId('business-profile-view-more')).toBeVisible();
    await expect(page.getByTestId('business-profile-view-more')).toHaveText(
      'See all collections >',
    );
    await page.getByTestId('business-profile-view-more').click();
    await expect(page).toHaveURL(/\/more\?tab=collections/);
    await page.goto('/');

    await page.getByTestId('business-profile-view-showcase').click();
    await expect(page.getByTestId('showcase-browse-sheet')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('showcase-add')).toBeVisible();
    await page.getByTestId('sheet-close').click();

    await page.getByTestId('company-edit').click();
    await expect(page).toHaveURL(/\/settings\/profile\?edit=1/);
    await expect(page.getByTestId('profile-update')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('profile-photo-hint')).toBeVisible();
    await expect(page.getByRole('link', { name: /Business profile/i })).toBeVisible();
  });

  test('own /company/:id redirects to Home profile', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/company/seed-company-ravi');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('business-profile-home')).toBeVisible({ timeout: 15_000 });
  });
});
