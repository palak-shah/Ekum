import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena } from '../../helpers/persona';
import { placeCuratedABPack } from '../../helpers/fromPackJourney';

/**
 * D1 — from-pack place → one trader ticket + two mill desks (API).
 * D3 — trader desk shows two mill cards with qty/rate and Send per shop.
 */
test.describe('from-pack multi-supplier @functional @orders @trader', () => {
  test.setTimeout(120_000);
  test('D1 place curated A+B pack → one trader ticket + two mill desks', async ({ page }) => {
    const placed = await placeCuratedABPack(page);
    expect(placed.downstream?.id).toBeTruthy();
    const parentId = placed.downstream!.id;

    const raviToken = await accessTokenFromPage(page);
    const buyerDetail = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(buyerDetail.ok()).toBeTruthy();
    const asBuyer = (await buyerDetail.json()) as {
      sellerCompanyId: string;
      tradeMode: string;
      millDesks?: Array<{ sellerName: string }>;
      threadId?: string | null;
    };
    expect(asBuyer.sellerCompanyId).toBe('seed-company-meena');
    expect(asBuyer.tradeMode).toBe('manage');
    expect(asBuyer.threadId).toBeTruthy();
    expect(asBuyer.millDesks?.length ?? 0).toBe(0);

    await loginAsMeena(page);
    const traderToken = await accessTokenFromPage(page);
    const traderDetail = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    expect(traderDetail.ok()).toBeTruthy();
    const asTrader = (await traderDetail.json()) as {
      millDesks: Array<{ sellerName: string; upstreamOrderId: string; held: boolean }>;
    };
    expect(asTrader.millDesks).toHaveLength(2);
    expect(asTrader.millDesks.map((d) => d.sellerName).sort()).toEqual([
      'Ahmedabad Loom Co',
      'Surat Silk House',
    ]);
    expect(asTrader.millDesks.every((d) => d.held)).toBe(true);

    const tradingList = await page.request.get(
      `${API_URL}/orders?limit=50&tradeMode=manage&direction=selling`,
      { headers: { authorization: `Bearer ${traderToken}` } },
    );
    const trading = (await tradingList.json()) as { results: Array<{ id: string }> };
    expect(trading.results.some((row) => row.id === parentId)).toBe(true);
    for (const desk of asTrader.millDesks) {
      expect(trading.results.some((row) => row.id === desk.upstreamOrderId)).toBe(false);
    }
  });

  test('D3 trader desk shows two mill cards; Send releases one shop only', async ({ page }) => {
    const placed = await placeCuratedABPack(page);
    expect(placed.downstream?.id).toBeTruthy();
    const parentId = placed.downstream!.id;

    await loginAsMeena(page);
    await page.goto(`/orders/${parentId}`);
    await expect(page.getByRole('button', { name: 'Send to Surat Silk House' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Send to Ahmedabad Loom Co' })).toBeVisible();

    // Qty / rate cells on each held mill card
    await expect(page.getByText('Qty', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Rate', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel(/Quantity for /).first()).toBeVisible();
    await expect(page.getByLabel(/Rate for /).first()).toBeVisible();

    await page.getByRole('button', { name: 'Send to Surat Silk House' }).click();
    await expect(page.getByText('Sent.').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Send to Surat Silk House' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Send to Ahmedabad Loom Co' })).toBeVisible();

    const traderToken = await accessTokenFromPage(page);
    const after = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    const desks = (
      (await after.json()) as {
        millDesks: Array<{ sellerName: string; held: boolean }>;
      }
    ).millDesks;
    expect(desks).toHaveLength(2);
    expect(desks.find((d) => d.sellerName === 'Surat Silk House')?.held).toBe(false);
    expect(desks.find((d) => d.sellerName === 'Ahmedabad Loom Co')?.held).toBe(true);
  });

  test('live mill-ticket flip is locked; I-handle parent stays Manage', async ({ page }) => {
    const placed = await placeCuratedABPack(page);
    expect(placed.downstream?.id).toBeTruthy();
    const parentId = placed.downstream!.id;

    await loginAsMeena(page);
    const traderToken = await accessTokenFromPage(page);
    const flip = await page.request.post(`${API_URL}/orders/${parentId}/ticket`, {
      headers: { authorization: `Bearer ${traderToken}` },
      data: { ticket: 'mill' },
    });
    expect(flip.ok()).toBeFalsy();

    await page.goto(`/orders/${parentId}`);
    await expect(page.getByTestId('order-ticket-pick')).toHaveCount(0);
    await expect(page.getByText('Buyer talks to')).toHaveCount(0);

    const asTrader = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    const traderView = (await asTrader.json()) as { tradeMode: string; status: string };
    expect(traderView.tradeMode).toBe('manage');
    expect(traderView.status).toBe('requested');
  });
});
