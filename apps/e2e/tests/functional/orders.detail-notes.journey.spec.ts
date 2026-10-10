import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('order detail parties and notes @functional @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('parties, chat icon, ⋯ menus; no Your move', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/orders');
    const row = page.getByTestId('trade-list-row').first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 20_000 });

    await expect(page.getByText('Parties')).toHaveCount(0);
    await expect(page.getByText(/\(you\)/)).toHaveCount(0);
    await expect(page.getByText(/Your move:/i)).toHaveCount(0);
    await expect(
      page.getByText(/Purchase party|Selling party/).first(),
    ).toBeVisible();

    const chat = page.getByTestId('order-open-chat');
    if (await chat.isVisible().catch(() => false)) {
      await expect(chat).toHaveAttribute('aria-label', 'Open chat');
      await expect(chat).not.toHaveText(/Open chat/i);
    }

    await page.getByTestId('order-more-menu').click();
    await expect(page.getByTestId('order-manual-ref')).toBeVisible();
    await expect(page.getByTestId('order-personal-note')).toBeVisible();
    await expect(page.getByTestId('order-complaint')).toBeVisible();

    await page.getByTestId('order-manual-ref').click();
    await expect(page.getByRole('heading', { name: 'Manual order no.' })).toBeVisible();
    await page.getByTestId('order-manual-ref-number').fill(`PO-${Date.now()}`);
    await page.getByTestId('order-manual-ref-save').click();
    await expect(page.getByTestId('order-manual-ref-line')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('order-more-menu').click();
    await page.getByTestId('order-personal-note').click();
    await expect(page.getByRole('heading', { name: 'Personal note' })).toBeVisible();
    await page.getByRole('textbox').fill('Internal packing cue');
    await page.getByTestId('order-personal-note-save').click();
    await expect(page.getByTestId('order-personal-note-preview')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('order-personal-note-preview')).toContainText(
      'Internal packing cue',
    );
  });
});
