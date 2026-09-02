import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  getOrder,
  setupConfirmedOrder,
} from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('order fulfillment @functional @orders', () => {
  test('confirmed → dispatch → deliver updates status', async ({ page }) => {
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
    await dispatchSheet.getByLabel('LR number').fill('LR-E2E-001');
    await dispatchSheet.getByTestId('order-dispatch-confirm').click();

    await expect(dispatchSheet).toBeHidden({ timeout: 15_000 });
    const afterDispatch = await getOrder(page.request, raviToken, orderId);
    expect(afterDispatch.status).toMatch(/dispatched/i);

    await loginAsMeena(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-deliver')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-deliver').click();

    await expect(page.getByText(/delivered/i).first()).toBeVisible({ timeout: 15_000 });
    const afterDeliver = await getOrder(page.request, await accessTokenFromPage(page), orderId);
    expect(afterDeliver.status).toMatch(/delivered/i);
  });
});
