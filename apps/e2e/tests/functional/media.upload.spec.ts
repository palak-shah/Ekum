import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('media upload @functional @media @creation', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('send chat photo — persists for sender and peer', async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    const before = await page.locator('.ekum-msg-bubble img[src*="/media"]').count();

    await page.getByRole('button', { name: 'Attach' }).click();
    await page.getByRole('button', { name: 'Photos' }).click();
    await page.getByTestId('chat-photo-input').setInputFiles(fixture);

    await expect
      .poll(async () => page.locator('.ekum-msg-bubble img[src*="/media"]').count(), {
        timeout: 45_000,
      })
      .toBeGreaterThan(before);

    const mediaImg = page.locator('.ekum-msg-bubble img[src*="/media"]').last();
    await expect(mediaImg).toBeVisible();
    const src = await mediaImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src!).not.toMatch(/^blob:/);
    expect(src!).not.toMatch(/seed\/banarasi/);

    const threadUrl = page.url();
    await loginAsRavi(page);
    await page.goto(threadUrl);
    await expect(page.locator(`.ekum-msg-bubble img[src="${src}"]`).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
