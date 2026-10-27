import { expect, test } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsRavi } from '../../helpers/persona';

test.describe('catalog remove returns to General Collection @functional @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Remove from catalog album then the design is in General Collection', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `GC leftover ${Date.now()}`;
    const catalogName = `Diwali drop ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name: designName, categories: [], images: [] },
    });
    expect(createdDesign.ok(), await createdDesign.text()).toBeTruthy();
    const product = (await createdDesign.json()) as { id: string };
    const publishedDesign = await request.post(`${API_URL}/products/${product.id}/publish`, {
      headers: auth,
      data: {
        audience: 'everyone',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(publishedDesign.ok(), await publishedDesign.text()).toBeTruthy();

    const createdCatalog = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: catalogName, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdCatalog.ok(), await createdCatalog.text()).toBeTruthy();
    const catalog = (await createdCatalog.json()) as { id: string };
    const members = await request.put(`${API_URL}/collections/${catalog.id}/products`, {
      headers: auth,
      data: { productIds: [product.id] },
    });
    expect(members.ok(), await members.text()).toBeTruthy();

    const listed = await request.get(`${API_URL}/collections`, { headers: auth });
    expect(listed.ok(), await listed.text()).toBeTruthy();
    const albums = (await listed.json()) as Array<{ id: string; kind: string }>;
    const general = albums.find((row) => row.kind === 'general');
    expect(general?.id).toBeTruthy();

    await page.goto(`/collections/${catalog.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-select').click();
    await page.getByTestId('select-all-float-select-all').click();
    await page.getByTestId('collection-more').click();
    await expect(page.getByTestId('collection-select-remove')).toHaveText(
      'Remove from this catalog',
    );
    await page.getByTestId('collection-select-remove').click();
    await expect(page.getByText('Removed from catalog').first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(designName)).toHaveCount(0);

    await page.goto(`/collections/${general!.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Remove from sole collection then the design is in General Collection', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `GC from pack ${Date.now()}`;
    const packName = `One pack ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name: designName, categories: [], images: [] },
    });
    expect(createdDesign.ok(), await createdDesign.text()).toBeTruthy();
    const product = (await createdDesign.json()) as { id: string };
    const publishedDesign = await request.post(`${API_URL}/products/${product.id}/publish`, {
      headers: auth,
      data: {
        audience: 'everyone',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(publishedDesign.ok(), await publishedDesign.text()).toBeTruthy();

    const createdPack = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: packName },
    });
    expect(createdPack.ok(), await createdPack.text()).toBeTruthy();
    const pack = (await createdPack.json()) as { id: string };
    const members = await request.put(`${API_URL}/collections/${pack.id}/products`, {
      headers: auth,
      data: { productIds: [product.id] },
    });
    expect(members.ok(), await members.text()).toBeTruthy();

    const listed = await request.get(`${API_URL}/collections`, { headers: auth });
    expect(listed.ok(), await listed.text()).toBeTruthy();
    const albums = (await listed.json()) as Array<{ id: string; kind: string }>;
    const general = albums.find((row) => row.kind === 'general');
    expect(general?.id).toBeTruthy();

    await page.goto(`/collections/${pack.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-select').click();
    await page.getByTestId('select-all-float-select-all').click();
    await page.getByTestId('collection-more').click();
    await expect(page.getByTestId('collection-select-remove')).toHaveText(
      'Remove from this collection',
    );
    await page.getByTestId('collection-select-remove').click();
    await expect(page.getByText('Removed from collection').first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/collections/${general!.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });
});
