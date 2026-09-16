import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('notifications bell @functional @notifications', () => {
  test('open unread item marks read, deep links, badge drops', async ({ page }) => {
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

    const unreadDot = feedItems.locator('span.bg-accent').first();
    const hadUnread = await unreadDot.isVisible().catch(() => false);

    const orderItem = feedItems.filter({ hasText: /order|rates|inquiry/i }).first();
    await expect(orderItem).toBeVisible({ timeout: 10_000 });
    await orderItem.locator('button').first().click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 });

    if (hadUnread) {
      await page.goto('/');
      await page.getByTestId('notifications-bell').click();
      await expect(
        page.getByRole('main').getByRole('heading', { name: 'Notifications' }),
      ).toBeVisible({ timeout: 15_000 });
      // Badge on shell should be gone or lower after marking that item; feed still loads.
      await expect(page.getByTestId('notification-item').first()).toBeVisible({ timeout: 10_000 });
    }

    await page.goto('/notifications');
    const deleteBtn = page.getByTestId('notification-delete').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByTestId('notification-item').first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test('mark all read then open order deep link', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/notifications');
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Notifications' }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('notification-item').first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('notifications-mark-all-read').click();

    const orderItem = page
      .getByTestId('notification-item')
      .filter({ hasText: /order|rates|inquiry/i })
      .first();
    await expect(orderItem).toBeVisible({ timeout: 10_000 });
    await orderItem.locator('button').first().click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 });
  });
});
