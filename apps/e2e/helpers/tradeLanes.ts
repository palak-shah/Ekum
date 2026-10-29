import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

/** Seed hygiene: remove Direct Links so the next Place is I-handle. */
export async function resetTradeLanesToMe(
  request: APIRequestContext,
  accessToken: string,
  buyerCompanyId = 'seed-company-meena',
): Promise<void> {
  const auth = { authorization: `Bearer ${accessToken}` };
  const res = await request.get(`${API_URL}/trade-lanes`, { headers: auth });
  if (!res.ok()) return;
  const lanes = (await res.json()) as Array<{ id: string; buyerCompanyId: string }>;
  for (const lane of lanes.filter((row) => row.buyerCompanyId === buyerCompanyId)) {
    await request.delete(`${API_URL}/trade-lanes/${lane.id}`, { headers: auth });
  }
}

/** Mill grants pack access so the follower can curate their designs. */
export async function grantPackAccess(
  request: APIRequestContext,
  millAccessToken: string,
  followerCompanyId: string,
): Promise<void> {
  const res = await request.patch(`${API_URL}/follows/${followerCompanyId}/access`, {
    headers: { authorization: `Bearer ${millAccessToken}` },
    data: { accessKind: 'pack' },
  });
  if (!res.ok()) {
    throw new Error(`grant pack access failed: ${res.status()} ${await res.text()}`);
  }
}

export async function createDirectLink(
  request: APIRequestContext,
  accessToken: string,
  sellerCompanyId: string,
  buyerCompanyId: string,
): Promise<{ id: string }> {
  const res = await request.post(`${API_URL}/trade-lanes`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { sellerCompanyId, buyerCompanyId },
  });
  if (!res.ok()) {
    throw new Error(`create Direct Link failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string }>;
}
