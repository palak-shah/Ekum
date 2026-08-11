import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { PHONES } from '../helpers/env';
import { createOrder } from '../helpers/orders';

test.describe('order card album @smoke @orders', () => {
  test('shows +N when designs exceed preview images', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    const tokensRaw = await page.evaluate(() => localStorage.getItem('ekum.tokens'));
    if (!tokensRaw) throw new Error('missing tokens');
    const { accessToken } = JSON.parse(tokensRaw) as { accessToken: string };
    const order = await createOrder(page.request, accessToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [
        { productId: 'seed-prod-1', quantity: 50 },
        { productId: 'seed-prod-2', quantity: 50 },
        { productId: 'seed-prod-no-image', quantity: 50 },
      ],
    });

    await page.goto(`/chats/${order.threadId}`);

    const orderCard = page.getByRole('button', { name: /Order #.*Requested/i }).last();
    await expect(orderCard.getByText(/3 designs/i)).toBeVisible();
    await expect(orderCard.getByTestId('photo-album-overflow')).toHaveText('+1');
  });
});
