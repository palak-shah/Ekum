import path from 'node:path';
import { test, expect } from '../helpers/pageDiagnostics';
import { loginAs } from '../helpers/auth';
import { PHONES } from '../helpers/env';
import { assertNoHorizontalOverflow, assertWithinViewport } from '../helpers/layout';

const fixture = path.join(process.cwd(), 'fixtures/sample.jpg');

/**
 * Narrow-phone regressions. Viewport shrink is a keyboard *approximation* only —
 * it does not reproduce iOS visualViewport, the accessory bar, or safe area.
 */
test.describe('mobile chrome @smoke @regression @mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('orders filter row does not overflow a narrow screen', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/orders');
    const filters = page.getByTestId('orders-list-filters');
    await expect(filters).toBeVisible({ timeout: 15_000 });
    await assertNoHorizontalOverflow(filters);
    await assertWithinViewport(page, page.getByTestId('app-bottom-nav'));
  });

  test('orders list shows an error instead of an empty desk when the API fails', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.route('**/api/v1/orders**', async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === 'GET' && /\/orders\/?$/.test(url.pathname)) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 500,
            code: 'INTERNAL',
            message: 'Could not load orders.',
            details: null,
          }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto('/orders');
    await expect(page.getByText('Could not load orders.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(page.getByText('No open orders')).toHaveCount(0);
    await assertWithinViewport(page, page.getByText('Could not load orders.'));
  });

  test('explore select dock stays on screen and clears the last card', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/explore');
    const media = page.locator('.ekum-long-press-surface').first();
    await expect(media).toBeVisible({ timeout: 15_000 });
    const mediaBox = await media.boundingBox();
    expect(mediaBox).toBeTruthy();
    await page.mouse.move(mediaBox!.x + mediaBox!.width / 2, mediaBox!.y + 24);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.up();

    const bar = page.getByTestId('selection-workspace-bar');
    await expect(bar).toBeVisible({ timeout: 10_000 });
    await assertWithinViewport(page, bar);

    await page.locator('main').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const barBox = await bar.boundingBox();
    expect(barBox).toBeTruthy();
    const surfaces = page.locator('.ekum-long-press-surface');
    const count = await surfaces.count();
    expect(count).toBeGreaterThan(0);
    let lowestBottom = -1;
    for (let i = 0; i < count; i += 1) {
      const box = await surfaces.nth(i).boundingBox();
      if (!box || box.height < 8) continue;
      if (box.y >= barBox!.y) continue;
      lowestBottom = Math.max(lowestBottom, box.y + box.height);
    }
    expect(lowestBottom, 'a card sits above the dock').toBeGreaterThan(0);
    expect(lowestBottom).toBeLessThanOrEqual(barBox!.y + 4);
  });

  test('chat composer stays in view; failed photo upload is recoverable', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/chats/seed-thread-1');
    const composer = page.getByTestId('chat-composer');
    await expect(composer).toBeVisible({ timeout: 15_000 });
    await composer.fill('hi');
    const send = page.getByTestId('chat-send');
    await expect(send).toBeVisible();
    await assertNoHorizontalOverflow(composer);
    await assertWithinViewport(page, send);

    await page.route('**/media/upload-url', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          code: 'UPLOAD_FAILED',
          message: 'Could not upload the photo. Try again.',
          details: null,
        }),
      });
    });
    await page.getByTestId('chat-photo-input').setInputFiles(fixture);
    await expect(page.getByText('Could not upload the photo. Try again.')).toBeVisible({
      timeout: 15_000,
    });
    await expect(composer).toBeVisible();
    await expect(composer).toBeEnabled();
    await assertWithinViewport(page, page.getByText('Could not upload the photo. Try again.'));
  });

  test('place-order error stays visible in the sheet', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/explore/products/seed-prod-1');
    await page.getByRole('button', { name: 'Order' }).click();
    const place = page.getByTestId('how-many-place-order');
    await expect(place).toBeVisible({ timeout: 15_000 });
    const qty = page.getByRole('textbox', { name: /^(sets|pieces) for/i });
    await qty.click();
    await qty.pressSequentially('12');
    await expect(place).toBeEnabled();

    await page.route('**/orders/batch', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          code: 'INTERNAL',
          message: 'Could not place the order.',
          details: null,
        }),
      });
    });
    await place.click();
    const alert = page.getByRole('alert').filter({ hasText: 'Could not place the order.' });
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await assertWithinViewport(page, alert);
    await assertWithinViewport(page, place);
  });

  test('shrinking the viewport keeps the composer and sheet action tappable', async ({ page }) => {
    // Approximates a keyboard covering the lower screen. Not a real IME.
    await loginAs(page, PHONES.meena);
    await page.goto('/chats/seed-thread-1');
    const composer = page.getByTestId('chat-composer');
    await expect(composer).toBeVisible({ timeout: 15_000 });
    await composer.fill('hi');
    await composer.focus();
    await page.setViewportSize({ width: 390, height: 480 });
    await assertWithinViewport(page, composer);
    await assertWithinViewport(page, page.getByTestId('chat-send'));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/explore/products/seed-prod-1');
    await page.getByRole('button', { name: 'Order' }).click();
    const qty = page.getByRole('textbox', { name: /^(sets|pieces) for/i });
    await expect(qty).toBeVisible({ timeout: 15_000 });
    await qty.focus();
    await page.setViewportSize({ width: 390, height: 520 });
    const placeOrder = page.getByTestId('how-many-place-order');
    await expect
      .poll(async () => {
        const viewport = page.viewportSize();
        const qtyBox = await qty.boundingBox();
        const placeBox = await placeOrder.boundingBox();
        if (!viewport || !qtyBox || !placeBox) return false;
        const qtyVisible =
          Math.min(qtyBox.y + qtyBox.height, viewport.height) - Math.max(qtyBox.y, 0);
        const placeInside =
          placeBox.y >= -1 && placeBox.y + placeBox.height <= viewport.height + 4;
        return qtyVisible >= 32 && placeInside;
      })
      .toBe(true);
  });
});
