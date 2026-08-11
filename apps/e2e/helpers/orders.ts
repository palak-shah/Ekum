import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function createOrder(
  request: APIRequestContext,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string; threadId: string }> {
  const res = await request.post(`${API_URL}/orders`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`create order failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; threadId: string }>;
}
