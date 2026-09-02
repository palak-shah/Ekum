import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function createOpenReferral(
  request: APIRequestContext,
  accessToken: string,
  note?: string,
): Promise<{ token: string }> {
  const res = await request.post(`${API_URL}/referrals`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { note: note ?? undefined },
  });
  if (!res.ok()) {
    throw new Error(`create referral failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ token: string }>;
}
