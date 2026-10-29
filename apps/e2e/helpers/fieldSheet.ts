import { type Page } from '@playwright/test';

/**
 * Tap a closed OptionSheetField and pick a row.
 * `valueOrIndex`: option value (`mtr`), visible label, or 0-based row.
 */
export async function pickFieldSheetOption(
  page: Page,
  testId: string,
  valueOrIndex: string | number,
): Promise<void> {
  await page.getByTestId(testId).click();
  const sheet = page.locator('.ekum-sheet').last();
  await sheet.waitFor({ state: 'visible' });
  if (typeof valueOrIndex === 'number') {
    await page.locator(`[data-testid^="${testId}-option-"]`).nth(valueOrIndex).click();
    return;
  }
  const byValue = page.getByTestId(`${testId}-option-${valueOrIndex}`);
  if ((await byValue.count()) > 0) {
    await byValue.click();
    return;
  }
  await page
    .locator(`[data-testid^="${testId}-option-"]`)
    .filter({ hasText: valueOrIndex })
    .click();
}
