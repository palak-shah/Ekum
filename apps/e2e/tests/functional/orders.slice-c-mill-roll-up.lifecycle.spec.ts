import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  createOrder,
  decideOrderLines,
  dispatchOrder,
  editShipment,
} from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { placeCuratedABPack } from '../../helpers/fromPackJourney';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

type OrderDetail = {
  id: string;
  status: string;
  youFulfilmentOrderId?: string | null;
  millDesks: Array<{ upstreamOrderId: string; sellerName?: string; held: boolean }>;
  items: Array<{
    id: string;
    productId: string | null;
    quantity: number;
    lineStatus: string;
    sourceItemId?: string | null;
  }>;
  shipments: Array<{
    id: string;
    items: Array<{ orderItemId: string; quantity: number }>;
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

async function confirmLines(
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

test.describe('Slice C mill shipment roll-up @functional @orders', () => {
  test.setTimeout(180_000);

  test('1+7: one mill + You — edit reduces parent mill ship; You LR untouched', async ({
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
        { productId: 'seed-prod-fabric-1', quantity: 20 },
        { productId: 'seed-prod-1', quantity: 10 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const you = await getOrder(page.request, raviToken, youHopId);
    await confirmLines(page.request, raviToken, youHopId, [
      { id: you.items[0]!.id, quantity: 10 },
    ]);
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-1',
      items: [{ orderItemId: you.items[0]!.id, quantity: 10 }],
    });

    await sendMill(page.request, raviToken, created.id, millId);
    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const mill = await getOrder(page.request, millToken, millId);
    await confirmLines(page.request, millToken, millId, [
      { id: mill.items[0]!.id, quantity: 20, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-PART',
      items: [{ orderItemId: mill.items[0]!.id, quantity: 12 }],
    });

    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    const millParent = parent.items.find((item) => item.productId === 'seed-prod-fabric-1')!;
    const youParent = parent.items.find((item) => item.productId === 'seed-prod-1')!;
    expect(shippedQty(parent, millParent.id)).toBe(12);
    expect(shippedQty(parent, youParent.id)).toBe(10);

    const millFresh = await getOrder(page.request, millToken, millId);
    const millShipId = millFresh.shipments[0]!.id;
    await editShipment(page.request, millToken, millId, millShipId, {
      lrNumber: 'MILL-EDIT',
      items: [{ orderItemId: mill.items[0]!.id, quantity: 8 }],
    });

    parent = await getOrder(page.request, ravi2, created.id);
    expect(shippedQty(parent, millParent.id)).toBe(8);
    expect(shippedQty(parent, youParent.id)).toBe(10);
    expect(parent.status).toBe('part_shipped');
  });

  test('6: settle Final below shipped trims parent mill LR only', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [
        { productId: 'seed-prod-fabric-1', quantity: 15 },
        { productId: 'seed-prod-1', quantity: 6 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const you = await getOrder(page.request, raviToken, youHopId);
    await confirmLines(page.request, raviToken, youHopId, [
      { id: you.items[0]!.id, quantity: 6 },
    ]);
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-FULL',
      items: [{ orderItemId: you.items[0]!.id, quantity: 6 }],
    });

    await sendMill(page.request, raviToken, created.id, millId);
    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const mill = await getOrder(page.request, millToken, millId);
    await confirmLines(page.request, millToken, millId, [
      { id: mill.items[0]!.id, quantity: 15, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-10',
      items: [{ orderItemId: mill.items[0]!.id, quantity: 10 }],
    });
    await settleOrder(page.request, millToken, millId, [
      { orderItemId: mill.items[0]!.id, quantity: 7 },
    ]);

    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    const millParent = parent.items.find((item) => item.productId === 'seed-prod-fabric-1')!;
    const youParent = parent.items.find((item) => item.productId === 'seed-prod-1')!;
    expect(millParent.quantity).toBe(7);
    expect(shippedQty(parent, millParent.id)).toBe(7);
    expect(shippedQty(parent, youParent.id)).toBe(6);
    expect(['dispatched', 'settled']).toContain(parent.status);
  });

  test('3+4+5: one path settled while other open; then both closed', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [
        { productId: 'seed-prod-fabric-1', quantity: 10 },
        { productId: 'seed-prod-1', quantity: 5 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent.youFulfilmentOrderId!;
    const millId = parent.millDesks[0]!.upstreamOrderId;
    const you = await getOrder(page.request, raviToken, youHopId);
    await confirmLines(page.request, raviToken, youHopId, [
      { id: you.items[0]!.id, quantity: 5 },
    ]);
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-PART',
      items: [{ orderItemId: you.items[0]!.id, quantity: 3 }],
    });
    await settleOrder(page.request, raviToken, youHopId, [
      { orderItemId: you.items[0]!.id, quantity: 3 },
    ]);

    parent = await getOrder(page.request, raviToken, created.id);
    expect(parent.status).not.toBe('settled');
    expect(parent.status).not.toBe('dispatched');

    await sendMill(page.request, raviToken, created.id, millId);
    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const mill = await getOrder(page.request, millToken, millId);
    await confirmLines(page.request, millToken, millId, [
      { id: mill.items[0]!.id, quantity: 10, rate: 85 },
    ]);
    await dispatchOrder(page.request, millToken, millId, {
      lrNumber: 'MILL-PART',
      items: [{ orderItemId: mill.items[0]!.id, quantity: 6 }],
    });
    // All dispatched paths not both settled yet — mill still part_shipped.
    await loginAsRavi(page);
    const ravi2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, ravi2, created.id);
    expect(parent.status).toBe('part_shipped');

    await settleOrder(page.request, millToken, millId, [
      { orderItemId: mill.items[0]!.id, quantity: 6 },
    ]);
    parent = await getOrder(page.request, ravi2, created.id);
    expect(['dispatched', 'settled']).toContain(parent.status);
  });

  test('8: duplicate SKUs on You hop — edit maps by sourceItemId', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [
        { productId: 'seed-prod-fabric-1', quantity: 5 },
        { productId: 'seed-prod-1', quantity: 8 },
        { productId: 'seed-prod-1', quantity: 4 },
      ],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const parent0 = await getOrder(page.request, raviToken, created.id);
    const youHopId = parent0.youFulfilmentOrderId!;
    const you = await getOrder(page.request, raviToken, youHopId);
    expect(you.items).toHaveLength(2);
    await confirmLines(
      page.request,
      raviToken,
      youHopId,
      you.items.map((item) => ({ id: item.id, quantity: item.quantity })),
    );
    const target = you.items.find((item) => item.quantity === 8)!;
    const sibling = you.items.find((item) => item.id !== target.id)!;
    await dispatchOrder(page.request, raviToken, youHopId, {
      lrNumber: 'YOU-DUP',
      items: [
        { orderItemId: target.id, quantity: 8 },
        { orderItemId: sibling.id, quantity: 4 },
      ],
    });
    const youAfter = await getOrder(page.request, raviToken, youHopId);
    const shipId = youAfter.shipments[0]!.id;
    await editShipment(page.request, raviToken, youHopId, shipId, {
      lrNumber: 'YOU-DUP-EDIT',
      items: [
        { orderItemId: target.id, quantity: 5 },
        { orderItemId: sibling.id, quantity: 4 },
      ],
    });

    const parent = await getOrder(page.request, raviToken, created.id);
    const hop = await getOrder(page.request, raviToken, youHopId);
    const hopTarget = hop.items.find((item) => item.id === target.id)!;
    const hopSibling = hop.items.find((item) => item.id === sibling.id)!;
    expect(shippedQty(parent, hopTarget.sourceItemId!)).toBe(5);
    expect(shippedQty(parent, hopSibling.sourceItemId!)).toBe(4);
    expect(shippedQty(parent, parent.items.find((i) => i.productId === 'seed-prod-fabric-1')!.id)).toBe(
      0,
    );
  });

  test('2+3: two mills — settle one leaves other open; edit isolates', async ({ page }) => {
    const placed = await placeCuratedABPack(page);
    expect(placed.downstream?.id).toBeTruthy();
    const parentId = placed.downstream!.id;

    await loginAsMeena(page);
    const traderToken = await accessTokenFromPage(page);
    let parent = await getOrder(page.request, traderToken, parentId);
    expect(parent.millDesks).toHaveLength(2);
    // Curated A+B has no leftover You hop (both lines mill-owned).
    expect(parent.youFulfilmentOrderId ?? null).toBeNull();

    const deskA = parent.millDesks[0]!;
    const deskB = parent.millDesks[1]!;
    await sendMill(page.request, traderToken, parentId, deskA.upstreamOrderId);
    await sendMill(page.request, traderToken, parentId, deskB.upstreamOrderId);

    // Confirm + partial dispatch mill A (Kavita or Ravi depending on desk).
    const millASeller =
      deskA.sellerName?.includes('Loom') || deskA.sellerName?.includes('Ahmedabad')
        ? 'kavita'
        : 'ravi';
    if (millASeller === 'kavita') await loginAsKavita(page);
    else await loginAsRavi(page);
    const millAToken = await accessTokenFromPage(page);
    const millA = await getOrder(page.request, millAToken, deskA.upstreamOrderId);
    await confirmLines(page.request, millAToken, deskA.upstreamOrderId, [
      { id: millA.items[0]!.id, quantity: millA.items[0]!.quantity, rate: 90 },
    ]);
    await dispatchOrder(page.request, millAToken, deskA.upstreamOrderId, {
      lrNumber: 'A-10',
      items: [{ orderItemId: millA.items[0]!.id, quantity: 10 }],
    });
    await settleOrder(page.request, millAToken, deskA.upstreamOrderId, [
      { orderItemId: millA.items[0]!.id, quantity: 7 },
    ]);

    await loginAsMeena(page);
    const trader2 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, trader2, parentId);
    expect(parent.status).not.toBe('settled');
    const mappedA = millA.items[0]!.sourceItemId;
    expect(mappedA).toBeTruthy();
    expect(shippedQty(parent, mappedA!)).toBe(7);

    // Edit mill A would already be settled — use mill B edit isolation instead.
    const millBSeller =
      deskB.sellerName?.includes('Loom') || deskB.sellerName?.includes('Ahmedabad')
        ? 'kavita'
        : 'ravi';
    if (millBSeller === 'kavita') await loginAsKavita(page);
    else await loginAsRavi(page);
    const millBToken = await accessTokenFromPage(page);
    const millB = await getOrder(page.request, millBToken, deskB.upstreamOrderId);
    await confirmLines(page.request, millBToken, deskB.upstreamOrderId, [
      { id: millB.items[0]!.id, quantity: millB.items[0]!.quantity, rate: 95 },
    ]);
    await dispatchOrder(page.request, millBToken, deskB.upstreamOrderId, {
      lrNumber: 'B-12',
      items: [{ orderItemId: millB.items[0]!.id, quantity: 12 }],
    });
    const millBFresh = await getOrder(page.request, millBToken, deskB.upstreamOrderId);
    await editShipment(page.request, millBToken, deskB.upstreamOrderId, millBFresh.shipments[0]!.id, {
      lrNumber: 'B-9',
      items: [{ orderItemId: millB.items[0]!.id, quantity: 9 }],
    });

    await loginAsMeena(page);
    const trader3 = await accessTokenFromPage(page);
    parent = await getOrder(page.request, trader3, parentId);
    const mappedB = millB.items[0]!.sourceItemId!;
    expect(shippedQty(parent, mappedB)).toBe(9);
    expect(shippedQty(parent, mappedA!)).toBe(7);
    expect(parent.status).toBe('part_shipped');
  });
});
