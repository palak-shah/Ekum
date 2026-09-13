import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

async function pickThreadSearchScope(page: import('@playwright/test').Page, scope: string) {
  await page.getByTestId('thread-search-filter').click();
  await page.getByTestId(`thread-search-filter-${scope}`).click();
}

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

    await pickThreadSearchScope(page, 'orders');
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await pickThreadSearchScope(page, 'photos');
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await pickThreadSearchScope(page, 'designs');
    await expect(page.getByTestId('thread-search-band')).toBeVisible();

    await pickThreadSearchScope(page, 'all');
    await page.getByTestId('thread-search-input').fill(marker);
    await expect(page.getByTestId('thread-search-hit-count')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('thread-search-hit-count')).toHaveText(/1 of 1|of \d+/);
  });

  test('attach design picker has search and multi-select send', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    await page.getByTestId('chat-attach').click();
    await expect(page.getByRole('heading', { name: 'Share in chat' })).toBeVisible();
    await expect(page.getByTestId('attach-camera')).toBeVisible();
    await expect(page.getByTestId('attach-photos')).toBeVisible();
    await expect(page.getByTestId('attach-camera')).toContainText('Camera');
    await expect(page.getByTestId('attach-photos')).toContainText('Photos');
    await page.getByTestId('attach-product').click();
    await expect(page.getByRole('heading', { name: 'Share a design' })).toBeVisible();

    await expect(page.getByTestId('attach-back')).toBeVisible();
    await expect(page.getByTestId('attach-back')).toHaveAttribute('aria-label', 'Back');
    await expect(page.getByTestId('attach-search')).toBeVisible();

    const rows = page.getByTestId('attach-design-row');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('attach-select-all')).toBeVisible();
    await expect(page.getByTestId('attach-select-all-action')).toHaveText('Select all');

    const count = await rows.count();
    await page.getByTestId('attach-select-all-action').click();
    await expect(page.getByTestId('attach-select-all-action')).toHaveText('Clear');
    await expect(page.getByRole('button', { name: new RegExp(`Send \\(${count}\\)`) })).toBeVisible();

    if (count >= 2) {
      await page.getByRole('button', { name: new RegExp(`Send \\(${count}\\)`) }).click();
      await expect(page.getByRole('heading', { name: 'Share a design' })).toBeHidden({
        timeout: 15_000,
      });
    } else if (count === 1) {
      await page.getByRole('button', { name: /Send \(1\)/ }).click();
      await expect(page.getByRole('heading', { name: 'Share a design' })).toBeHidden({
        timeout: 15_000,
      });
    }
  });

  test('owner more menu has mute and not Private', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-thread-1');

    await page.getByTestId('thread-more').click();
    await expect(page.getByTestId('thread-more-menu')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('thread-pin')).toBeVisible();
    await expect(page.getByTestId('thread-mute')).toBeVisible();
    await expect(page.getByTestId('thread-open-private')).toHaveCount(0);
    await expect(page.getByText('Private')).toHaveCount(0);
  });

  test('plus sheet is New chat without Private', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats');
    await page.getByRole('button', { name: 'New chat' }).click();
    await expect(page.getByRole('heading', { name: 'New chat' })).toBeVisible();
    await expect(page.getByText('Your team and one or more businesses')).toHaveCount(0);
    await expect(page.getByTestId('start-private-chat')).toHaveCount(0);
    await expect(page.getByTestId('start-team-chat')).toHaveCount(0);
  });
});
