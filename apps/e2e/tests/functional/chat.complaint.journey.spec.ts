import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('chat complaint @functional @chat', () => {
  test('raise from + and list under thread Complaints + In chats', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');
    await expect(page.getByTestId('chat-attach')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('chat-attach').click();
    await page.getByTestId('attach-complaint').click();
    await expect(page.getByRole('heading', { name: 'Complaint' })).toBeVisible();
    const subject = `Late lot ${Date.now()}`;
    await page.getByTestId('complaint-subject').fill(subject);
    await page.getByTestId('complaint-send').click();
    await expect(page.getByText(subject)).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('thread-search-toggle').click();
    await page.getByTestId('thread-search-filter').click();
    await page.getByTestId('thread-search-filter-complaints').click();
    await expect(page.getByText(subject)).toBeVisible();

    await page.goto('/chats');
    await page.getByTestId('chats-search').click();
    await page.getByTestId('chats-find-complaints').click();
    await expect(page).toHaveURL(/kind=complaints/);
    await expect(page.getByText(subject)).toBeVisible({ timeout: 15_000 });
  });
});
