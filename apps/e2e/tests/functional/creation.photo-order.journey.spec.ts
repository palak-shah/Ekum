import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { SAMPLE_JPG } from '../../helpers/fixtures';

test.describe('photo order creation @functional @media @creation @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: false,
    hasTouch: false,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  test('send photo order with note — buyer and supplier see it', async ({ page }) => {
    test.setTimeout(180_000);
    const note = `Photo note ${Date.now()}`;

    await loginAsMeena(page);
    await page.goto('/orders/new');
    await expect(page.getByRole('heading', { name: 'Photo order' })).toBeVisible();

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(SAMPLE_JPG);
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').first()).toBeVisible({
      timeout: 45_000,
    });

    await page.getByRole('button', { name: 'Choose supplier' }).click();
    await expect(page.getByRole('heading', { name: 'Choose supplier' })).toBeVisible();
    await page.getByRole('button', { name: /Surat Silk House/ }).click();
    await expect(page.getByRole('heading', { name: 'Choose supplier' })).toBeHidden();
    await expect(page.getByText('Surat Silk House').first()).toBeVisible();

    await page.locator('textarea').first().fill(note);

    await expect(page.getByRole('button', { name: 'Send photo order' })).toBeEnabled({
      timeout: 45_000,
    });
    await page.getByRole('button', { name: 'Send photo order' }).click();
    await expect(page).not.toHaveURL(/\/orders\/new/, { timeout: 45_000 });
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 20_000 });

    const buyerUrl = page.url();

    await loginAsRavi(page);
    await page.goto(buyerUrl);
    await expect(page.getByText(note).first()).toBeVisible({ timeout: 30_000 });
  });

  test('send photo order without note — supplier can open', async ({ page }) => {
    test.setTimeout(180_000);
    const marker = `PO-nonote-${Date.now()}`;

    await loginAsMeena(page);
    await page.goto('/orders/new');

    await page.locator('input[type="file"][accept*="image"]').setInputFiles(SAMPLE_JPG);
    await expect(page.locator('img[src^="blob:"], img[src*="/media"]').first()).toBeVisible({
      timeout: 45_000,
    });

    await page.getByRole('button', { name: 'Choose supplier' }).click();
    await page.getByRole('button', { name: /Surat Silk House/ }).click();

    // Unique text so we can find this order on the supplier side.
    await page.locator('textarea').first().fill(marker);

    await expect(page.getByRole('button', { name: 'Send photo order' })).toBeEnabled({
      timeout: 45_000,
    });
    await page.getByRole('button', { name: 'Send photo order' }).click();
    await expect(page).not.toHaveURL(/\/orders\/new/, { timeout: 45_000 });
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 20_000 });

    const afterSend = page.url();
    await loginAsRavi(page);
    await page.goto(afterSend);
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 30_000 });
  });
});
