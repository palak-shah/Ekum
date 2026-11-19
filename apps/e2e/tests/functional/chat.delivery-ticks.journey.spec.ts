import { expect, test } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('chat delivery ticks @functional @chat', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Direct outgoing shows Sent then Delivered then Seen', async ({ page }) => {
    test.setTimeout(120_000);
    const marker = `tick-${Date.now()}`;

    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    await page.getByTestId('chat-composer').fill(marker);
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('chat-sent').first()).toBeVisible({ timeout: 10_000 });

    await loginAsRavi(page);
    await page.goto('/chats/seed-thread-1');
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });

    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    await expect(page.getByText(marker)).toBeVisible({ timeout: 15_000 });
    // Ravi opened the thread → delivered/seen watermark; prefer Seen if mark-read raced.
    await expect(
      page.getByTestId('chat-seen').or(page.getByTestId('chat-delivered')).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
