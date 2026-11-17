import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('profile visibility settings @functional @settings', () => {
  test('Settings Privacy shows Profile visibility; Public/Private persist', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await page.goto('/settings');
    await expect(page.getByTestId('settings-domain-privacy')).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('settings-profile-visibility').click();
    await expect(page).toHaveURL(/\/settings\/profile-visibility/);
    await expect(page.getByTestId('profile-visibility-page')).toBeVisible();
    await expect(page.getByTestId('profile-visibility-public')).toBeVisible();
    await expect(page.getByTestId('profile-visibility-private')).toBeVisible();

    const publicBtn = page.getByTestId('profile-visibility-public');
    const privateBtn = page.getByTestId('profile-visibility-private');
    if ((await publicBtn.getAttribute('aria-checked')) === 'true') {
      await privateBtn.click();
      await expect(privateBtn).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
      await publicBtn.click();
      await expect(publicBtn).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
    } else {
      await publicBtn.click();
      await expect(publicBtn).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
      await privateBtn.click();
      await expect(privateBtn).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
      await publicBtn.click();
      await expect(publicBtn).toHaveAttribute('aria-checked', 'true', { timeout: 10_000 });
    }
  });
});
