import { expect, type Page } from '@playwright/test';

/** Add new → name → Save (bookmark). Returns created collection id. */
export async function saveRepostDraft(page: Page, packName: string): Promise<string> {
  await page.getByTestId('repost-path-new').click();
  await page.getByLabel('Name').fill(packName);
  const createRespPromise = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST' || !res.ok()) return false;
    const path = new URL(res.url()).pathname;
    return /\/collections\/?$/.test(path);
  });
  await page.getByTestId('curate-save-draft').click();
  const createResp = await createRespPromise;
  const body = (await createResp.json()) as { id: string };
  expect(body.id).toBeTruthy();
  await expect(page).toHaveURL(/\/catalog\?tab=collections/, { timeout: 15_000 });
  await expect(page.getByText(/Collection draft saved/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(packName).first()).toBeVisible({ timeout: 15_000 });
  return body.id;
}

/** Add new → name → Publish → whom sheet → My Collections. Returns collection id. */
export async function publishRepostNew(page: Page, packName: string): Promise<string> {
  await page.getByTestId('repost-path-new').click();
  await page.getByLabel('Name').fill(packName);
  const createRespPromise = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST' || !res.ok()) return false;
    const path = new URL(res.url()).pathname;
    return /\/collections\/?$/.test(path);
  });
  await page.getByTestId('repost-publish').click();
  const createResp = await createRespPromise;
  const body = (await createResp.json()) as { id: string };
  expect(body.id).toBeTruthy();

  await expect(page).toHaveURL(/\/catalog\/collections\//, { timeout: 20_000 });
  const publishSheet = page.getByRole('dialog');
  await expect(publishSheet.getByRole('heading', { name: 'Publish collection' })).toBeVisible({
    timeout: 15_000,
  });
  await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
  const consent = publishSheet.getByText(/Start selling/i);
  if (await consent.isVisible()) {
    await publishSheet.locator('input[type="checkbox"]').last().check();
  }
  await publishSheet.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/catalog\?tab=collections/, { timeout: 15_000 });
  return body.id;
}

/** Open draft editor → ⋯ → Publish sheet → Everyone → Publish. */
export async function publishDraftCollection(page: Page, collectionId: string): Promise<void> {
  await page.goto(`/catalog/collections/${collectionId}`);
  await expect(page.getByRole('button', { name: 'More' })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'More' }).click();
  await page
    .getByTestId('collection-editor-more-sheet')
    .getByRole('menuitem', { name: 'Publish' })
    .click();
  const publishSheet = page.getByRole('dialog');
  await expect(publishSheet.getByRole('heading', { name: 'Publish collection' })).toBeVisible({
    timeout: 15_000,
  });
  await publishSheet.getByRole('button', { name: 'Everyone', exact: true }).click();
  const consent = publishSheet.getByText(/Start selling/i);
  if (await consent.isVisible()) {
    await publishSheet.locator('input[type="checkbox"]').last().check();
  }
  await publishSheet.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.getByText(/Published/i).first()).toBeVisible({ timeout: 20_000 });
}
