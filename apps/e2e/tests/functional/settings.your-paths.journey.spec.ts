import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('Your paths @functional @orders', () => {
  test('Your paths patch is future-only; next place follows ticket', async ({ page }) => {
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, raviToken);

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const meenaAuth = { authorization: `Bearer ${meenaToken}` };
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 12 }],
    });

    await loginAsRavi(page);
    const raviToken2 = await accessTokenFromPage(page);
    const auth2 = { authorization: `Bearer ${raviToken2}` };

    const lanesRes = await page.request.get(`${API_URL}/trade-lanes`, { headers: auth2 });
    expect(lanesRes.ok()).toBeTruthy();
    const lanes = (await lanesRes.json()) as Array<{
      id: string;
      buyerCompanyId: string;
      sellerCompanyId: string;
      sellerName: string;
      buyerName: string;
      ticket: string;
    }>;
    const lane = lanes.find((row) => row.buyerCompanyId === 'seed-company-meena');
    expect(lane).toBeTruthy();

    const openBefore = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth2,
    });
    expect(((await openBefore.json()) as { tradeMode: string }).tradeMode).toBe('manage');

    const patch = await page.request.patch(`${API_URL}/trade-lanes/${lane!.id}`, {
      headers: auth2,
      data: { ticket: 'mill', reveal: false },
    });
    expect(patch.ok()).toBeTruthy();
    expect(((await patch.json()) as { ticket: string }).ticket).toBe('mill');

    const stillOpen = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth2,
    });
    const still = (await stillOpen.json()) as { tradeMode: string; status: string };
    expect(still.tradeMode).toBe('manage');
    expect(still.status).not.toBe('cancelled');

    const next = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 8 }],
    });
    const nextViewRes = await page.request.get(`${API_URL}/orders/${next.id}`, {
      headers: meenaAuth,
    });
    expect(nextViewRes.ok()).toBeTruthy();
    const nextView = (await nextViewRes.json()) as {
      tradeMode: string;
      sellerCompanyId: string;
      facilitatorCompanyId: string | null;
    };
    expect(nextView.tradeMode).toBe('direct');
    expect(nextView.sellerCompanyId).toBe(lane!.sellerCompanyId);
    expect(nextView.facilitatorCompanyId).toBe('seed-company-ravi');

    await resetTradeLanesToMe(page.request, raviToken2);

    await page.goto('/more');
    const tryAgain = page.getByRole('button', { name: 'Try again' });
    for (let i = 0; i < 3; i += 1) {
      if (await tryAgain.isVisible().catch(() => false)) {
        await tryAgain.click();
        await page.waitForTimeout(1_000);
      } else {
        break;
      }
    }
    if (await page.getByRole('heading', { name: 'You' }).isVisible().catch(() => false)) {
      await expect(page.getByRole('link', { name: /Your paths/i })).toBeVisible();
      await page.getByRole('link', { name: /Your paths/i }).click();
      await expect(page.getByTestId('your-paths-page')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId(`path-row-${lane!.id}`)).toBeVisible();
      await expect(page.getByTestId(`path-ticket-${lane!.id}-me`)).toBeVisible();
      await expect(page.getByTestId(`path-reveal-${lane!.id}`)).toBeVisible();
    }

    await page.goto('/settings/profile');
    await expect(page.getByRole('heading', { name: /Business profile/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('When buyers order from what I share')).toHaveCount(0);
    await expect(page.getByText('I trade on Ekum')).toBeVisible();
  });
});
