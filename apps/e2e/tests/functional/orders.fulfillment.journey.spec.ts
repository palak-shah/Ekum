import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  dispatchOrder,
  editShipment,
  getOrder,
  setupConfirmedOrder,
} from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('order fulfillment @functional @orders', () => {
  test('confirmed → dispatch closes as dispatched (no Mark delivered)', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);

    const { id: orderId } = await setupConfirmedOrder(page.request, meenaToken, raviToken);

    await loginAsRavi(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-dispatch-open')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-action-dock')).toBeVisible();
    await expect(page.getByTestId('app-bottom-nav')).toBeHidden();
    const linePhoto = page.getByTestId('order-line-photo').first();
    if ((await linePhoto.getAttribute('data-empty')) !== 'true') {
      await linePhoto.click();
      await expect(page.getByTestId('photo-viewer')).toBeVisible();
      await expect(page).not.toHaveURL(/explore\/products/);
      await expect(page.getByTestId('photo-viewer-caption')).toBeVisible();
      await page.getByTestId('photo-viewer-close').click();
      await expect(page.getByTestId('photo-viewer')).toHaveCount(0);
    }
    await page.getByTestId('order-dispatch-open').click();

    const dispatchSheet = page.getByRole('dialog');
    await expect(dispatchSheet.getByRole('heading', { name: 'Dispatch' })).toBeVisible();
    await expect(dispatchSheet.getByTestId('order-line-photo').first()).toBeVisible();
    const lineName = dispatchSheet.getByTestId('order-dispatch-line-name').first();
    const lineQty = dispatchSheet.getByTestId('order-dispatch-line-qty').first();
    await expect(lineName).toBeVisible();
    const nameBox = await lineName.boundingBox();
    const qtyBox = await lineQty.boundingBox();
    expect(nameBox?.width ?? 0).toBeGreaterThan(80);
    expect(qtyBox?.width ?? 999).toBeLessThan(100);
    // LR optional — leave blank and confirm.
    await dispatchSheet.getByTestId('order-dispatch-confirm').click();

    await expect(dispatchSheet).toBeHidden({ timeout: 15_000 });
    const afterDispatch = await getOrder(page.request, raviToken, orderId);
    expect(afterDispatch.status).toMatch(/dispatched/i);

    // Happy path ends at full dispatch — buyer Mark delivered is retired.
    await loginAsMeena(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByText(/Dispatched · complete|Dispatched/).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('order-action-dock')).toHaveCount(0);
    await expect(page.getByTestId('app-bottom-nav')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raise a return' })).toHaveCount(0);
    await expect(page.getByTestId('order-deliver')).toHaveCount(0);
  });

  test('partial dispatch shows pending; Settle shows Dispatched and Pending', async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);

    const { id: orderId } = await setupConfirmedOrder(page.request, meenaToken, raviToken);
    const detailed = await getOrder(page.request, raviToken, orderId);
    const first = detailed.items[0];
    if (!first) throw new Error('expected order items');
    const half = Math.max(1, Math.floor(first.quantity / 2));

    await dispatchOrder(page.request, raviToken, orderId, {
      items: [{ orderItemId: first.id, quantity: half }],
    });

    await loginAsRavi(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('ship-progress-pending').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('ship-progress-pending').first()).toContainText(/pending/);
    await expect(page.getByTestId('ship-progress-hint').first()).toContainText(/dispatched/);
    await expect(page.getByTestId('ship-progress-hint').first()).not.toContainText(/shipped/);
    await expect(page.getByTestId('ship-progress-hint').first()).not.toContainText(/\bleft\b/);

    await page.getByTestId('order-settle-open').first().click();
    const settleSheet = page.getByRole('dialog');
    await expect(settleSheet.getByRole('heading', { name: 'Settle order' })).toBeVisible();
    await expect(settleSheet.getByTestId('settle-pending-summary')).toBeVisible();
    await expect(settleSheet.getByTestId('settle-qty-columns').first()).toBeVisible();
    await expect(settleSheet.getByTestId('settle-line-pending').first()).toBeVisible();
    await expect(settleSheet.getByText('Dispatched').first()).toBeVisible();
    await expect(settleSheet.getByText('Pending').first()).toBeVisible();
    await expect(settleSheet.getByTestId('settle-qty-pending').first()).toBeVisible();
  });

  test('dispatch more shows prior LR; edit pulses Dispatch edited', async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);

    const { id: orderId } = await setupConfirmedOrder(page.request, meenaToken, raviToken);
    const detailed = await getOrder(page.request, raviToken, orderId);
    const first = detailed.items[0];
    if (!first) throw new Error('expected order items');
    const half = Math.max(1, Math.floor(first.quantity / 2));

    await dispatchOrder(page.request, raviToken, orderId, {
      lrNumber: 'LR-EDIT-1',
      items: [{ orderItemId: first.id, quantity: half }],
    });

    await loginAsRavi(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-timeline')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-timeline-more')).toBeVisible();
    await page.getByTestId('order-dispatch-open').click();
    const dispatchSheet = page.getByRole('dialog');
    await expect(dispatchSheet.getByTestId('order-dispatch-prior')).toBeVisible();
    await expect(dispatchSheet.getByTestId('order-dispatch-prior-edit').first()).toBeVisible();
    await dispatchSheet.getByTestId('order-dispatch-prior-edit').first().click();
    await expect(dispatchSheet.getByRole('heading', { name: 'Edit dispatch' })).toBeVisible();
    await dispatchSheet.getByTestId('order-dispatch-confirm').click();
    await expect(dispatchSheet).toBeHidden({ timeout: 15_000 });

    const after = await getOrder(page.request, raviToken, orderId);
    const shipmentId = after.shipments?.[0]?.id;
    if (!shipmentId) throw new Error('expected shipment');
    await editShipment(page.request, raviToken, orderId, shipmentId, {
      lrNumber: 'LR-EDIT-2',
      items: [{ orderItemId: first.id, quantity: Math.max(1, half - 1) }],
    });

    await loginAsMeena(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-timeline')).toContainText(/Dispatch edited/i, {
      timeout: 15_000,
    });
  });

  test('order ⋯ Complaint opens against pick or chat sheet', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const { id: orderId } = await setupConfirmedOrder(page.request, meenaToken, raviToken);

    await loginAsMeena(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-more-menu')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-more-menu').click();
    await page.getByTestId('order-complaint').click();
    await expect(
      page.getByRole('heading', { name: /Complaint|Complaint about/ }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
