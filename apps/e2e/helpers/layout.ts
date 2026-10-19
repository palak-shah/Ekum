import { expect, type Locator, type Page } from '@playwright/test';

/** Horizontal overflow of a chrome row (filter rail, dock). 1px slack for subpixels. */
export async function assertNoHorizontalOverflow(locator: Locator) {
  await expect(locator).toBeVisible();
  const overflows = await locator.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
  expect(overflows, 'horizontal overflow').toBe(false);
}

/** Element is fully inside the current viewport (not sliced by the bottom or the side). */
export async function assertWithinViewport(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  expect(box, 'bounding box').toBeTruthy();
  expect(viewport, 'viewport').toBeTruthy();
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height + 4);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 4);
}

/**
 * Content bottom sits above sticky chrome (BM-07).
 * 4px slack matches the existing orders-list / selection-bar checks.
 */
export async function assertClearsChrome(content: Locator, chrome: Locator) {
  const box = await content.boundingBox();
  const chromeBox = await chrome.boundingBox();
  expect(box, 'content box').toBeTruthy();
  expect(chromeBox, 'chrome box').toBeTruthy();
  expect(box!.y + box!.height).toBeLessThanOrEqual(chromeBox!.y + 4);
}
