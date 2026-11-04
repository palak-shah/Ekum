import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('I-handle desk @functional @orders', () => {
  test('trader list is the buyer ticket; Send lives on that page', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 20 }],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const listRes = await page.request.get(`${API_URL}/orders?limit=50`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      results: Array<{
        id: string;
        linkedMills?: Array<{ name: string; orderId: string | null }>;
      }>;
    };
    expect(list.results.some((row) => row.id === created.id)).toBe(true);
    const parentRow = list.results.find((row) => row.id === created.id);
    expect(parentRow?.linkedMills?.length).toBeGreaterThan(0);
    expect(parentRow?.linkedMills?.[0]?.name).toBeTruthy();
    const detail = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const view = (await detail.json()) as {
      millDesks: Array<{ upstreamOrderId: string; sellerName: string; held: boolean }>;
    };
    expect(view.millDesks.length).toBeGreaterThan(0);
    expect(list.results.some((row) => row.id === view.millDesks[0]?.upstreamOrderId)).toBe(false);

    const tradingList = await page.request.get(
      `${API_URL}/orders?limit=50&tradeMode=manage&direction=selling`,
      { headers: { authorization: `Bearer ${raviToken}` } },
    );
    const tradingRows = (await tradingList.json()) as { results: Array<{ id: string; tradeMode: string }> };
    expect(tradingRows.results.some((row) => row.id === created.id)).toBe(true);
    expect(tradingRows.results.every((row) => row.tradeMode === 'manage')).toBe(true);

    await page.goto('/orders');
    await expect(page.locator(`a[href="/orders/${created.id}"]`)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('trade-list-path-handle').first()).toBeVisible();

    await page.goto(`/orders/${created.id}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: /Send to / })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid^="order-mill-decline-"]')).toBeVisible();
    const heldLines = page.getByTestId('order-mill-held-lines');
    await expect(heldLines).toBeVisible();
    const heldLine = page.getByTestId('order-mill-held-line').first();
    await expect(heldLine).toBeVisible();
    await expect(heldLines.locator('p', { hasText: /^Design$/ })).toHaveCount(0);
    const fieldLabels = heldLines.getByTestId('order-mill-held-field-labels');
    await expect(fieldLabels.getByText('Qty', { exact: true })).toBeVisible();
    await expect(fieldLabels.getByText('Rate', { exact: true })).toBeVisible();
    await expect(heldLine.getByTestId('order-line-identity')).toContainText(/^per /);
    const heldQty = heldLine.locator('[data-testid^="order-mill-held-qty-"]');
    const heldRate = heldLine.locator('[data-testid^="order-mill-held-rate-"]');
    await expect(heldQty).toBeVisible();
    await expect(heldRate).toBeVisible();
    await expect(heldQty).toHaveClass(/w-12/);
    await expect(heldRate).toHaveClass(/w-16/);
    const heldMillId = view.millDesks[0]?.upstreamOrderId;
    expect(heldMillId).toBeTruthy();
    await page.goto(`/orders/${heldMillId}`);
    await expect(page).toHaveURL(new RegExp(`/orders/${created.id}`));
    await expect(page.getByRole('button', { name: /Send to / })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Send to / }).click();
    await expect(page.getByText('Sent.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Send to / })).toHaveCount(0);

    const after = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    const sent = (await after.json()) as {
      millDesks: Array<{ upstreamOrderId: string; sellerName: string }>;
    };
    const millId = sent.millDesks[0]?.upstreamOrderId;
    expect(millId).toBeTruthy();
    const findRes = await page.request.get(
      `${API_URL}/orders?limit=50&q=${encodeURIComponent(millId!)}`,
      { headers: { authorization: `Bearer ${raviToken}` } },
    );
    const found = (await findRes.json()) as { results: Array<{ id: string }> };
    expect(found.results.some((row) => row.id === created.id)).toBe(true);
    expect(found.results.some((row) => row.id === millId)).toBe(false);

    const millRes = await page.request.get(`${API_URL}/orders/${millId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(millRes.ok()).toBeTruthy();
    const millHop = (await millRes.json()) as {
      deskOrderId?: string | null;
      direction?: string;
      passHeld?: boolean;
      relatedOrders?: Array<{ role: string; buyerName: string | null }>;
    };
    expect(millHop.deskOrderId ?? null).toBeNull();
    expect(millHop.direction).toBe('buying');
    expect(millHop.passHeld).toBe(false);
    expect(millHop.relatedOrders?.some((row) => row.role === 'downstream' && row.buyerName)).toBe(
      true,
    );

    await page.goto(`/orders/${created.id}`);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('order-trade-summary')).toContainText(/Supplier → /);
    await expect(page.getByTestId('order-trade-summary')).not.toContainText(/godown/i);
    const millHopLink = page.getByTestId(`order-mill-hop-link-${millId}`);
    await expect(millHopLink).toBeVisible({ timeout: 15_000 });
    await expect(millHopLink).toContainText(/Buying #/);
    await expect(millHopLink).toContainText(/waiting to accept/i);
    await expect(millHopLink).not.toContainText(/Order #/);
    await expect(millHopLink).not.toContainText(/for rates/i);
    await expect(page.getByTestId('order-mill-line-progress').first()).toBeVisible();
    await expect(page.getByTestId('order-action-dock').getByTestId('order-ticket-waiting')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByTestId('order-action-dock').getByTestId('order-ticket-waiting'),
    ).toContainText(/Waiting on .+/);
    await expect(page.getByTestId('order-ticket-waiting')).toHaveCount(1);
    await expect(page.getByTestId('order-dispatch-open')).toHaveCount(0);
    await expect(page.getByTestId('order-open-chat')).toBeVisible();
    await expect(page.getByTestId('order-notes-audience')).toContainText('You and the buyer');
    await expect(page.getByTestId('order-parent-items')).toHaveCount(0);
    await expect(page.getByTestId('order-you-items')).toHaveCount(0);
    await expect(page.getByTestId('order-mill-hold')).toHaveCount(0);
    await millHopLink.click();
    await expect(page).toHaveURL(new RegExp(`/orders/${millId}$`));
    const hop = page.getByTestId('order-trader-selling-hop');
    await expect(hop).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`/orders/${millId}$`));
    await expect(page.getByText('Supplier', { exact: true })).toBeVisible();
    await expect(hop).toContainText('your selling order');
    await expect(hop).toContainText('Dispatch goes straight to');
    await expect(page.getByTestId('order-action-dock').getByTestId('order-ticket-waiting')).toContainText(
      /Waiting for .+ to accept/,
    );
    await expect(page.getByTestId('order-open-chat')).toBeVisible();
    await expect(page.getByTestId('order-dock-cancel')).toHaveCount(0);
    await expect(page.getByTestId('order-dock-accept-quote')).toHaveCount(0);
    await page.getByTestId('order-more-menu').click();
    await expect(page.getByTestId('order-more-sheet')).toBeVisible();
    await expect(page.getByTestId('order-mill-hop-cancel')).toBeVisible();
    await page.getByTestId('order-mill-hold').click();
    await expect(page.getByText('Pass-through held')).toBeVisible({ timeout: 10_000 });
    const heldRes = await page.request.get(`${API_URL}/orders/${millId}`, {
      headers: { authorization: `Bearer ${raviToken}` },
    });
    expect(((await heldRes.json()) as { passHeld?: boolean }).passHeld).toBe(true);

    await page.goto(`/orders/${created.id}`);
    await expect(page.getByTestId(`order-mill-hop-link-${millId}`)).toContainText(/Held/i, {
      timeout: 10_000,
    });

    await page.goto(`/orders/${millId}`);
    await page.getByTestId('order-more-menu').click();
    await page.getByTestId('order-mill-resume').click();
    await expect(page.getByText('Pass-through resumed')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('order-trader-selling-hop').click();
    await expect(page).toHaveURL(new RegExp(`/orders/${created.id}$`));
  });
});
