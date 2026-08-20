import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('chat journey @functional @chat', () => {
  test('send text and use in-thread search scopes + stepper', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    const marker = `func-chat-${Date.now()}`;
    await page.getByTestId('chat-composer').fill(marker);
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible();

    await page.getByTestId('thread-search-toggle').click();
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await page.getByRole('button', { name: 'Orders', exact: true }).click();
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await page.getByRole('button', { name: 'Media', exact: true }).click();
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByTestId('thread-search-input').fill(marker);
    await expect(page.getByTestId('thread-search-hit-count')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread-search-hit-count')).toHaveText(/1 of 1|of \d+/);
  });
});
