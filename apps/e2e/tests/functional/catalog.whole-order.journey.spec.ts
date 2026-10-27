import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

type AuthHeaders = { authorization: string };

async function publishCatalog(
  request: APIRequestContext,
  auth: AuthHeaders,
  input: {
    name: string;
    orderMode: 'whole' | 'pick';
    designNames: string[];
  },
) {
  const productIds: string[] = [];
  for (const name of input.designNames) {
    const created = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name, categories: [], images: [] },
    });
    expect(created.ok(), await created.text()).toBeTruthy();
    const product = (await created.json()) as { id: string };
    productIds.push(product.id);
  }

  const createdCatalog = await request.post(`${API_URL}/collections`, {
    headers: auth,
    data: {
      name: input.name,
      kind: 'catalog',
      orderMode: input.orderMode,
      masterCategoryId: 'womens_readymade_ethnic',
    },
  });
  expect(createdCatalog.ok(), await createdCatalog.text()).toBeTruthy();
  const catalog = (await createdCatalog.json()) as { id: string };

  const members = await request.put(`${API_URL}/collections/${catalog.id}/products`, {
    headers: auth,
    data: { productIds },
  });
  expect(members.ok(), await members.text()).toBeTruthy();

  const publish = await request.post(`${API_URL}/collections/${catalog.id}/publish`, {
    headers: auth,
    data: {
      audience: 'everyone',
      rateVisibility: 'on_request',
      allowForward: true,
      consentToSell: true,
    },
  });
  expect(publish.ok(), await publish.text()).toBeTruthy();
  return catalog;
}

async function raviAuth(page: Page) {
  await loginAsRavi(page);
  const token = await accessTokenFromPage(page);
  return { authorization: `Bearer ${token}` } satisfies AuthHeaders;
}

test.describe('catalog Order as whole @functional @catalog @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('DesignSheet Order expands every published member and does not offer Choose designs', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const catalogName = `Whole catalog ${stamp}`;
    const silk = `Whole silk ${stamp}`;
    const cotton = `Whole cotton ${stamp}`;

    const auth = await raviAuth(page);
    const catalog = await publishCatalog(request, auth, {
      name: catalogName,
      orderMode: 'whole',
      designNames: [silk, cotton],
    });

    await loginAsMeena(page);
    await page.goto(`/collections/${catalog.id}`);
    await expect(page.getByText(silk).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: silk }).first().click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible({ timeout: 15_000 });
    await sheet.getByRole('button', { name: 'Order' }).click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('resolve-pick-designs')).toHaveCount(0);
    await expect(page.getByText(silk).first()).toBeVisible();
    await expect(page.getByText(cotton).first()).toBeVisible();
    await expect(page.getByTestId('how-many-remove')).toHaveCount(0);
  });

  test('shop Order of a whole catalog skips Choose designs', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const catalogName = `Shop whole ${stamp}`;
    const silk = `Shop silk ${stamp}`;
    const cotton = `Shop cotton ${stamp}`;

    const auth = await raviAuth(page);
    const catalog = await publishCatalog(request, auth, {
      name: catalogName,
      orderMode: 'whole',
      designNames: [silk, cotton],
    });

    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi');
    await page.getByTestId('company-shop-tab-collections').click();
    await expect(page.getByText(catalogName).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('company-shop-select').click();
    await page.getByTestId(`company-shop-collection-${catalog.id}`).click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await page.getByTestId('company-shop-order').click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('resolve-pick-designs')).toHaveCount(0);
    await expect(page.getByText(silk).first()).toBeVisible();
    await expect(page.getByText(cotton).first()).toBeVisible();
    await expect(page.getByTestId('how-many-remove')).toHaveCount(0);
  });

  test('pick catalog still offers Choose designs', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stamp = Date.now();
    const catalogName = `Pick catalog ${stamp}`;
    const silk = `Pick silk ${stamp}`;
    const cotton = `Pick cotton ${stamp}`;

    const auth = await raviAuth(page);
    const catalog = await publishCatalog(request, auth, {
      name: catalogName,
      orderMode: 'pick',
      designNames: [silk, cotton],
    });

    await loginAsMeena(page);
    await page.goto('/company/seed-company-ravi');
    await page.getByTestId('company-shop-tab-collections').click();
    await expect(page.getByText(catalogName).first()).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('company-shop-select').click();
    await page.getByTestId(`company-shop-collection-${catalog.id}`).click();
    await expect(page.getByTestId('company-shop-dock')).toBeVisible();
    await page.getByTestId('company-shop-order').click();
    await expect(page.getByTestId('resolve-pick-designs')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('how-many-lines')).toHaveCount(0);
  });
});
