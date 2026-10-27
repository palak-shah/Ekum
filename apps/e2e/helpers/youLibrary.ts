import { expect, type Page } from '@playwright/test';

/** You Find field (search + filter square). */
export async function openYouLibraryFind(page: Page): Promise<void> {
  const field = page.getByTestId('you-library-search');
  if ((await field.count()) === 0) {
    await page.getByTestId('you-library-search-toggle').click();
  }
  await expect(field).toBeVisible();
}

export async function pickYouLibraryFilter(
  page: Page,
  which: 'Draft' | 'Archived' | 'Bookmark',
): Promise<void> {
  if (which === 'Bookmark') {
    await page.getByTestId('you-library-page-more').click();
    await page.getByTestId('you-library-page-bookmarks').click();
    return;
  }
  await openYouLibraryFind(page);
  const filter = page.getByTestId('you-library-filter');
  if ((await filter.count()) === 0) {
    if (which === 'Archived' || which === 'Draft') {
      await page.getByTestId('you-library-page-more').click();
      await page
        .getByTestId(which === 'Archived' ? 'you-library-page-archived' : 'you-library-page-drafts')
        .click();
      await expect(page.getByTestId('you-library-view-summary')).toBeVisible();
    }
    return;
  }
  await filter.click();
  await page.getByTestId(`you-library-filter-${which.toLowerCase()}`).click();
}
