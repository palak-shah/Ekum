import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function createOrder(
  request: APIRequestContext,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string; threadId: string; items: Array<{ id: string }> }> {
  const res = await request.post(`${API_URL}/orders`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`create order failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; threadId: string; items: Array<{ id: string }> }>;
}

export async function getOrder(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
): Promise<{
  id: string;
  threadId: string;
  status: string;
  items: Array<{ id: string; quantity: number }>;
}> {
  const res = await request.get(`${API_URL}/orders/${orderId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) {
    throw new Error(`get order failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{
    id: string;
    threadId: string;
    status: string;
    items: Array<{ id: string; quantity: number }>;
  }>;
}

export async function quoteOrder(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
  items: Array<{ orderItemId: string; rate: number; quantity?: number }>,
): Promise<{ id: string; threadId: string; canAcceptQuote?: boolean; status: string }> {
  const res = await request.post(`${API_URL}/orders/${orderId}/quote`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { items },
  });
  if (!res.ok()) {
    throw new Error(`quote failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{
    id: string;
    threadId: string;
    canAcceptQuote?: boolean;
    status: string;
  }>;
}

/** Alias for accept-quote — order moves to confirmed. */
export async function confirmOrder(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
): Promise<{ id: string; status: string; threadId: string }> {
  return acceptQuote(request, accessToken, orderId);
}

export async function acceptQuote(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
): Promise<{ id: string; status: string; threadId: string }> {
  const res = await request.post(`${API_URL}/orders/${orderId}/accept-quote`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: {},
  });
  if (!res.ok()) {
    throw new Error(`accept quote failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; status: string; threadId: string }>;
}

export async function dispatchOrder(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
  body: { lrNumber: string; transporter?: string; parcelCount?: number },
): Promise<{ id: string; status: string }> {
  const res = await request.post(`${API_URL}/orders/${orderId}/dispatch`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`dispatch failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; status: string }>;
}

export async function deliverOrder(
  request: APIRequestContext,
  accessToken: string,
  orderId: string,
): Promise<{ id: string; status: string }> {
  const res = await request.post(`${API_URL}/orders/${orderId}/deliver`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: {},
  });
  if (!res.ok()) {
    throw new Error(`deliver failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; status: string }>;
}

/** Request → quote → accept-quote for a two-line seed order. */
export async function setupConfirmedOrder(
  request: APIRequestContext,
  buyerToken: string,
  sellerToken: string,
): Promise<{ id: string; threadId: string }> {
  const order = await createOrder(request, buyerToken, {
    sellerCompanyId: 'seed-company-ravi',
    intent: 'order',
    items: [
      { productId: 'seed-prod-1', quantity: 40 },
      { productId: 'seed-prod-2', quantity: 40 },
    ],
  });
  const detailed = await getOrder(request, sellerToken, order.id);
  await quoteOrder(
    request,
    sellerToken,
    order.id,
    detailed.items.map((item) => ({
      orderItemId: item.id,
      rate: 120,
      quantity: item.quantity,
    })),
  );
  await acceptQuote(request, buyerToken, order.id);
  return { id: order.id, threadId: order.threadId };
}

export async function accessTokenFromPage(page: {
  evaluate: (fn: () => string | null) => Promise<string | null>;
}): Promise<string> {
  const tokensRaw = await page.evaluate(() => localStorage.getItem('ekum.tokens'));
  if (!tokensRaw) throw new Error('missing tokens');
  const { accessToken } = JSON.parse(tokensRaw) as { accessToken: string };
  return accessToken;
}
