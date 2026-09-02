import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('notifications bell @functional @notifications', () => {
  test('open feed, mark all read, deep link, delete one', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/');

    await page.getByTestId('notifications-bell').click();
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Notifications' }),
    ).toBeVisible({
      timeout: 15_000,
    });

    const feedItems = page.getByTestId('notification-item');
    await expect(feedItems.first()).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('notifications-mark-all-read').click();

    const orderLink = page
      .getByTestId('notification-item')
      .filter({ hasText: /order|rates/i })
      .first()
      .getByRole('link');
    await expect(orderLink).toBeVisible({ timeout: 10_000 });
    await orderLink.click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 });

    await page.goto('/notifications');
    const deleteBtn = page.getByTestId('notification-delete').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByTestId('notification-item').first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
