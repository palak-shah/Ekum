import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

/**
 * Explore no longer hosts Order·Curate·Bookmark·Share — Selection workspace does.
 * Keep this file as a thin redirect so old tags still discover the journey.
 */
test.describe('explore select dock @functional @explore', () => {
  test('selection floater opens Your selection with four actions', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

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
    });
    await page.reload();
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('selection-workspace-bar').getByRole('button').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible();
    await expect(page.getByTestId('selection-order')).toBeVisible();
    await expect(page.getByTestId('selection-curate')).toBeVisible();
    await expect(page.getByTestId('selection-bookmark')).toBeVisible();
    await expect(page.getByTestId('selection-share')).toBeVisible();
  });
});
