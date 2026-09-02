import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { createShareLink } from '../../helpers/share-link';
import { PHONES, loginAsRavi } from '../../helpers/persona';

test.describe('share link guest @functional @catalog', () => {
  test('guest opens 48h link then logs in to view collection', async ({ page }) => {
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const link = await createShareLink(page.request, raviToken, {
      collectionId: 'seed-col-1',
    });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('ekum.tokens'));
    await page.goto(`/s/${link.token}`);

    await expect(page.getByText(/Wedding Edit|48 hours/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Open on Ekum|Request access/ }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await page.getByLabel('Mobile number').fill(PHONES.meena);
    await page.getByRole('button', { name: 'Continue' }).click();
    const devHint = page.getByText(/Dev code:/);
    await expect(devHint).toBeVisible({ timeout: 10_000 });
    const devCode = (await devHint.textContent())?.match(/\d{6}/)?.[0];
    expect(devCode).toBeTruthy();
    await page.getByLabel('One-time code').fill(devCode!);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/collections\/seed-col-1/, { timeout: 20_000 });
  });
});
