import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import { PHONES } from '../../helpers/env';

test.describe('chat jump to latest @functional @chat', () => {
  test('down arrow appears when scrolled up and returns to newest', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/chats/seed-thread-1');
    const list = page.getByTestId('thread-message-list');
    await expect(list).toBeVisible();
    await expect(page.getByTestId('thread-jump-latest')).toHaveCount(0);

    await list.evaluate((el) => {
      el.scrollTop = 0;
    });
    await expect(page.getByTestId('thread-jump-latest')).toBeVisible();

    await page.getByTestId('thread-jump-latest').click();
    await expect(page.getByTestId('thread-jump-latest')).toHaveCount(0);
    await expect
      .poll(async () =>
        list.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight < 96),
      )
      .toBe(true);
  });
});
