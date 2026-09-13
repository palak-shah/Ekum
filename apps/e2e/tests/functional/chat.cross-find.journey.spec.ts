import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('chat cross-find @functional @chat', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Chats search Photos shortcut opens grid then thread', async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    await page.getByTestId('chat-attach').click();
    await page.getByTestId('attach-photos').click();
    const camera = page.getByTestId('continuous-camera');
    if (await camera.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await page.getByRole('button', { name: 'Gallery' }).click();
    }
    await page.getByTestId('chat-photo-input').setInputFiles(fixture);
    await expect
      .poll(async () => page.locator('.ekum-msg-bubble img[src*="/media"]').count(), {
        timeout: 45_000,
      })
      .toBeGreaterThan(0);

    await page.goto('/chats');
    await page.getByTestId('chats-search').click();
    await expect(page.getByTestId('chats-in-chats')).toBeVisible();
    await page.getByTestId('chats-find-photos').click();
    await expect(page).toHaveURL(/\/chats\/find\?kind=photos/);
    await expect(page.getByRole('button', { name: /Photos/ })).toBeVisible();
    await expect(page.getByTestId('chat-find-photo').first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('chat-find-photo').first().click();
    await expect(page).toHaveURL(/\/chats\/[^/]+\?message=/);
  });
});
