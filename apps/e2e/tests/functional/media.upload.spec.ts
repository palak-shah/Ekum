import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

test.describe('media upload @functional @media', () => {
  test('send chat photo and see image in thread', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    await page.getByRole('button', { name: 'Attach' }).click();
    await page.getByRole('button', { name: 'Photos' }).click();
    await page.getByTestId('chat-photo-input').setInputFiles(fixture);

    await expect(page.locator('img[src*="blob:"], img[src*="/media"], img[src*="http"]').last()).toBeVisible({
      timeout: 30_000,
    });
  });
});
