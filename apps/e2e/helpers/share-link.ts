import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function createShareLink(
  request: APIRequestContext,
  accessToken: string,
  body: { collectionId?: string; productId?: string },
): Promise<{ token: string; name: string; kind: string; targetId: string }> {
  const res = await request.post(`${API_URL}/share-links`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`create share link failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ token: string; name: string; kind: string; targetId: string }>;
}
