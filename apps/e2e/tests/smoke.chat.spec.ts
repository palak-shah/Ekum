import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { PHONES } from '../helpers/env';

test.describe('seed chat @smoke @regression @chat', () => {
  test('Meena opens seeded thread and can send text', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/chats/seed-thread-1');

    const composer = page.getByTestId('chat-composer');
    await composer.fill(`e2e-${Date.now()}`);
    const marker = await composer.inputValue();
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible();
  });
});
