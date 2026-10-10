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
  await openYouLibraryFind(page);
  await page.getByTestId('you-library-filter').click();
  const id = which === 'Bookmark' ? 'saved' : which.toLowerCase();
  await page.getByTestId(`you-library-filter-${id}`).click();
}
