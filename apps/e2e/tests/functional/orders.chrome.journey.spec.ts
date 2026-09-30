import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('orders chrome @functional @orders', () => {
  test('Pending and Completed tabs; no loader flash on switch', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders');

    await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Completed' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Needs you' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'In progress' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Completed' }).click();
    await expect(page).toHaveURL(/filter=completed/, { timeout: 10_000 });
    await expect(page.getByText('Loading…')).toHaveCount(0);

    await page.getByRole('button', { name: 'Pending' }).click();
    await expect(page).toHaveURL(/filter=pending/, { timeout: 10_000 });
    await expect(page.getByText('Loading…')).toHaveCount(0);
  });

  test('Buy/Sell is a temporary filter on one row; All after leaving Orders', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMeena(page);
    await page.goto('/orders');

    const filters = page.getByTestId('orders-list-filters');
    await expect(filters.getByRole('button', { name: 'Pending' })).toBeVisible();
    const all = page.getByTestId('orders-direction-all');
    if ((await all.count()) === 0) return;

    await expect(all).toBeVisible();
    const box = await filters.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeLessThan(48);
    const noOverflow = await filters.evaluate(
      (el) => el.scrollWidth <= el.clientWidth + 1,
    );
    expect(noOverflow).toBe(true);

    await page.getByTestId('orders-direction-buying').click();
    const first = page.locator('a[href^="/orders/"]').first();
    if ((await first.count()) === 0) return;
    await first.click();
    await expect(page).toHaveURL(/\/orders\/[^/?]+/, { timeout: 10_000 });
    await page.goBack();
    await expect(page.getByTestId('orders-direction-buying')).toBeVisible();
    await expect(page).toHaveURL(/\/orders/, { timeout: 10_000 });

    await page.getByRole('link', { name: 'Home' }).click();
    await page.goto('/orders');
    await expect(page.getByTestId('orders-direction-all')).toBeVisible();
  });

  test('How many each uses editable qty stepper', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore/products/seed-prod-1');
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('ekum:qty-each:')) localStorage.removeItem(key);
      }
    });
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('how-many-share')).toBeVisible();
    await expect(page.getByTestId('how-many-facts')).toContainText('Piece');
    const qty = page.getByRole('group', { name: /Pieces for/i }).getByRole('textbox');
    await expect(qty).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    await qty.click();
    await qty.pressSequentially('15');
    await expect(qty).toHaveValue('15');
    await expect(page.getByRole('button', { name: 'Place Order' })).toBeEnabled();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('group', { name: /Pieces for/i }).getByRole('textbox'),
    ).toHaveValue('15');
  });

  test('filter status list follows Pending and has no extra statuses', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders');

    await page.getByTestId('orders-filter').click();
    await page.getByTestId('orders-filter-open-status').click();
    await expect(page.getByTestId('orders-filter-status-requested')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-confirmed')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-part_shipped')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-dispatched')).toHaveCount(0);
    await expect(page.getByTestId('orders-filter-status-received')).toHaveCount(0);
    await expect(page.getByTestId('orders-filter-status-approved')).toHaveCount(0);
    await expect(page.getByTestId('orders-filter-status-declined')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('orders-filter-menu')).toHaveCount(0);

    await page.getByRole('button', { name: 'Completed' }).click();
    await page.getByTestId('orders-filter').click();
    await page.getByTestId('orders-filter-open-status').click();
    await expect(page.getByTestId('orders-filter-status-dispatched')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-settled')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-cancelled')).toBeVisible();
    await expect(page.getByTestId('orders-filter-status-requested')).toHaveCount(0);
    await expect(page.getByTestId('orders-filter-status-received')).toHaveCount(0);
  });

  test('filter menu selects type and dismisses on Escape', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/orders');

    await page.getByTestId('orders-filter').click();
    await expect(page.getByTestId('orders-filter-menu')).toBeVisible();

    await page.getByTestId('orders-filter-open-type').click();
    await expect(page.getByTestId('orders-filter-type-trading')).toHaveCount(0);
    await expect(page.getByTestId('orders-filter-type-return')).toHaveCount(0);
    await page.getByTestId('orders-filter-type-sample').click();

    await expect(page).toHaveURL(/kind=sample/, { timeout: 10_000 });
    await expect(page.getByText(/Sample/i).first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('orders-filter-menu')).toHaveCount(0);
  });

  test('Samples shortcut redirects to filtered orders list', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/samples');
    await expect(page).toHaveURL(/\/orders\?kind=sample/, { timeout: 10_000 });
  });

  test('Returns shortcut opens Orders', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/returns');
    await expect(page).toHaveURL(/\/orders(?:\?|$)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/kind=return/);
  });

  test('seller dock Confirm sits between Decline and Send quote', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMeena(page);
    const buyerToken = await accessTokenFromPage(page);
    const order = await createOrder(page.request, buyerToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [{ productId: 'seed-prod-1', quantity: 20 }],
    });

    await loginAsRavi(page);
    await page.goto(`/orders/${order.id}`);
    const dock = page.getByTestId('order-action-dock');
    await expect(dock).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Confirm all open' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Confirm / decline lines' })).toHaveCount(0);

    const decline = dock.getByTestId('order-dock-decline');
    const confirm = dock.getByTestId('order-dock-confirm');
    const quote = dock.getByTestId('order-send-quote');
    await expect(decline).toBeVisible();
    await expect(confirm).toBeVisible();
    await expect(quote).toBeVisible();
    const declineBox = await decline.boundingBox();
    const confirmBox = await confirm.boundingBox();
    const quoteBox = await quote.boundingBox();
    expect(declineBox && confirmBox && quoteBox).toBeTruthy();
    expect(declineBox!.x).toBeLessThan(confirmBox!.x);
    expect(confirmBox!.x).toBeLessThan(quoteBox!.x);

    await confirm.click();
    await expect(page.getByRole('heading', { name: 'Confirm / decline lines' })).toBeVisible();
    const sheet = page.getByRole('dialog');
    const sheetConfirm = sheet.getByTestId('order-lines-confirm');
    const sheetDecline = sheet.getByTestId('order-lines-decline');
    await expect(sheetConfirm).toBeVisible();
    await expect(sheetDecline).toBeVisible();
    const sheetConfirmBox = await sheetConfirm.boundingBox();
    const sheetDeclineBox = await sheetDecline.boundingBox();
    expect(sheetConfirmBox && sheetDeclineBox).toBeTruthy();
    expect(sheetDeclineBox!.x).toBeLessThan(sheetConfirmBox!.x);
  });

  test('buyer dock sticks Cancel and Edit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMeena(page);
    const buyerToken = await accessTokenFromPage(page);
    const order = await createOrder(page.request, buyerToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [{ productId: 'seed-prod-1', quantity: 20 }],
    });
    await page.goto(`/orders/${order.id}`);
    const dock = page.getByTestId('order-action-dock');
    await expect(dock).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    await expect(dock.getByTestId('order-dock-cancel')).toBeVisible();
    await expect(dock.getByTestId('order-dock-edit')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit order' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cancel order' })).toHaveCount(0);
    await expect(page.getByText(/standard/i)).toHaveCount(0);
    await expect(page.getByTestId('order-ticket-help')).toHaveCount(0);
  });

  test('list row opens the ticket; Needs you preview when seller must act', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMeena(page);
    const buyerToken = await accessTokenFromPage(page);
    const order = await createOrder(page.request, buyerToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [{ productId: 'seed-prod-1', quantity: 20 }],
    });

    await loginAsRavi(page);
    await page.goto('/orders');
    const row = page.locator(`a[data-testid="trade-list-row"][href="/orders/${order.id}"]`);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByTestId('orders-needs-you')).toBeVisible();
    await expect(row.getByTestId('trade-list-facts')).toContainText(/Order #/);
    await expect(row.getByTestId('trade-list-facts')).toContainText(/1 design/);
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/orders/${order.id}`), { timeout: 10_000 });
  });

  test('last list row clears the nav', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsMeena(page);
    await page.goto('/orders');
    const rows = page.locator('a[href^="/orders/"]');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    const last = rows.last();
    await last.scrollIntoViewIfNeeded();
    const lastBox = await last.boundingBox();
    const nav = page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Orders' }) });
    const navBox = await nav.boundingBox();
    expect(lastBox).toBeTruthy();
    expect(navBox).toBeTruthy();
    expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(navBox!.y + 4);
  });
});
