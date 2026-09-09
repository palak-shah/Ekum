import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

/** Seed hygiene: Your paths ticket=mill rewrites the next handle place to Direct. */
export async function resetTradeLanesToMe(
  request: APIRequestContext,
  accessToken: string,
  buyerCompanyId = 'seed-company-meena',
): Promise<void> {
  const res = await request.get(`${API_URL}/trade-lanes`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok()) return;
  const lanes = (await res.json()) as Array<{ id: string; buyerCompanyId: string }>;
  for (const lane of lanes.filter((row) => row.buyerCompanyId === buyerCompanyId)) {
    await request.patch(`${API_URL}/trade-lanes/${lane.id}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      data: { ticket: 'me', reveal: false },
    });
  }
}
