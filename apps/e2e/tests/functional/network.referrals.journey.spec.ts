import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { createOpenReferral } from '../../helpers/referrals';
import { PHONES, loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('network hub @functional @network', () => {
  test('connections list loads from You → Network', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/more');
    await page.getByRole('link', { name: 'Network' }).click();

    await expect(page.getByRole('heading', { name: 'Network' })).toBeVisible();
    await page.getByRole('link', { name: 'Connections' }).click();
    await expect(page.getByText(/Surat Silk House/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('referrals invite @functional @referrals', () => {
  test('open invite link → login → request access', async ({ page }) => {
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const referral = await createOpenReferral(
      page.request,
      raviToken,
      `E2E invite ${Date.now()}`,
    );

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('ekum.tokens'));
    await page.goto(`/r/${referral.token}`);

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await expect(page.getByText(/invited/i).first()).toBeVisible();

    await page.getByLabel('Mobile number').fill(PHONES.kavita);
    await page.getByRole('button', { name: 'Continue' }).click();
    const devHint = page.getByText(/Dev code:/);
    await expect(devHint).toBeVisible({ timeout: 15_000 });
    const devCode = (await devHint.textContent())?.match(/\d{6}/)?.[0];
    expect(devCode).toBeTruthy();
    await page.getByLabel('One-time code').fill(devCode!);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(new RegExp(`/r/${referral.token}`), { timeout: 20_000 });
    await expect(page.getByText(/Surat Silk House/i).first()).toBeVisible();

    const requestBtn = page.getByRole('button', { name: /Request access to Surat Silk House/i });
    if (await requestBtn.isVisible()) {
      await requestBtn.click();
      await expect(page.getByText(/Request sent/i).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('seller creates invite from compose and sees share link', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/referrals/new');

    await page.getByRole('button', { name: 'Create link' }).click();
    await expect(page.locator('input[readonly]').first()).toHaveValue(/\/r\//, {
      timeout: 15_000,
    });
  });
});
