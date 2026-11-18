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

  test('Remove from C1 while still in C2 → not in GC; remove last → GC', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `Multi pack ${Date.now()}`;
    const pack1Name = `Pack one ${Date.now()}`;
    const pack2Name = `Pack two ${Date.now()}`;

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

    const created1 = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: pack1Name },
    });
    expect(created1.ok(), await created1.text()).toBeTruthy();
    const pack1 = (await created1.json()) as { id: string };
    const created2 = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: pack2Name },
    });
    expect(created2.ok(), await created2.text()).toBeTruthy();
    const pack2 = (await created2.json()) as { id: string };

    expect(
      (
        await request.put(`${API_URL}/collections/${pack1.id}/products`, {
          headers: auth,
          data: { productIds: [product.id] },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await request.put(`${API_URL}/collections/${pack2.id}/products`, {
          headers: auth,
          data: { productIds: [product.id] },
        })
      ).ok(),
    ).toBeTruthy();

    const listed = await request.get(`${API_URL}/collections`, { headers: auth });
    expect(listed.ok(), await listed.text()).toBeTruthy();
    const albums = (await listed.json()) as Array<{ id: string; kind: string }>;
    const general = albums.find((row) => row.kind === 'general');
    expect(general?.id).toBeTruthy();

    // Still listed on Designs while in regular packs.
    const productsRes = await request.get(`${API_URL}/products`, { headers: auth });
    expect(productsRes.ok(), await productsRes.text()).toBeTruthy();
    const products = (await productsRes.json()) as Array<{
      id: string;
      name: string;
      collectionNames?: string[];
    }>;
    const onDesigns = products.find((row) => row.id === product.id);
    expect(onDesigns?.name).toBe(designName);

    // Remove from C1 only (API = same write album/editor use).
    expect(
      (
        await request.put(`${API_URL}/collections/${pack1.id}/products`, {
          headers: auth,
          data: { productIds: [] },
        })
      ).ok(),
    ).toBeTruthy();

    const stillPack2 = await request.get(`${API_URL}/collections/${pack2.id}`, {
      headers: auth,
    });
    expect(stillPack2.ok(), await stillPack2.text()).toBeTruthy();
    const pack2Detail = (await stillPack2.json()) as {
      products: Array<{ id: string }>;
    };
    expect(pack2Detail.products.some((row) => row.id === product.id)).toBe(true);

    const gcAfterC1 = await request.get(`${API_URL}/collections/${general!.id}`, {
      headers: auth,
    });
    expect(gcAfterC1.ok(), await gcAfterC1.text()).toBeTruthy();
    const gcDetail = (await gcAfterC1.json()) as {
      products: Array<{ id: string }>;
    };
    expect(gcDetail.products.some((row) => row.id === product.id)).toBe(false);

    // Remove from last pack → GC.
    expect(
      (
        await request.put(`${API_URL}/collections/${pack2.id}/products`, {
          headers: auth,
          data: { productIds: [] },
        })
      ).ok(),
    ).toBeTruthy();

    const gcAfterLast = await request.get(`${API_URL}/collections/${general!.id}`, {
      headers: auth,
    });
    expect(gcAfterLast.ok(), await gcAfterLast.text()).toBeTruthy();
    const gcLast = (await gcAfterLast.json()) as {
      products: Array<{ id: string }>;
    };
    expect(gcLast.products.some((row) => row.id === product.id)).toBe(true);

    await page.goto(`/collections/${general!.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Catalog design stays on Designs with association; not in GC while stamped', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `Catalog only ${Date.now()}`;
    const catalogName = `Exclusive cat ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name: designName, categories: [], images: [] },
    });
    expect(createdDesign.ok(), await createdDesign.text()).toBeTruthy();
    const product = (await createdDesign.json()) as { id: string };
    expect(
      (
        await request.post(`${API_URL}/products/${product.id}/publish`, {
          headers: auth,
          data: {
            audience: 'everyone',
            rateVisibility: 'on_request',
            allowForward: true,
            consentToSell: true,
          },
        })
      ).ok(),
    ).toBeTruthy();

    const createdCatalog = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: catalogName, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdCatalog.ok(), await createdCatalog.text()).toBeTruthy();
    const catalog = (await createdCatalog.json()) as { id: string };
    expect(
      (
        await request.put(`${API_URL}/collections/${catalog.id}/products`, {
          headers: auth,
          data: { productIds: [product.id] },
        })
      ).ok(),
    ).toBeTruthy();

    const listed = await request.get(`${API_URL}/collections`, { headers: auth });
    expect(listed.ok(), await listed.text()).toBeTruthy();
    const albums = (await listed.json()) as Array<{ id: string; kind: string }>;
    const general = albums.find((row) => row.kind === 'general');
    expect(general?.id).toBeTruthy();

    const productsRes = await request.get(`${API_URL}/products`, { headers: auth });
    expect(productsRes.ok(), await productsRes.text()).toBeTruthy();
    const products = (await productsRes.json()) as Array<{
      id: string;
      catalogCollectionId?: string | null;
      collectionNames?: string[];
    }>;
    const row = products.find((item) => item.id === product.id);
    expect(row).toBeTruthy();
    expect(row!.catalogCollectionId).toBe(catalog.id);

    const gcRes = await request.get(`${API_URL}/collections/${general!.id}`, { headers: auth });
    expect(gcRes.ok(), await gcRes.text()).toBeTruthy();
    const gcDetail = (await gcRes.json()) as {
      products: Array<{ id: string }>;
    };
    expect(gcDetail.products.some((item) => item.id === product.id)).toBe(false);
  });
});
