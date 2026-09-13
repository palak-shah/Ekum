import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const pdfFixture = path.join(process.cwd(), 'fixtures/sample.pdf');
const jpgFixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('chat document attach @functional @chat', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Document multi PDF + original photo as file cards', async ({ page }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    const before = await page.getByTestId('chat-document-card').count();

    await page.getByTestId('chat-attach').click();
    await page.getByTestId('attach-document').click();
    await page.getByTestId('chat-document-input').setInputFiles([pdfFixture, pdfFixture, jpgFixture]);

    await expect
      .poll(async () => page.getByTestId('chat-document-card').count(), {
        timeout: 60_000,
      })
      .toBeGreaterThanOrEqual(before + 3);

    const cards = page.getByTestId('chat-document-card');
    await expect(cards.last()).toBeVisible();
    await expect(cards.nth(before)).toContainText(/PDF|sample\.pdf/i);
  });
});
