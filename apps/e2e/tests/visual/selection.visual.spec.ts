import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

test.describe('selection visual @visual', () => {
  test.skip(!process.env.EKUM_VISUAL, 'Set EKUM_VISUAL=1 to capture 390×844');

  test('Your selection at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsRavi(page);

    await page.goto('/explore');
    await page.waitForTimeout(800);

    // Seed a mixed pile via localStorage shortlist + album pick if Explore long-press is flaky.
    await page.evaluate(() => {
      const shortlist = [
        {
          productId: 'seed-prod-1',
          name: 'Organza Festive',
          companyId: 'seed-company-ravi',
          companyName: 'Surat Silk House',
          thumbUrl: null,
          allowForward: true,
        },
      ];
      const albums = [
        {
          collectionId: 'seed-col-1',
          name: 'Wedding Edit 2026',
          companyId: 'seed-company-ravi',
          companyName: 'Surat Silk House',
          coverImage: null,
          allowForward: true,
        },
      ];
      sessionStorage.setItem('ekum:browseShortlist', JSON.stringify(shortlist));
      sessionStorage.setItem('ekum:browseAlbumPick', JSON.stringify(albums));
    });

    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: 'test-results/selection-390x844/selection.png',
      fullPage: false,
    });
  });
});
