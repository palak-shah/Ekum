import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('Mixed I-handle You Selling hop @functional @orders', () => {
  test('leftover trader SKUs become a Selling hop; buyer never opens it', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [
        { productId: 'seed-prod-fabric-1', quantity: 20 },
        { productId: 'seed-prod-1', quantity: 8 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);

    const detail = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(detail.ok()).toBeTruthy();
    const parent = (await detail.json()) as {
      id: string;
      millDesks: Array<{ upstreamOrderId: string; sellerName: string; itemIds: string[] }>;
      youFulfilmentOrderId?: string | null;
      youFulfilment?: { id: string; status: string } | null;
      items: Array<{ id: string; productId: string | null }>;
    };
    expect(parent.millDesks.length).toBe(1);
    expect(parent.youFulfilmentOrderId).toBeTruthy();
    const youHopId = parent.youFulfilmentOrderId!;
    expect(parent.youFulfilment).toEqual({ id: youHopId, status: 'requested' });
    expect(parent.millDesks.some((desk) => desk.upstreamOrderId === youHopId)).toBe(false);

    const listRes = await page.request.get(`${API_URL}/orders?limit=50&direction=selling`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const list = (await listRes.json()) as { results: Array<{ id: string; tradeMode: string }> };
    expect(list.results.some((row) => row.id === created.id)).toBe(true);
    expect(list.results.some((row) => row.id === youHopId)).toBe(true);
    expect(list.results.some((row) => row.id === parent.millDesks[0]?.upstreamOrderId)).toBe(
      false,
    );

    const youHopRes = await page.request.get(`${API_URL}/orders/${youHopId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(youHopRes.ok()).toBeTruthy();
    const youHop = (await youHopRes.json()) as {
      tradeMode: string;
      direction: string;
      downstreamOrderId: string | null;
      millDesks?: unknown[];
      items: Array<{ id: string; productId: string | null; sourceItemId?: string | null }>;
    };
    expect(youHop.tradeMode).toBe('bilateral');
    expect(youHop.direction).toBe('selling');
    expect(youHop.downstreamOrderId).toBe(created.id);
    expect(youHop.millDesks?.length ?? 0).toBe(0);
    expect(youHop.items).toHaveLength(1);
    expect(youHop.items[0]?.productId).toBe('seed-prod-1');
    expect(youHop.items[0]?.sourceItemId).toBeTruthy();

    const buyerYou = await page.request.get(`${API_URL}/orders/${youHopId}`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    expect(buyerYou.status()).toBe(404);

    const buyerList = await page.request.get(`${API_URL}/orders?limit=50&direction=buying`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    const buying = (await buyerList.json()) as { results: Array<{ id: string }> };
    expect(buying.results.some((row) => row.id === created.id)).toBe(true);
    expect(buying.results.some((row) => row.id === youHopId)).toBe(false);

    const confirmRes = await page.request.post(`${API_URL}/orders/${youHopId}/confirm`, {
      headers: { authorization: `Bearer ${raviToken}` },
      data: {},
    });
    expect(confirmRes.ok()).toBeTruthy();

    const parentAfter = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const after = (await parentAfter.json()) as {
      status: string;
      items: Array<{ id: string; productId: string | null; lineStatus: string }>;
      youFulfilmentOrderId?: string | null;
    };
    const youParentLine = after.items.find((item) => item.productId === 'seed-prod-1');
    expect(youParentLine?.lineStatus).toBe('confirmed');
    const millParentLine = after.items.find((item) => item.productId === 'seed-prod-fabric-1');
    expect(millParentLine?.lineStatus).toBe('open');
    // Mill still Open → parent stays requested until mill pass firms all lines.
    expect(after.status).toBe('requested');

    const dispatchParent = await page.request.post(`${API_URL}/orders/${created.id}/dispatch`, {
      headers: { authorization: `Bearer ${raviToken}` },
      data: {
        items: [{ orderItemId: youParentLine!.id, quantity: 8 }],
      },
    });
    expect(dispatchParent.status()).toBeGreaterThanOrEqual(400);

    const buyerParentRes = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    expect(buyerParentRes.ok()).toBeTruthy();
    const buyerParent = (await buyerParentRes.json()) as {
      youFulfilmentOrderId?: string | null;
      youFulfilment?: { id: string; status: string } | null;
    };
    expect(buyerParent.youFulfilmentOrderId ?? null).toBeNull();
    expect(buyerParent.youFulfilment ?? null).toBeNull();

    await page.goto(`/orders/${created.id}`);
    await expect(page.getByTestId('order-trade-summary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-trade-summary')).toContainText('You sell to');
    await expect(page.getByTestId('order-trade-summary')).toContainText('You buy from');
    await expect(page.getByTestId('order-trade-summary')).toContainText('Goods go');
    await expect(page.getByTestId('order-trade-summary')).toContainText(/Supplier → /);
    await expect(page.getByTestId('order-trade-summary')).not.toContainText(/godown/i);
    // HTML parity: no trader-as-supplier party card on Manage desk.
    await expect(page.getByText(/supplier ·/i)).toHaveCount(0);
    await expect(page.getByTestId('order-notes-audience')).toContainText('You and the buyer');
    await expect(page.getByTestId('order-you-items')).toBeVisible();
    await expect(page.getByTestId('order-you-hop-link')).toBeVisible();
    await expect(page.getByTestId('order-you-open-dispatch')).toHaveCount(0);
    await expect(page.getByTestId('order-dispatch-open')).toHaveCount(0);
    await expect(page.getByTestId('order-open-chat')).toBeVisible();
    // Hold lives on mill hop top ⋯ — not on Manage mill card.
    await expect(page.getByTestId('order-mill-hold')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: 'test-results/mixed-you-hop-parent-390.png',
      fullPage: true,
    });
    await page.getByTestId('order-you-hop-link').click();
    await expect(page).toHaveURL(new RegExp(`/orders/${youHopId}$`));
    await expect(page.getByText('Buyer', { exact: true })).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: 'test-results/mixed-you-hop-selling-390.png',
      fullPage: true,
    });
  });
});
