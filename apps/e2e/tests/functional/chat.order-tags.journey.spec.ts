import { test, expect } from '@playwright/test';
import {
  accessTokenFromPage,
  dispatchOrder,
  getOrder,
  setupConfirmedOrder,
} from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('chat order tags @functional @chat @orders', () => {
  test('confirm and dispatch show Order # on actor bubbles, not center pills', async ({
    page,
  }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);

    const { id: orderId, threadId } = await setupConfirmedOrder(
      page.request,
      meenaToken,
      raviToken,
    );
    const orderHash = orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    const orderLabel = new RegExp(`Order #${orderHash}`, 'i');
    const thisOrderCard = page.getByTestId('chat-trade-card').filter({ hasText: orderLabel });
    const thisOrderTags = page.getByTestId('chat-order-tag').filter({ hasText: orderLabel });

    await loginAsMeena(page);
    await page.goto(`/chats/${threadId}`);

    await expect(thisOrderTags.first()).toBeVisible({ timeout: 15_000 });
    await expect(thisOrderTags.first().getByText('Reply')).toHaveCount(0);
    await expect(page.getByText(/You accepted quote/i).first()).toBeVisible();
    await expect(page.locator('[data-testid^="chat-system-notice-"]')).toHaveCount(0);
    await expect(thisOrderCard).toHaveCount(1);

    await thisOrderTags.last().click();
    await expect(page.locator('.ekum-msg-flash .ekum-msg-bubble').first()).toBeVisible();

    const detailed = await getOrder(page.request, raviToken, orderId);
    await dispatchOrder(page.request, raviToken, orderId, {
      items: detailed.items.map((item) => ({
        orderItemId: item.id,
        quantity: item.quantity,
      })),
      lrNumber: 'LR-TAG',
    });

    await page.reload();
    await expect(
      page.locator('.ekum-msg-bubble').filter({ has: thisOrderTags }).filter({ hasText: /dispatched/i }),
    ).toBeVisible({ timeout: 15_000 });
    expect(await thisOrderTags.count()).toBeGreaterThanOrEqual(2);
    await expect(thisOrderCard).toHaveCount(1);
    await expect(page.locator('[data-testid^="chat-system-notice-"]')).toHaveCount(0);
  });
});
