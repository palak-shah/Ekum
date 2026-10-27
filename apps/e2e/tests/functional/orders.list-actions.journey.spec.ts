import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder, getOrder, quoteOrder } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('orders list actions @functional @orders', () => {
  test('list has no Confirm / Accept / Decline; Needs you verbs; trader Accept & forward', async ({
    page,
  }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const placed = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [{ productId: 'seed-prod-1', quantity: 12 }],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const detailed = await getOrder(page.request, raviToken, placed.id);
    await quoteOrder(
      page.request,
      raviToken,
      placed.id,
      detailed.items.map((item) => ({
        orderItemId: item.id,
        rate: 120,
        quantity: item.quantity,
      })),
    );

    await page.goto('/orders');
    await expect(page.getByTestId('orders-tab-selling')).toHaveAttribute('aria-selected', 'true');

    const search = page.getByRole('searchbox', { name: 'Search orders and samples' });
    await search.fill('seed-order-handle-down');
    const trading = page.locator('[data-order-id="seed-order-handle-down"]');
    await expect(trading).toBeVisible({ timeout: 15_000 });
    await expect(trading.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
    await expect(trading.getByTestId('orders-row-primary')).toHaveCount(0);
    await expect(trading.getByTestId('orders-needs-you')).toHaveText(/Needs you Accept & forward/);
    await search.fill('');

    const sellerRow = page.locator(`[data-order-id="${placed.id}"]`);
    await expect(sellerRow.getByRole('button', { name: 'Confirm' })).toHaveCount(0);
    await expect(sellerRow.getByRole('button', { name: 'Decline' })).toHaveCount(0);
    await expect(sellerRow.getByTestId('orders-needs-you')).toHaveText('Needs you Confirm');
    await expect(page.getByTestId('orders-decline-sheet')).toHaveCount(0);

    await loginAsMeena(page);
    await page.goto('/orders');
    await page.getByTestId('orders-tab-buying').click();
    const buyerRow = page.locator(`[data-order-id="${placed.id}"]`);
    await expect(buyerRow.getByRole('button', { name: 'Accept' })).toHaveCount(0);
    await expect(buyerRow.getByRole('button', { name: 'Decline' })).toHaveCount(0);
    await expect(buyerRow.getByTestId('orders-needs-you')).toHaveText('Needs you Accept quote', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('trade-list-thumbs')).toHaveCount(0);
  });

  test('Pending and Completed chips follow the tab; empty copy matches the tab', async ({
    page,
  }) => {
    await loginAsMeena(page);
    await page.goto('/orders');
    await expect(page.getByTestId('trade-list-thumbs')).toHaveCount(0);

    const pendingSummary = page.getByTestId('orders-summary-pending');
    const sellingPending = Number((await pendingSummary.innerText()).match(/\d+/)?.[0] ?? '0');
    if (sellingPending === 0) {
      await expect(page.getByText('No pending orders yet')).toBeVisible();
      await expect(page.getByText('Orders from buyers will appear here.')).toBeVisible();
    } else {
      await expect(page.getByTestId('trade-list-row')).toHaveCount(sellingPending);
    }

    await page.getByTestId('orders-tab-buying').click();
    const buyingPending = Number((await pendingSummary.innerText()).match(/\d+/)?.[0] ?? '0');
    if (buyingPending === 0) {
      await expect(page.getByText('No pending orders yet')).toBeVisible();
      await expect(page.getByText('Orders you place will appear here.')).toBeVisible();
    } else {
      await expect(page.getByTestId('trade-list-row')).toHaveCount(buyingPending);
    }

    await page.getByTestId('orders-summary-completed').click();
    const buyingCompleted = Number(
      (await page.getByTestId('orders-summary-completed').innerText()).match(/\d+/)?.[0] ?? '0',
    );
    if (buyingCompleted === 0) {
      await expect(page.getByText('No completed orders yet')).toBeVisible();
      await expect(page.getByText('Orders you place will appear here.')).toBeVisible();
    } else {
      await expect(page.getByTestId('trade-list-row')).toHaveCount(buyingCompleted);
    }

    await page.getByTestId('orders-tab-others').click();
    await page.getByTestId('orders-summary-pending').click();
    const othersPending = Number((await pendingSummary.innerText()).match(/\d+/)?.[0] ?? '0');
    if (othersPending === 0) {
      await expect(page.getByText('Nothing here yet')).toBeVisible();
      await expect(page.getByText('Complaints and applicable samples will appear here.')).toBeVisible();
    }
  });
});
