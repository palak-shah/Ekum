import { test, expect } from '@playwright/test';
import { createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

type OrderDetail = {
  id: string;
  status: string;
  canAmend?: boolean;
  youFulfilmentOrderId?: string | null;
  millDesks: Array<{ upstreamOrderId: string }>;
  items: Array<{
    id: string;
    productId: string | null;
    quantity: number;
    sourceItemId?: string | null;
  }>;
};

async function getOrder(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  id: string,
): Promise<OrderDetail> {
  const res = await request.get(`${API_URL}/orders/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json() as Promise<OrderDetail>;
}

async function amendOrder(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  orderId: string,
  items: Array<{ orderItemId?: string; productId: string; quantity: number }>,
) {
  const res = await request.post(`${API_URL}/orders/${orderId}/amend`, {
    headers: { authorization: `Bearer ${token}` },
    data: { items: items.map((item) => ({ ...item, images: [] })) },
  });
  return res;
}

test.describe('Slice D amend stable identity @functional @orders', () => {
  test.setTimeout(120_000);

  test('duplicate mill SKUs keep hop sourceItemId after amend qty and remove', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [
        { productId: 'seed-prod-fabric-1', quantity: 10 },
        { productId: 'seed-prod-fabric-1', quantity: 20 },
        { productId: 'seed-prod-1', quantity: 5 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const youHopId = parent.youFulfilmentOrderId!;
    let mill = await getOrder(page.request, raviToken, millId);
    expect(mill.items).toHaveLength(2);

    const parentA = parent.items.find(
      (item) => item.productId === 'seed-prod-fabric-1' && item.quantity === 10,
    )!;
    const parentB = parent.items.find(
      (item) => item.productId === 'seed-prod-fabric-1' && item.quantity === 20,
    )!;
    const parentYou = parent.items.find((item) => item.productId === 'seed-prod-1')!;
    const hopA = mill.items.find((item) => item.sourceItemId === parentA.id)!;
    const hopB = mill.items.find((item) => item.sourceItemId === parentB.id)!;
    expect(hopA).toBeTruthy();
    expect(hopB).toBeTruthy();

    const amendRes = await amendOrder(page.request, meenaToken, created.id, [
      { orderItemId: parentA.id, productId: 'seed-prod-fabric-1', quantity: 11 },
      { orderItemId: parentB.id, productId: 'seed-prod-fabric-1', quantity: 20 },
      { orderItemId: parentYou.id, productId: 'seed-prod-1', quantity: 5 },
    ]);
    expect(amendRes.ok(), await amendRes.text()).toBeTruthy();

    parent = await getOrder(page.request, raviToken, created.id);
    mill = await getOrder(page.request, raviToken, millId);
    const you = await getOrder(page.request, raviToken, youHopId);
    expect(parent.items.find((item) => item.id === parentA.id)?.quantity).toBe(11);
    expect(parent.items.find((item) => item.id === parentB.id)?.quantity).toBe(20);
    expect(mill.items.find((item) => item.id === hopA.id)?.sourceItemId).toBe(parentA.id);
    expect(mill.items.find((item) => item.id === hopB.id)?.sourceItemId).toBe(parentB.id);
    expect(mill.items.find((item) => item.id === hopA.id)?.quantity).toBe(11);
    expect(you.items[0]?.sourceItemId).toBe(parentYou.id);

    const removeRes = await amendOrder(page.request, meenaToken, created.id, [
      { orderItemId: parentB.id, productId: 'seed-prod-fabric-1', quantity: 20 },
      { orderItemId: parentYou.id, productId: 'seed-prod-1', quantity: 5 },
    ]);
    expect(removeRes.ok(), await removeRes.text()).toBeTruthy();

    parent = await getOrder(page.request, raviToken, created.id);
    mill = await getOrder(page.request, raviToken, millId);
    expect(parent.items.find((item) => item.id === parentA.id)).toBeUndefined();
    expect(parent.items.find((item) => item.id === parentB.id)?.quantity).toBe(20);
    expect(mill.items.find((item) => item.id === hopA.id)).toBeUndefined();
    expect(mill.items.find((item) => item.id === hopB.id)?.sourceItemId).toBe(parentB.id);
  });

  test('Buying 1:1 amend keeps line id', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      items: [{ productId: 'seed-prod-1', quantity: 7 }],
    });
    const before = await getOrder(page.request, meenaToken, created.id);
    const lineId = before.items[0]!.id;
    const res = await amendOrder(page.request, meenaToken, created.id, [
      { orderItemId: lineId, productId: 'seed-prod-1', quantity: 9 },
    ]);
    expect(res.ok(), await res.text()).toBeTruthy();
    const after = await getOrder(page.request, meenaToken, created.id);
    expect(after.items).toHaveLength(1);
    expect(after.items[0]!.id).toBe(lineId);
    expect(after.items[0]!.quantity).toBe(9);
  });

  test('rejects foreign orderItemId and You add without You hop', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const millOnly = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 5 }],
    });
    const parent = await getOrder(page.request, meenaToken, millOnly.id);
    expect(parent.youFulfilmentOrderId ?? null).toBeNull();
    const line = parent.items[0]!;

    const foreign = await amendOrder(page.request, meenaToken, millOnly.id, [
      { orderItemId: 'not-a-real-line', productId: 'seed-prod-fabric-1', quantity: 5 },
    ]);
    expect(foreign.status()).toBe(400);

    const noYou = await amendOrder(page.request, meenaToken, millOnly.id, [
      { orderItemId: line.id, productId: 'seed-prod-fabric-1', quantity: 5 },
      { productId: 'seed-prod-1', quantity: 3 },
    ]);
    expect(noYou.status()).toBe(400);
    const body = await noYou.json();
    expect(String(body.code ?? body.message)).toMatch(/NO_YOU_HOP|You selling/i);
  });
});
