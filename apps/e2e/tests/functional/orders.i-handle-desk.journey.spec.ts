import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('I-handle desk @functional @orders', () => {
  test('trader list is the buyer ticket; Send lives on that page', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 20 }],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const listRes = await page.request.get(`${API_URL}/orders?limit=50`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      results: Array<{
        id: string;
        linkedMills?: Array<{ name: string; orderId: string | null }>;
      }>;
    };
    expect(list.results.some((row) => row.id === created.id)).toBe(true);
    const parentRow = list.results.find((row) => row.id === created.id);
    expect(parentRow?.linkedMills?.length).toBeGreaterThan(0);
    expect(parentRow?.linkedMills?.[0]?.name).toBeTruthy();
    const detail = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const view = (await detail.json()) as {
      millDesks: Array<{ upstreamOrderId: string; sellerName: string; held: boolean }>;
    };
    expect(view.millDesks.length).toBeGreaterThan(0);
    expect(list.results.some((row) => row.id === view.millDesks[0]?.upstreamOrderId)).toBe(false);

    const tradingList = await page.request.get(
      `${API_URL}/orders?limit=50&tradeMode=manage&direction=selling`,
      { headers: { authorization: `Bearer ${raviToken}` } },
    );
    const tradingRows = (await tradingList.json()) as { results: Array<{ id: string; tradeMode: string }> };
    expect(tradingRows.results.some((row) => row.id === created.id)).toBe(true);
    expect(tradingRows.results.every((row) => row.tradeMode === 'manage')).toBe(true);

    await page.goto('/orders');
    await page.getByTestId('orders-filter').click();
    await page.getByTestId('orders-filter-open-type').click();
    await page.getByTestId('orders-filter-type-trading').click();
    await expect(page).toHaveURL(/kind=trading/, { timeout: 10_000 });
    await expect(page.getByText(/Showing/)).toContainText('Trading');
    await expect(page.getByText(/Trading/).first()).toBeVisible();

    await page.goto(`/orders/${created.id}`);
    await expect(page.getByRole('button', { name: /Send to / })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Send to / }).click();
    await expect(page.getByText('Sent.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Send to / })).toHaveCount(0);

    const after = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const sent = (await after.json()) as {
      millDesks: Array<{ upstreamOrderId: string; sellerName: string }>;
    };
    const millId = sent.millDesks[0]?.upstreamOrderId;
    expect(millId).toBeTruthy();
    const findRes = await page.request.get(
      `${API_URL}/orders?limit=50&q=${encodeURIComponent(millId!)}`,
      { headers: { authorization: `Bearer ${raviToken}` } },
    );
    const found = (await findRes.json()) as { results: Array<{ id: string }> };
    expect(found.results.some((row) => row.id === created.id)).toBe(true);
    expect(found.results.some((row) => row.id === millId)).toBe(false);
  });
});
