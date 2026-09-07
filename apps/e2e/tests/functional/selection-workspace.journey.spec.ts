import { test, expect } from '@playwright/test';
import { loginAsRavi } from '../../helpers/persona';

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

test.describe('selection workspace @functional @explore', () => {
  test('floater and Your selection host Order resolve', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await seedSelection(page);
    await page.reload();
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('selection-workspace-bar').getByText('View')).toBeVisible();
    await expect(page.getByTestId('explore-selection')).toBeVisible();

    // Verbs are not on Explore — open Selection home.
    await page.getByTestId('selection-workspace-bar').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible();
    await expect(page.getByTestId('selection-order')).toBeVisible();
    await expect(page.getByTestId('selection-curate')).toBeVisible();
    await expect(page.getByTestId('selection-bookmark')).toBeVisible();
    await expect(page.getByTestId('selection-share')).toBeVisible();

    await page.getByTestId('selection-order').click();
    await expect(page.getByRole('heading', { name: 'Order collections' })).toBeVisible();
    await expect(page.getByText('All designs').first()).toBeVisible();
    await expect(page.getByText('Choose designs').first()).toBeVisible();
  });

  test('Curate on albums opens Use whole pack resolve', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
    await seedSelection(page);
    await page.reload();
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('selection-workspace-bar').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible();
    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Curate from collections' })).toBeVisible();
    await expect(page.getByText('Use whole pack').first()).toBeVisible();
    await expect(page.getByText('Pick designs').first()).toBeVisible();
  });

  test('Curate Pick designs shows Continue Curate on the album', async ({ page }) => {
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
      sessionStorage.removeItem('ekum:browseShortlist');
      sessionStorage.removeItem('ekum:resumeAfterAlbumPick');
    });
    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Curate from collections' })).toBeVisible();
    await page.getByTestId('resolve-pick-designs').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/collections\/seed-col-1/);
    await expect(page.getByTestId('album-pick-continue')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('album-pick-continue')).toContainText('Continue Curate');
  });

  test('pack-locked design stays visible with reason', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      sessionStorage.setItem(
        'ekum:browseShortlist',
        JSON.stringify([
          {
            productId: 'seed-prod-1',
            name: 'Locked design',
            thumbUrl: null,
            companyId: 'seed-company-kavita',
            companyName: 'Ahmedabad Loom Co',
            allowForward: false,
          },
        ]),
      );
      sessionStorage.removeItem('ekum:browseAlbumPick');
    });
    await page.goto('/selection');
    await expect(page.getByText('Locked design')).toBeVisible({ timeout: 15_000 });
    // Session allowForward:false drives pack-lock gray (separate from discovery unavailable).
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveText("Can't put in a pack", {
      timeout: 15_000,
    });
  });

  test('Clear selection empties the pile', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
    await seedSelection(page);
    await page.reload();
    await page.getByTestId('explore-selection').click();
    await expect(page.getByTestId('selection-clear')).toBeVisible();
    await page.getByTestId('selection-clear').click();
    await expect(page.getByText('Nothing selected')).toBeVisible();
  });

  test('Bookmark opens Saved instead of empty Selection', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
    await seedSelection(page);
    await page.goto('/selection');
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Checking availability…')).toHaveCount(0, { timeout: 15_000 });
    await page.getByTestId('selection-bookmark').click();
    await expect(page).toHaveURL(/\/saved/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Saved' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Nothing selected')).toHaveCount(0);
    await expect(page.getByTestId('app-toast')).toContainText(/bookmarked/i);
  });

  test('unavailable rows stay with a reason (never silent drop)', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      sessionStorage.setItem(
        'ekum:browseShortlist',
        JSON.stringify([
          {
            productId: 'missing-product-xyz',
            name: 'Gone design',
            thumbUrl: null,
            companyId: 'seed-company-kavita',
            companyName: 'Ahmedabad Loom Co',
            allowForward: true,
          },
        ]),
      );
    });
    await page.goto('/selection');
    await expect(page.getByText('Gone design')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('selection-unavailable-reason')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Gone design')).toBeVisible();
  });

  test('chip shows on Chats list and hides on an open thread', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await expect(page.getByTestId('explore-filter')).toBeVisible({ timeout: 15_000 });
    await seedSelection(page);
    await page.goto('/chats');
    await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({ timeout: 10_000 });

    // Open first thread if present; otherwise skip thread assertion.
    const threadLink = page.locator('a[href^="/chats/"]').first();
    if (await threadLink.count()) {
      await threadLink.click();
      await expect(page.getByTestId('selection-workspace-bar')).toHaveCount(0);
    }
  });

  test('My designs To selection handoff opens Your selection', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog');
    await expect(page.getByRole('button', { name: 'Designs' })).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      sessionStorage.removeItem('ekum:browseShortlist');
      sessionStorage.removeItem('ekum:browseAlbumPick');
    });

    const publishedChip = page.getByRole('button', { name: 'Published' });
    if (await publishedChip.isVisible()) {
      await publishedChip.click();
    }

    const gridTile = page.getByTestId('catalog-product-tile').first();
    await expect(gridTile).toBeVisible({ timeout: 15_000 });
    await gridTile.click({ button: 'right' });
    await expect(page.getByTestId('catalog-to-selection')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('catalog-to-selection').click();
    await expect(page.getByRole('heading', { name: 'Your selection' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/selection/);
  });

  test('My designs To selection toasts when only drafts are picked', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/catalog');
    await expect(page.getByRole('button', { name: 'Designs' })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Draft' }).click();
    const draftTile = page.getByTestId('catalog-product-tile').first();
    if ((await draftTile.count()) === 0) {
      test.skip(true, 'No draft designs in seed for this persona');
      return;
    }
    await expect(draftTile).toBeVisible({ timeout: 15_000 });
    await draftTile.click({ button: 'right' });
    await expect(page.getByTestId('catalog-to-selection')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('catalog-to-selection').click();
    await expect(page.getByTestId('app-toast')).toContainText(/Publish first|isn’t published/i);
    await expect(page).toHaveURL(/\/catalog/);
  });

  test('floater hidden on My designs catalog root', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/explore');
    await seedSelection(page);
    await page.goto('/catalog');
    await expect(page.getByRole('button', { name: 'Designs' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('selection-workspace-bar')).toHaveCount(0);
  });
});
