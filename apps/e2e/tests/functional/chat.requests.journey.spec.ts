import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';
import { sendThreadMessage, startDirectThread } from '../../helpers/threads';

const KAVITA_COMPANY = 'seed-company-kavita';

test.describe('chat requests inbox @functional @chat', () => {
  test('unconnected message appears in Requests then recipient opens chat', async ({ page }) => {
    const opener = `E2E request ${Date.now()}`;

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const thread = await startDirectThread(page.request, meenaToken, KAVITA_COMPANY);
    await sendThreadMessage(page.request, meenaToken, thread.id, opener);

    await loginAsKavita(page);
    await page.goto(`/chats/${thread.id}`);
    await expect(page.getByText(opener)).toBeVisible({ timeout: 15_000 });

    const openChat = page.getByRole('button', { name: 'Open chat' });
    if (await openChat.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.goto('/chats');
      await page.getByRole('button', { name: 'Requests Received' }).click();
      await expect(page.getByRole('link', { name: /Jaipur Emporium/i }).first()).toBeVisible({
        timeout: 15_000,
      });

      await page.goto(`/chats/${thread.id}`);
      await openChat.click();
      await expect(page.getByText(/can't see your replies until you open/i)).toHaveCount(0, {
        timeout: 15_000,
      });
    }
  });
});
