import { test, expect, type Page } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { createDirectLink, resetTradeLanesToMe } from '../../helpers/tradeLanes';

const KAVITA = 'seed-company-kavita';
const MEENA = 'seed-company-meena';
const RAVI = 'seed-company-ravi';
const TRIO = new Set([KAVITA, MEENA, RAVI]);

type ForBuyerResult = {
  order: {
    id: string;
    status: string;
    tradeMode?: string;
    threadId?: string | null;
    sellerCompanyId?: string;
    facilitatorCompanyId?: string | null;
    createdBySeller?: boolean;
  };
};

type OrderDetail = {
  id: string;
  status: string;
  tradeMode?: string;
  threadId?: string | null;
  sellerCompanyId?: string;
  buyerCompanyId?: string;
  facilitatorCompanyId?: string | null;
  createdBySeller?: boolean;
  items?: Array<{ productId?: string }>;
};

type ThreadDetail = {
  id: string;
  type: string;
  participants: Array<{ companyId: string }>;
};

async function auth(page: Page, token?: string) {
  return { authorization: `Bearer ${token ?? (await accessTokenFromPage(page))}` };
}

async function forBuyer(
  page: Page,
  token: string,
  items: Array<{ productId: string; quantity: number }>,
): Promise<ForBuyerResult> {
  const res = await page.request.post(`${API_URL}/orders/for-buyer`, {
    headers: await auth(page, token),
    data: { buyerCompanyId: RAVI, items },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as ForBuyerResult;
}

async function getOrder(page: Page, token: string, orderId: string): Promise<OrderDetail> {
  const res = await page.request.get(`${API_URL}/orders/${orderId}`, {
    headers: await auth(page, token),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as OrderDetail;
}

async function getThread(page: Page, token: string, threadId: string): Promise<ThreadDetail> {
  const res = await page.request.get(`${API_URL}/threads/${threadId}`, {
    headers: await auth(page, token),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as ThreadDetail;
}

async function millProductId(): Promise<string> {
  return 'seed-prod-fabric-1';
}

async function publishMeenaDesign(page: Page, token: string): Promise<string> {
  const created = await page.request.post(`${API_URL}/products`, {
    headers: await auth(page, token),
    data: { name: `JE own ${Date.now()}`, categories: [], images: [] },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const product = (await created.json()) as { id: string };
  const published = await page.request.post(`${API_URL}/products/${product.id}/publish`, {
    headers: await auth(page, token),
    data: {
      audience: 'everyone',
      rateVisibility: 'on_request',
      allowForward: true,
      consentToSell: true,
    },
  });
  expect(published.ok(), await published.text()).toBeTruthy();
  return product.id;
}

test.describe('one Direct Link trio @functional @orders @chat', () => {
  test.setTimeout(120_000);

  test('supplier own catalog Order for buyer stays mill–buyer 1:1 with Dispatch / Decline', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    const productId = await millProductId();
    const logged = await forBuyer(page, kavitaToken, [{ productId, quantity: 6 }]);
    const order = await getOrder(page, kavitaToken, logged.order.id);
    expect(order.status).toBe('confirmed');
    expect(order.tradeMode).toBe('bilateral');
    expect(order.createdBySeller).toBe(true);
    expect(order.sellerCompanyId).toBe(KAVITA);
    expect(order.facilitatorCompanyId ?? null).toBeNull();
    expect(order.threadId).toBeTruthy();
    const thread = await getThread(page, kavitaToken, order.threadId!);
    expect(thread.type).toBe('direct');
    expect(new Set(thread.participants.map((row) => row.companyId))).toEqual(
      new Set([KAVITA, RAVI]),
    );

    await page.goto(`/orders/${order.id}`);
    await expect(page.getByTestId('order-dispatch-open')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-dock-confirm')).toHaveCount(0);

    await loginAsRavi(page);
    await page.goto(`/orders/${order.id}`);
    await expect(page.getByTestId('order-dock-decline')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-dispatch-open')).toHaveCount(0);
  });

  test('trader mill Order for buyer + Direct Link uses one trio; Place does not clone it', async ({
    page,
  }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, meenaToken, RAVI);
    await createDirectLink(page.request, meenaToken, KAVITA, RAVI);
    const millSku = await millProductId();
    const first = await forBuyer(page, meenaToken, [{ productId: millSku, quantity: 4 }]);
    const firstOrder = await getOrder(page, meenaToken, first.order.id);
    expect(firstOrder.tradeMode).toBe('direct');
    expect(firstOrder.sellerCompanyId).toBe(KAVITA);
    expect(firstOrder.threadId).toBeTruthy();
    const trio = await getThread(page, meenaToken, firstOrder.threadId!);
    expect(trio.type).toBe('group');
    expect(new Set(trio.participants.map((row) => row.companyId))).toEqual(TRIO);

    const second = await forBuyer(page, meenaToken, [{ productId: millSku, quantity: 3 }]);
    const secondOrder = await getOrder(page, meenaToken, second.order.id);
    expect(secondOrder.threadId).toBe(firstOrder.threadId);

    await loginAsKavita(page);
    await page.goto(`/orders/${firstOrder.id}`);
    await expect(page.getByTestId('order-dock-confirm')).toBeVisible({ timeout: 15_000 });
  });

  test('mixed own + mill splits on Direct Link and stays one I-handle without it', async ({
    page,
  }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const ownId = await publishMeenaDesign(page, meenaToken);
    const millSku = await millProductId();

    await resetTradeLanesToMe(page.request, meenaToken, RAVI);
    await createDirectLink(page.request, meenaToken, KAVITA, RAVI);
    const withLink = await forBuyer(page, meenaToken, [
      { productId: ownId, quantity: 2 },
      { productId: millSku, quantity: 5 },
    ]);
    const first = await getOrder(page, meenaToken, withLink.order.id);
    expect(first.tradeMode).toBe('bilateral');
    expect(first.sellerCompanyId).toBe(MEENA);
    expect(first.createdBySeller).toBe(true);
    expect(first.threadId).toBeTruthy();
    const ownChat = await getThread(page, meenaToken, first.threadId!);
    expect(ownChat.type).toBe('direct');

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    const millSelling = await page.request.get(`${API_URL}/orders?limit=20`, {
      headers: await auth(page, kavitaToken),
    });
    expect(millSelling.ok()).toBeTruthy();
    const millList = (await millSelling.json()) as {
      results: Array<{ id: string; tradeMode?: string }>;
    };
    expect(millList.results.length).toBeGreaterThan(0);
    const millTicket = millList.results.find((row) => row.tradeMode === 'direct') ?? millList.results[0];
    expect(millTicket).toBeTruthy();
    const millOrder = await getOrder(page, kavitaToken, millTicket!.id);
    expect(millOrder.tradeMode).toBe('direct');
    expect(millOrder.sellerCompanyId).toBe(KAVITA);
    expect(millOrder.threadId).toBeTruthy();
    const trio = await getThread(page, kavitaToken, millOrder.threadId!);
    expect(trio.type).toBe('group');
    expect(new Set(trio.participants.map((row) => row.companyId))).toEqual(TRIO);

    await loginAsKavita(page);
    const kavitaReset = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, kavitaReset, RAVI);
    await loginAsMeena(page);
    const meenaAgain = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, meenaAgain, RAVI);
    const noLink = await forBuyer(page, meenaAgain, [
      { productId: ownId, quantity: 2 },
      { productId: millSku, quantity: 5 },
    ]);
    const parent = await getOrder(page, meenaAgain, noLink.order.id);
    expect(parent.tradeMode).toBe('manage');
    expect(parent.sellerCompanyId).toBe(MEENA);
    expect(parent.items?.length).toBe(2);
    expect(parent.threadId).toBeTruthy();
    const oneToOne = await getThread(page, meenaAgain, parent.threadId!);
    expect(oneToOne.type).toBe('direct');
    expect(new Set(oneToOne.participants.map((row) => row.companyId))).toEqual(
      new Set([MEENA, RAVI]),
    );
  });
});
