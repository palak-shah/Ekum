import { test, expect } from '@playwright/test';
import { PHONES } from '../../helpers/persona';
import { WEB_URL } from '../../helpers/env';

test.describe('auth OTP @functional @auth', () => {
  test('phone OTP UI lands on Home after verify', async ({ page }) => {
    await page.goto(WEB_URL);
    await page.evaluate(() => localStorage.removeItem('ekum.tokens'));
    await page.goto('/login');

    await expect(page.getByLabel('Mobile number')).toBeVisible();
    await page.getByLabel('Mobile number').fill(PHONES.meena);
    await page.getByRole('button', { name: 'Continue' }).click();

    const devHint = page.getByText(/Dev code:/);
    await expect(devHint).toBeVisible({ timeout: 15_000 });
    const devCode = (await devHint.textContent())?.match(/\d{6}/)?.[0];
    expect(devCode).toBeTruthy();

    await page.getByLabel('One-time code').fill(devCode!);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 20_000 });
    await expect(page.getByRole('link', { name: /Home/i })).toBeVisible({ timeout: 10_000 });
  });
});
