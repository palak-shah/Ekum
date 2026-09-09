import { test, expect, type Page } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

/** Meena publishes A+B pack; Ravi places from-pack. Returns parent order id. */
async function placeCuratedABPack(page: Page): Promise<string> {
  const packName = `A+B pack ${Date.now()}`;

  await loginAsMeena(page);

  await page.goto('/collections/seed-col-1');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('button').filter({ has: page.locator('img') }).first().click({
    button: 'right',
  });
  await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });

  await page.goto('/collections/seed-col-fabric');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('button').filter({ has: page.locator('img') }).first().click({
    button: 'right',
  });
  await expect(page.getByTestId('selection-workspace-bar')).toContainText(/2 selected/i, {
    timeout: 10_000,
  });

  await page.getByTestId('selection-workspace-bar').click();
  await page.getByTestId('selection-curate').click();
  await expect(page.getByRole('heading', { name: 'Curate pack' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel('Name').fill(packName);
  await page.getByRole('button', { name: 'Publish to Collection' }).click();

  await expect(page).toHaveURL(/\/catalog\/collections\//, { timeout: 20_000 });
  const publishSheet = page.getByRole('dialog');
  await expect(publishSheet.getByRole('heading', { name: 'Publish collection' })).toBeVisible({
    timeout: 15_000,
  });
  await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
  const consent = publishSheet.getByText(/Start selling/i);
  if (await consent.isVisible()) {
    await publishSheet.locator('input[type="checkbox"]').last().check();
  }
  await publishSheet.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });

  const collectionId = page.url().match(/\/collections\/([^/?]+)/)?.[1];
  expect(collectionId).toBeTruthy();

  const meenaToken = await accessTokenFromPage(page);
  await resetTradeLanesToMe(page.request, meenaToken, 'seed-company-ravi');

  await loginAsRavi(page);
  await page.goto(`/collections/${collectionId}`);
  await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Order goes to Jaipur Emporium/i)).toBeVisible();

  await page.getByRole('button', { name: 'Order', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Place Order' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page).toHaveURL(/\/chats\//, { timeout: 20_000 });

  const raviToken = await accessTokenFromPage(page);
  const buyerList = await page.request.get(`${API_URL}/orders?limit=20`, {
    headers: { authorization: `Bearer ${raviToken}` },
  });
  expect(buyerList.ok()).toBeTruthy();
  const buyerOrders = (await buyerList.json()) as {
    results: Array<{ id: string; sellerCompanyId: string; buyerCompanyId: string }>;
  };
  const parent = buyerOrders.results.find(
    (row) =>
      row.sellerCompanyId === 'seed-company-meena' && row.buyerCompanyId === 'seed-company-ravi',
  );
  expect(parent).toBeTruthy();
  return parent!.id;
}

/**
 * D1 — from-pack place → one trader ticket + two mill desks (API).
 * D3 — trader desk shows two mill cards with qty/rate and Send per shop.
 */
test.describe('from-pack multi-supplier @functional @orders @trader', () => {
  test('D1 place curated A+B pack → one trader ticket + two mill desks', async ({ page }) => {
    const parentId = await placeCuratedABPack(page);

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
    const parentId = await placeCuratedABPack(page);

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

  test('D12 flip Mills → stay on main; buyer sees mill desks', async ({ page }) => {
    const parentId = await placeCuratedABPack(page);

    await loginAsMeena(page);
    await page.goto(`/orders/${parentId}`);
    await expect(page.getByText('This order is with')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-ticket-mill')).toContainText('Mills');
    await expect(page.getByTestId('order-ticket-mill-names')).toContainText('Surat Silk House');
    await expect(page.getByTestId('order-ticket-mill-names')).toContainText('Ahmedabad Loom Co');

    await page.getByTestId('order-ticket-mill').click();
    await expect(page.getByTestId('order-ticket-mill')).toBeDisabled({ timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`/orders/${parentId}$`));

    const traderToken = await accessTokenFromPage(page);
    const asTrader = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    expect(asTrader.ok()).toBeTruthy();
    const traderView = (await asTrader.json()) as {
      id: string;
      tradeMode: string;
      status: string;
      laneTicket?: string | null;
      millDesks: Array<{ sellerName: string }>;
    };
    expect(traderView.id).toBe(parentId);
    expect(traderView.tradeMode).toBe('manage');
    expect(traderView.status).toBe('requested');
    expect(traderView.laneTicket).toBe('mill');
    expect(traderView.millDesks).toHaveLength(2);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const asBuyer = await page.request.get(`${API_URL}/orders/${parentId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(asBuyer.ok()).toBeTruthy();
    const buyerView = (await asBuyer.json()) as {
      millDesks?: Array<{ sellerName: string }>;
    };
    expect(buyerView.millDesks?.length ?? 0).toBe(2);
    expect(buyerView.millDesks?.map((d) => d.sellerName).sort()).toEqual([
      'Ahmedabad Loom Co',
      'Surat Silk House',
    ]);
  });
});
