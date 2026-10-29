import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('Direct links @functional @orders', () => {
  test('legacy Your paths redirects; patch is locked; open tickets stay', async ({ page }) => {
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, raviToken);

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 12 }],
    });

    await loginAsRavi(page);
    const raviToken2 = await accessTokenFromPage(page);
    const auth2 = { authorization: `Bearer ${raviToken2}` };

    const openBefore = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth2,
    });
    expect(((await openBefore.json()) as { tradeMode: string }).tradeMode).toBe('manage');

    const lanesRes = await page.request.get(`${API_URL}/trade-lanes`, { headers: auth2 });
    expect(lanesRes.ok()).toBeTruthy();
    const lanes = (await lanesRes.json()) as Array<{ id: string }>;
    if (lanes[0]) {
      const patch = await page.request.patch(`${API_URL}/trade-lanes/${lanes[0].id}`, {
        headers: auth2,
        data: { ticket: 'me', reveal: false },
      });
      expect(patch.ok()).toBeFalsy();
    }

    const stillOpen = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth2,
    });
    const still = (await stillOpen.json()) as { tradeMode: string; status: string };
    expect(still.tradeMode).toBe('manage');
    expect(still.status).not.toBe('cancelled');

    await page.goto('/settings/paths');
    await expect(page).toHaveURL(/\/network\/direct-links/);
    await expect(page.getByTestId('direct-links-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Direct links' })).toBeVisible();

    await page.getByTestId('paths-new').click();
    await expect(page.getByRole('heading', { name: 'New Direct link' })).toBeVisible();
    const autoRepost = page.getByTestId('paths-create-auto-repost');
    await expect(autoRepost).toContainText('New supplier posts go to this buyer');
    await expect(autoRepost).toContainText('On');

    await page.goto('/settings/your-paths');
    await expect(page).toHaveURL(/\/network\/direct-links/);

    await page.goto('/settings');
    await expect(page.getByRole('link', { name: /Your paths/i })).toHaveCount(0);

    await page.goto('/settings/profile');
    await expect(page.getByRole('heading', { name: /Business profile/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('When buyers order from what I share')).toHaveCount(0);
  });
});
