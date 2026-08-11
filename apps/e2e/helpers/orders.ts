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
): Promise<{ id: string; threadId: string; items: Array<{ id: string; quantity: number }> }> {
  const res = await request.get(`${API_URL}/orders/${orderId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) {
    throw new Error(`get order failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{
    id: string;
    threadId: string;
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

export async function accessTokenFromPage(page: {
  evaluate: (fn: () => string | null) => Promise<string | null>;
}): Promise<string> {
  const tokensRaw = await page.evaluate(() => localStorage.getItem('ekum.tokens'));
  if (!tokensRaw) throw new Error('missing tokens');
  const { accessToken } = JSON.parse(tokensRaw) as { accessToken: string };
  return accessToken;
}
