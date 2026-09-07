import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('chat message actions @functional @chat', () => {
  test('edit, star, delete for me, starred chip, no Select all on forward', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    const marker = `msg-act-${Date.now()}`;
    await page.getByTestId('chat-composer').fill(marker);
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible();

    const bubble = page.locator('[data-message-id]').filter({ hasText: marker }).first();
    await bubble.getByTestId('message-actions').click();
    await expect(page.getByTestId('message-actions-menu')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Forward' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Copy' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();

    await page.getByRole('menuitem', { name: 'Star' }).click();
    await expect(page.getByTestId('message-actions-menu')).toBeHidden({ timeout: 10_000 });

    await bubble.getByTestId('message-actions').click();
    await expect(page.getByRole('menuitem', { name: 'Unstar' })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit message' })).toBeVisible();
    const edited = `${marker}-ed`;
    await page.locator('textarea').last().fill(edited);
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(edited)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Edited')).toBeVisible();

    await page.locator('[data-message-id]').filter({ hasText: edited }).first().getByTestId('message-actions').click();
    await page.getByRole('menuitem', { name: 'Select' }).click();
    await expect(page.getByTestId('thread-forward-dock')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select all' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByTestId('thread-search-toggle').click();
    await page.getByTestId('thread-search-filter').click();
    await page.getByTestId('thread-search-filter-starred').click();
    await expect(page.getByText(edited)).toBeVisible({ timeout: 10_000 });

    await page.goto('/starred');
    await expect(page.getByRole('heading', { name: 'Starred' })).toBeVisible();
    await expect(page.getByText(edited)).toBeVisible({ timeout: 10_000 });

    await page.goto('/chats/seed-thread-1');
    const editedBubble = page.locator('[data-message-id]').filter({ hasText: edited }).first();
    await editedBubble.getByTestId('message-actions').click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'Delete message?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete for me' }).click();
    await expect(page.getByText(edited)).toHaveCount(0);
  });

  test('forward text via menu opens recipient picker', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    const marker = `fwd-txt-${Date.now()}`;
    await page.getByTestId('chat-composer').fill(marker);
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible();

    const bubble = page.locator('[data-message-id]').filter({ hasText: marker }).first();
    await bubble.getByTestId('message-actions').click();
    await page.getByRole('menuitem', { name: 'Forward' }).click();
    await expect(page.getByRole('heading', { name: 'Forward to…' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
