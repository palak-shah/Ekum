import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena } from '../../helpers/persona';
import { placeCuratedABPack } from '../../helpers/fromPackJourney';

test.describe('Direct Place trio @functional @orders', () => {
  test.setTimeout(120_000);

  test('Direct Link at Place opens mill–buyer–trader group; mill-reveal is locked', async ({
    page,
  }) => {
    const result = await placeCuratedABPack(page, {
      directMillCompanyId: 'seed-company-kavita',
    });
    const direct = result.directs.find((row) => row.sellerCompanyId === 'seed-company-kavita');
    expect(direct).toBeTruthy();
    expect(direct!.tradeMode).toBe('direct');
    expect(direct!.facilitatorCompanyId).toBe('seed-company-meena');
    expect(direct!.threadId).toBeTruthy();

    const raviToken = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${raviToken}` };
    const threadRes = await page.request.get(`${API_URL}/threads/${direct!.threadId}`, {
      headers: auth,
    });
    expect(threadRes.ok()).toBeTruthy();
    const thread = (await threadRes.json()) as {
      type: string;
      participants: Array<{ companyId: string }>;
    };
    expect(thread.type).toBe('group');
    expect(new Set(thread.participants.map((p) => p.companyId))).toEqual(
      new Set(['seed-company-ravi', 'seed-company-kavita', 'seed-company-meena']),
    );

    const locked = await page.request.post(`${API_URL}/orders/${direct!.id}/mill-reveal`, {
      headers: auth,
      data: { upstreamOrderId: 'none', reveal: true },
    });
    expect(locked.ok()).toBeFalsy();
  });

  test('mixed Place: trader Shared + Trading; Send only on I-handle hop', async ({ page }) => {
    const result = await placeCuratedABPack(page, {
      directMillCompanyId: 'seed-company-kavita',
    });
    const direct = result.directs.find((row) => row.sellerCompanyId === 'seed-company-kavita');
    expect(direct).toBeTruthy();
    expect(result.downstream?.id).toBeTruthy();
    const parentId = result.downstream!.id;

    const raviToken = await accessTokenFromPage(page);
    const buyerParent = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const asBuyer = (await buyerParent.json()) as {
      sellerCompanyId: string;
      millDesks?: Array<{ sellerName: string }>;
    };
    expect(asBuyer.sellerCompanyId).toBe('seed-company-meena');
    expect(asBuyer.millDesks?.length ?? 0).toBe(0);

    await loginAsMeena(page);
    const traderToken = await accessTokenFromPage(page);
    const traderDirect = await page.request.get(`${API_URL}/orders/${direct!.id}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    const asTraderDirect = (await traderDirect.json()) as {
      tradeMode: string;
      canSendUp?: boolean;
      millDesks?: Array<{ sellerName: string }>;
    };
    expect(asTraderDirect.tradeMode).toBe('direct');
    expect(asTraderDirect.canSendUp).toBeFalsy();
    expect(asTraderDirect.millDesks?.length ?? 0).toBe(0);

    const tradingList = await page.request.get(
      `${API_URL}/orders?limit=50&tradeMode=manage&direction=selling`,
      { headers: { authorization: `Bearer ${traderToken}` } },
    );
    const trading = (await tradingList.json()) as { results: Array<{ id: string }> };
    expect(trading.results.some((row) => row.id === parentId)).toBe(true);

    await page.goto(`/orders/${parentId}`);
    await expect(page.getByRole('button', { name: 'Send to Surat Silk House' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /Send to Ahmedabad Loom Co/ })).toHaveCount(0);

    await page.goto(`/orders/${direct!.id}`);
    await expect(page.getByRole('button', { name: /^Send / })).toHaveCount(0);
  });
});
