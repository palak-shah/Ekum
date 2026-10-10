import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

/**
 * Explore selection dock: Add to cart · Message · Share + Order (right).
 * Message compose sends pile + note; stays on browse.
 */
test.describe('explore select dock @functional @explore', () => {
  test('selection dock shows Add to cart · Message · Share · Order; header opens Cart', async ({
    page,
  }) => {
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
    const actions = page.getByTestId('selection-workspace-actions');
    const addToCart = actions.getByTestId('selection-workspace-cart');
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toContainText('Add to cart');
    await expect(addToCart.locator('.rounded-full.bg-accent')).toHaveCount(0);
    await expect(actions.getByTestId('selection-workspace-message')).toBeVisible();
    await expect(actions.getByTestId('selection-workspace-share')).toBeVisible();
    await expect(actions.getByTestId('selection-workspace-order')).toBeVisible();
    await addToCart.click();
    await expect(page.getByTestId('selection-workspace-bar')).toBeHidden({ timeout: 5_000 });
    await page.getByTestId('explore-cart').click();
    await expect(page.getByRole('heading', { name: 'Cart' })).toBeVisible();
    await expect(page.getByTestId('selection-order')).toBeVisible();
    await expect(page.getByTestId('selection-curate')).toBeVisible();
    await expect(page.getByTestId('selection-bookmark')).toBeVisible();
    await expect(page.getByTestId('selection-share')).toBeVisible();
  });

  test('Message compose sends designs with a note and stays on Explore', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      sessionStorage.setItem(
        'ekum:browseShortlist',
        JSON.stringify([
          {
            productId: 'seed-prod-1',
            name: 'Banarasi Silk Saree',
            thumbUrl: null,
            companyId: 'seed-company-ravi',
            companyName: 'Surat Silks',
            allowForward: true,
          },
          {
            productId: 'seed-prod-2',
            name: 'Georgette Party Saree',
            thumbUrl: null,
            companyId: 'seed-company-ravi',
            companyName: 'Surat Silks',
            allowForward: true,
          },
        ]),
      );
      sessionStorage.removeItem('ekum:browseAlbumPick');
    });
    await page.reload();
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('selection-workspace-message').click();
    await expect(page.getByTestId('selection-message-sheet')).toBeVisible();
    await expect(page.getByPlaceholderText('What do you think of this?')).toBeVisible();
    await page.getByTestId('selection-message-text').fill('Rate for 50?');
    await page.getByTestId('selection-message-send').click();
    await expect(page.getByText(/Sent to/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/explore/);
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible();
    await expect(page.getByTestId('selection-workspace-cart')).toBeVisible();
  });
});
