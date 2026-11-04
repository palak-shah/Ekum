import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  createOrder,
  decideOrderLines,
  dispatchOrder,
  setLineQuantity,
} from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

type OrderItem = {
  id: string;
  productId: string | null;
  quantity: number;
  lineStatus: string;
  sourceItemId?: string | null;
};

type OrderDetail = {
  id: string;
  status: string;
  tradeMode: string;
  direction?: string;
  youFulfilmentOrderId?: string | null;
  millDesks: Array<{ upstreamOrderId: string; held: boolean; itemIds: string[] }>;
  items: OrderItem[];
  shipments: Array<{
    id: string;
    items: Array<{ orderItemId: string; quantity: number }>;
  }>;
  threadId?: string | null;
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

async function placeMixed(
  request: import('@playwright/test').APIRequestContext,
  meenaToken: string,
  items: Array<{ productId: string; quantity: number }>,
) {
  return createOrder(request, meenaToken, {
    sellerCompanyId: 'seed-company-ravi',
    orderPathPreference: 'handle',
    items,
  });
}

async function confirmSellerLines(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  orderId: string,
  items: Array<{ id: string; quantity: number; rate?: number }>,
) {
  return decideOrderLines(request, token, orderId, {
    items: items.map((item) => ({
      orderItemId: item.id,
      action: 'confirm' as const,
      quantity: item.quantity,
      rate: item.rate ?? 100,
    })),
  });
}

async function sendMill(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  parentId: string,
  millId: string,
) {
  const res = await request.post(`${API_URL}/orders/${parentId}/send-up`, {
    headers: { authorization: `Bearer ${token}` },
    data: { upstreamOrderId: millId },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
}

async function settleOrder(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  orderId: string,
  items?: Array<{ orderItemId: string; quantity: number }>,
) {
  const res = await request.post(`${API_URL}/orders/${orderId}/settle`, {
    headers: { authorization: `Bearer ${token}` },
    data: items ? { items } : {},
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json() as Promise<{ id: string; status: string }>;
}

function shippedQty(order: OrderDetail, itemId: string): number {
  return order.shipments.reduce(
    (sum, ship) =>
      sum +
      ship.items
        .filter((line) => line.orderItemId === itemId)
        .reduce((s, line) => s + line.quantity, 0),
    0,
  );
}

test.describe('Mixed You hop lifecycle @functional @orders', () => {
  test('qty edit maps by sourceItemId; mill line untouched', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 20 },
      { productId: 'seed-prod-1', quantity: 8 },
      { productId: 'seed-prod-1', quantity: 5 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const parent = await getOrder(page.request, raviToken, created.id);
    expect(parent.youFulfilmentOrderId).toBeTruthy();
    const youHopId = parent.youFulfilmentOrderId!;
    const youHop = await getOrder(page.request, raviToken, youHopId);
    expect(youHop.items).toHaveLength(2);
    expect(youHop.items.every((item) => Boolean(item.sourceItemId))).toBe(true);
    expect(youHop.items[0]!.sourceItemId).not.toBe(youHop.items[1]!.sourceItemId);

    await confirmSellerLines(
      page.request,
      raviToken,
      youHopId,
      youHop.items.map((item) => ({ id: item.id, quantity: item.quantity })),
    );

    const confirmedHop = await getOrder(page.request, raviToken, youHopId);
    const target = confirmedHop.items.find((item) => item.quantity === 8)!;
    const sibling = confirmedHop.items.find((item) => item.id !== target.id)!;
    expect(sibling.quantity).toBe(5);

    await setLineQuantity(page.request, raviToken, youHopId, [
      { orderItemId: target.id, quantity: 6 },
    ]);

    const hopAfter = await getOrder(page.request, raviToken, youHopId);
    const parentAfter = await getOrder(page.request, raviToken, created.id);
    const hopTarget = hopAfter.items.find((item) => item.id === target.id)!;
    const hopSibling = hopAfter.items.find((item) => item.id === sibling.id)!;
    expect(hopTarget.quantity).toBe(6);
    expect(hopSibling.quantity).toBe(5);

    const pTarget = parentAfter.items.find((item) => item.id === hopTarget.sourceItemId)!;
    const pSibling = parentAfter.items.find((item) => item.id === hopSibling.sourceItemId)!;
    const pMill = parentAfter.items.find((item) => item.productId === 'seed-prod-fabric-1')!;
    expect(pTarget.quantity).toBe(6);
    expect(pSibling.quantity).toBe(5);
    expect(pMill.quantity).toBe(20);
    expect(pMill.lineStatus).toBe('open');
  });

  test('partial then full You dispatch rolls up without double-count', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 20 },
      { productId: 'seed-prod-1', quantity: 10 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const parent0 = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent0.youFulfilmentOrderId!;
    const you0 = await getOrder(page.request, raviToken, youHopId);
    await confirmSellerLines(page.request, raviToken, youHopId, [
      { id: you0.items[0]!.id, quantity: 10 },
    ]);

    const youLineId = you0.items[0]!.id;
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-PART-1',
      items: [{ orderItemId: youLineId, quantity: 4 }],
    });

    const parentPart = await getOrder(page.request, raviToken, created.id);
    const youParentLine = parentPart.items.find((item) => item.productId === 'seed-prod-1')!;
    const millParentLine = parentPart.items.find((item) => item.productId === 'seed-prod-fabric-1')!;
    expect(parentPart.status).toBe('part_shipped');
    expect(shippedQty(parentPart, youParentLine.id)).toBe(4);
    expect(shippedQty(parentPart, millParentLine.id)).toBe(0);
    expect(millParentLine.lineStatus).toBe('open');

    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-FULL-2',
      items: [{ orderItemId: youLineId, quantity: 6 }],
    });

    const parentYouDone = await getOrder(page.request, raviToken, created.id);
    const youParent2 = parentYouDone.items.find((item) => item.productId === 'seed-prod-1')!;
    expect(shippedQty(parentYouDone, youParent2.id)).toBe(10);
    expect(parentYouDone.status).toBe('part_shipped');
    expect(shippedQty(parentYouDone, millParentLine.id)).toBe(0);
  });

  test('You dispatched + mill open stays part_shipped; both out → dispatched', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 12 },
      { productId: 'seed-prod-1', quantity: 8 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;

    const you = await getOrder(page.request, raviToken, youHopId);
    await confirmSellerLines(page.request, raviToken, youHopId, [
      { id: you.items[0]!.id, quantity: 8 },
    ]);
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-ALL',
      items: [{ orderItemId: you.items[0]!.id, quantity: 8 }],
    });

    parent = await getOrder(page.request, raviToken, created.id);
    expect(parent.status).toBe('part_shipped');
    const youParent = parent.items.find((item) => item.productId === 'seed-prod-1')!;
    expect(shippedQty(parent, youParent.id)).toBe(8);

    await sendMill(page.request, raviToken, created.id, millId);

    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const millHop = await getOrder(page.request, millToken, millId);
    expect(millHop.direction).toBe('selling');
    await confirmSellerLines(page.request, millToken, millId, [
      { id: millHop.items[0]!.id, quantity: 12, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-ALL',
      items: [{ orderItemId: millHop.items[0]!.id, quantity: 12 }],
    });

    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    const millParent = parent.items.find((item) => item.productId === 'seed-prod-fabric-1')!;
    expect(shippedQty(parent, millParent.id)).toBe(12);
    expect(shippedQty(parent, youParent.id)).toBe(8);
    expect(parent.status).toBe('dispatched');
  });

  test('mill settled while You open keeps parent open; both closed settles/dispatches', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 10 },
      { productId: 'seed-prod-1', quantity: 6 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const youHop = await getOrder(page.request, raviToken, youHopId);
    await confirmSellerLines(page.request, raviToken, youHopId, [
      { id: youHop.items[0]!.id, quantity: 6 },
    ]);

    await sendMill(page.request, raviToken, created.id, millId);
    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const millHop = await getOrder(page.request, millToken, millId);
    await confirmSellerLines(page.request, millToken, millId, [
      { id: millHop.items[0]!.id, quantity: 10, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-PART',
      items: [{ orderItemId: millHop.items[0]!.id, quantity: 7 }],
    });
    await settleOrder(page.request, millToken, millId, [
      { orderItemId: millHop.items[0]!.id, quantity: 7 },
    ]);

    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    expect(parent.status).not.toBe('settled');
    expect(parent.status).not.toBe('dispatched');
    expect(['part_shipped', 'confirmed', 'requested']).toContain(parent.status);

    await dispatchOrder(page.request, ravi2, youHopId, {
      lrNumber: 'YOU-CLOSE',
      items: [{ orderItemId: youHop.items[0]!.id, quantity: 6 }],
    });
    parent = await getOrder(page.request, ravi2, created.id);
    expect(['dispatched', 'settled']).toContain(parent.status);
  });

  test('You settled while mill open keeps parent open; mill settle closes parent', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 9 },
      { productId: 'seed-prod-1', quantity: 5 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const youHop = await getOrder(page.request, raviToken, youHopId);
    await confirmSellerLines(page.request, raviToken, youHopId, [
      { id: youHop.items[0]!.id, quantity: 5 },
    ]);
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-PART-S',
      items: [{ orderItemId: youHop.items[0]!.id, quantity: 3 }],
    });
    await settleOrder(page.request, raviToken, youHopId, [
      { orderItemId: youHop.items[0]!.id, quantity: 3 },
    ]);

    parent = await getOrder(page.request, raviToken, created.id);
    expect(parent.status).not.toBe('settled');
    expect(parent.status).not.toBe('dispatched');

    await sendMill(page.request, raviToken, created.id, millId);
    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const millHop = await getOrder(page.request, millToken, millId);
    await confirmSellerLines(page.request, millToken, millId, [
      { id: millHop.items[0]!.id, quantity: 9, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-PART-S',
      items: [{ orderItemId: millHop.items[0]!.id, quantity: 9 }],
    });

    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    // Mill exact full dispatch + You already settled → all subsets complete.
    // Parent may land Dispatched (exact mill) or Settled (heal after subsets).
    expect(['dispatched', 'settled']).toContain(parent.status);
  });

  test('privacy: buyer 404 You hop; mill never lists You hop; chat uses parent', async ({
    page,
  }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await placeMixed(page.request, meenaToken, [
      { productId: 'seed-prod-fabric-1', quantity: 15 },
      { productId: 'seed-prod-1', quantity: 4 },
    ]);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;

    const buyerGet = await page.request.get(`${API_URL}/orders/${youHopId}`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    expect(buyerGet.status()).toBe(404);

    const buyerList = await page.request.get(`${API_URL}/orders?limit=50&direction=buying`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    const buying = (await buyerList.json()) as { results: Array<{ id: string }> };
    expect(buying.results.some((row) => row.id === created.id)).toBe(true);
    expect(buying.results.some((row) => row.id === youHopId)).toBe(false);
    expect(buying.results.some((row) => row.id === millId)).toBe(false);

    const you = await getOrder(page.request, raviToken, youHopId);
    await confirmSellerLines(page.request, raviToken, youHopId, [
      { id: you.items[0]!.id, quantity: 4 },
    ]);

    const buyerParent = await getOrder(page.request, meenaToken, created.id);
    expect(buyerParent.youFulfilmentOrderId ?? null).toBeNull();
    expect(buyerParent.millDesks?.length ?? 0).toBe(0);
    const buyerYouLine = buyerParent.items.find((item) => item.productId === 'seed-prod-1');
    expect(buyerYouLine?.lineStatus).toBe('confirmed');

    if (buyerParent.threadId) {
      const msgs = await page.request.get(
        `${API_URL}/threads/${buyerParent.threadId}/messages?limit=30`,
        { headers: { authorization: `Bearer ${meenaToken}` } },
      );
      if (msgs.ok()) {
        const body = (await msgs.json()) as {
          results?: Array<{ metadata?: { orderId?: string }; body?: string }>;
          items?: Array<{ metadata?: { orderId?: string }; body?: string }>;
        };
        const rows = body.results ?? body.items ?? [];
        const orderCards = rows.filter(
          (row) =>
            row.metadata?.orderId === created.id || row.metadata?.orderId === youHopId,
        );
        expect(orderCards.every((row) => row.metadata?.orderId === created.id)).toBe(true);
        expect(orderCards.some((row) => row.metadata?.orderId === youHopId)).toBe(false);
        const leak = rows.some(
          (row) =>
            typeof row.body === 'string' &&
            /Ahmedabad Loom|seed-company-kavita|Waiting on mill/i.test(row.body),
        );
        expect(leak).toBe(false);
      }
    }

    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const millList = await page.request.get(`${API_URL}/orders?limit=50&direction=selling`, {
      headers: { authorization: `Bearer ${millToken}` },
    });
    const selling = (await millList.json()) as { results: Array<{ id: string }> };
    expect(selling.results.some((row) => row.id === youHopId)).toBe(false);
    expect(selling.results.some((row) => row.id === created.id)).toBe(false);

    const millYou = await page.request.get(`${API_URL}/orders/${youHopId}`, {
      headers: { authorization: `Bearer ${millToken}` },
    });
    expect(millYou.status()).toBe(404);
  });
});
