import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loginAsRavi } from '../../helpers/persona';

/**
 * Visual polish — Your selection → Order collections → How many each.
 * Run: EKUM_VISUAL=1 pnpm exec playwright test tests/visual/order-flow-sheets.visual.spec.ts
 */
const RUN = process.env.EKUM_VISUAL === '1';

async function seedSelection(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    sessionStorage.setItem(
      'ekum:browseAlbumPick',
      JSON.stringify([
        {
          collectionId: 'seed-col-1',
          name: 'Wedding Edit',
          coverImage: null,
          companyId: 'seed-company-kavita',
          companyName: 'Ahmedabad Loom Co',
          productCount: 3,
          allowForward: true,
        },
      ]),
    );
    sessionStorage.setItem(
      'ekum:browseShortlist',
      JSON.stringify([
        {
          productId: 'seed-prod-1',
          name: 'Design A',
          thumbUrl: null,
          companyId: 'seed-company-kavita',
          companyName: 'Ahmedabad Loom Co',
          allowForward: true,
        },
      ]),
    );
  });
}

async function captureFlow(
  page: import('@playwright/test').Page,
  outDir: string,
  size: { width: number; height: number },
) {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize(size);

  await loginAsRavi(page);
  await page.goto('/explore');
  await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
  await seedSelection(page);
  await page.goto('/selection');
  await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('selection-order')).toBeVisible();
  await page.screenshot({ path: join(outDir, '01-your-selection.png'), fullPage: true });

  await page.getByTestId('selection-order').click();
  await expect(page.getByRole('heading', { name: 'Order collections' })).toBeVisible();
  await expect(page.getByTestId('resolve-use-whole-pack')).toBeVisible();
  await expect(page.getByTestId('resolve-pick-designs')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, '02-order-collections.png'), fullPage: false });

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /design/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Place Order' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ask rates' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order for buyer' })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(outDir, '03-quantity-sheet.png'), fullPage: false });
}

(RUN ? test : test.skip)('order flow sheets 390×844 @smoke @regression', async ({ page }) => {
  await captureFlow(page, join(process.cwd(), 'test-results', 'order-flow-390x844'), {
    width: 390,
    height: 844,
  });
});

(RUN ? test : test.skip)('order flow sheets 375×812 @smoke @regression', async ({ page }) => {
  await captureFlow(page, join(process.cwd(), 'test-results', 'order-flow-375x812'), {
    width: 375,
    height: 812,
  });
});
