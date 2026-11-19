import { expect, test } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

const PACK_ONLY =
  "These designs haven't been individually published for adding to other collections.";

test.describe('cart Repost zero toast @functional @explore', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('pack-only cart designs disable Repost and toast instead of empty sheet', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await loginAsMeena(page);

    await page.route('**/api/v1/collections/curate-check', async (route) => {
      const body = route.request().postDataJSON() as { productIds?: string[] };
      const ids = body.productIds ?? ['seed-prod-1'];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          allowedProductIds: [],
          blocked: ids.map((productId) => ({
            productId,
            code: 'NOT_DISCOVERABLE',
          })),
        }),
      });
    });

    await page.goto('/explore');
    await page.evaluate(() => {
      sessionStorage.setItem('ekum:browseCartAlbums', JSON.stringify([]));
      sessionStorage.setItem(
        'ekum:browseCartDesigns',
        JSON.stringify([
          {
            productId: 'seed-prod-1',
            name: 'Design A',
            thumbUrl: null,
            companyId: 'seed-company-ravi',
            companyName: 'Surat Silk House',
            allowForward: true,
          },
          {
            productId: 'seed-prod-2',
            name: 'Design B',
            thumbUrl: null,
            companyId: 'seed-company-ravi',
            companyName: 'Surat Silk House',
            allowForward: true,
          },
        ]),
      );
    });
    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible({ timeout: 15_000 });
    const repost = page.getByTestId('selection-curate');
    await expect(repost).toBeVisible();
    await expect(repost).toHaveAttribute('aria-disabled', 'true');
    // Soft-disabled keeps native enabled for toast; Playwright still honors aria-disabled.
    await repost.click({ force: true });
    await expect(page.getByText(PACK_ONLY)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Repost' })).toHaveCount(0);
  });
});
