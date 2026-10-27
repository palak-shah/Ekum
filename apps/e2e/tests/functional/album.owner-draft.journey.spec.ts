import { expect, test, type APIRequestContext } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { pickYouLibraryFilter } from '../../helpers/youLibrary';

async function createPublishedDesign(
  request: APIRequestContext,
  auth: { authorization: string },
  name: string,
): Promise<{ id: string }> {
  const created = await request.post(`${API_URL}/products`, {
    headers: auth,
    data: { name, categories: [], images: [] },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const product = (await created.json()) as { id: string };
  const published = await request.post(`${API_URL}/products/${product.id}/publish`, {
    headers: auth,
    data: {
      audience: 'everyone',
      rateVisibility: 'on_request',
      allowForward: true,
      consentToSell: true,
    },
  });
  expect(published.ok(), await published.text()).toBeTruthy();
  return product;
}

async function createPack(
  request: APIRequestContext,
  auth: { authorization: string },
  name: string,
  productIds: string[],
  publish: boolean,
): Promise<{ id: string }> {
  const created = await request.post(`${API_URL}/collections`, {
    headers: auth,
    data: { name },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const pack = (await created.json()) as { id: string };
  const members = await request.put(`${API_URL}/collections/${pack.id}/products`, {
    headers: auth,
    data: { productIds },
  });
  expect(members.ok(), await members.text()).toBeTruthy();
  if (publish) {
    const live = await request.post(`${API_URL}/collections/${pack.id}/publish`, {
      headers: auth,
      data: {
        audience: 'everyone',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(live.ok(), await live.text()).toBeTruthy();
  }
  return pack;
}

test.describe('owner album draft members @functional @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('album select Draft chips the design; buyer does not see it', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `Album draft ${Date.now()}`;
    const packName = `Live pack ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };
    const product = await createPublishedDesign(request, auth, designName);
    const pack = await createPack(request, auth, packName, [product.id], true);

    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('collection-design-draft-chip')).toHaveCount(0);
    await page.getByTestId('collection-select').click();
    await page.getByTestId('select-all-float-select-all').click();
    await page.getByTestId('collection-more').click();
    await expect(page.getByTestId('collection-select-draft')).toHaveText('Draft');
    await page.getByTestId('collection-select-draft').click();
    await expect(page.getByText(/Draft 1/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('collection-design-draft-chip')).toBeVisible();
    await expect(page.getByText(designName).first()).toBeVisible();

    await loginAsMeena(page);
    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(designName)).toHaveCount(0);
    await expect(page.getByTestId('collection-design-draft-chip')).toHaveCount(0);

    await loginAsRavi(page);
    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByTestId('collection-design-draft-chip')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-select').click();
    await page.getByTestId('select-all-float-select-all').click();
    await page.getByTestId('collection-more').click();
    await expect(page.getByTestId('collection-select-publish')).toHaveText('Publish');
    await page.getByTestId('collection-select-publish').click();
    await expect(page.getByRole('heading', { name: 'Publish 1 design' })).toHaveCount(0);
    await expect(page.getByText(/Published 1/).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('collection-design-draft-chip')).toHaveCount(0);

    await loginAsMeena(page);
    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });

  test('published design in a draft pack stays on You Designs', async ({ page, request }) => {
    test.setTimeout(120_000);
    const designName = `Live in draft pack ${Date.now()}`;
    const packName = `Quiet pack ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };
    const product = await createPublishedDesign(request, auth, designName);
    await createPack(request, auth, packName, [product.id], false);

    await page.goto('/more?tab=products');
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('catalog-product-draft-chip')).toHaveCount(0);
  });

  test('album ⋯ Draft this collection', async ({ page, request }) => {
    test.setTimeout(120_000);
    const designName = `Pack draft ${Date.now()}`;
    const packName = `Hide this pack ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };
    const product = await createPublishedDesign(request, auth, designName);
    const pack = await createPack(request, auth, packName, [product.id], true);

    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-more').click();
    await expect(page.getByTestId('collection-menu-draft')).toHaveText('Draft this collection');
    await page.getByTestId('collection-menu-draft').click();
    await expect(page.getByRole('heading', { name: 'Draft this collection?' })).toBeVisible();
    await page.getByTestId('owner-pack-lifecycle-confirm').click();
    await expect(page.getByText('Draft').first()).toBeVisible({ timeout: 15_000 });

    await page.goto('/more');
    await pickYouLibraryFilter(page, 'Draft');
    await expect(page.getByText(packName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('you-collection-draft-chip').first()).toBeVisible();
  });
});
