import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
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
    await expect(page.getByRole('button', { name: 'Raise a return' })).toBeVisible();
    await expect(page.getByTestId('order-deliver')).toHaveCount(0);
  });
});
