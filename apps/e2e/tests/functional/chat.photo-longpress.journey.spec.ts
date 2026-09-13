import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('chat photo long-press menu @functional @chat', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('long-press photo opens Ekum actions menu', async ({ page }) => {
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

    const photoBubble = page
      .locator('[data-message-id]')
      .filter({ has: page.locator('.ekum-msg-bubble img[src*="/media"]') })
      .last();

    await photoBubble.dispatchEvent('contextmenu');
    await expect(page.getByTestId('message-actions-menu')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('menuitem', { name: 'Reply' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Forward' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Star' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Select' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Save' })).toHaveCount(0);
  });
});
