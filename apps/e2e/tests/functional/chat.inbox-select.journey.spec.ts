import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('chat inbox select @functional @chat', () => {
  test('header ⋯ Select chats shows Archive Clear Delete for our shop only', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats');

    await page.getByTestId('chats-more').click();
    await page.getByTestId('chats-select').click();
    await expect(page.getByTestId('chats-select-cancel')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'All Chats' })).toHaveCount(0);

    const row = page.getByTestId(/chats-select-row-/).first();
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.getByTestId('chats-inbox-dock')).toBeVisible();
    await expect(page.getByTestId('chats-inbox-archive')).toBeVisible();
    await expect(page.getByTestId('chats-inbox-clear')).toBeVisible();
    await expect(page.getByTestId('chats-inbox-delete')).toBeVisible();

    await page.getByTestId('chats-select-cancel').click();
    await expect(page.getByTestId('chats-more')).toBeVisible();
    await expect(page.getByTestId('chats-inbox-dock')).toHaveCount(0);
  });

  test('long-press menu offers Archive Clear Delete on one chat', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats');
    const row = page.getByTestId(/chats-row-/).first();
    await expect(row).toBeVisible();
    await row.click({ button: 'right' });
    await expect(page.getByTestId('chats-row-menu')).toBeVisible();
    await expect(page.getByTestId('chats-row-archive')).toBeVisible();
    await expect(page.getByTestId('chats-row-clear')).toBeVisible();
    await expect(page.getByTestId('chats-row-delete')).toBeVisible();
    await expect(page.getByTestId('chats-row-pin')).toBeVisible();
    await expect(page.getByTestId('chats-row-mute')).toBeVisible();
  });

  test('header ⋯ opens Archived folder', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats');
    await page.getByTestId('chats-more').click();
    await page.getByTestId('chats-archived').click();
    await expect(page.getByRole('heading', { name: 'Archived' })).toBeVisible();
  });
});
