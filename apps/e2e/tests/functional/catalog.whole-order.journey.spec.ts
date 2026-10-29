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
    rate?: number;
    unit?: string;
    catalogRateUnit?: string;
    rateVisibility?: 'visible' | 'on_request';
  },
) {
  const productIds: string[] = [];
  for (const name of input.designNames) {
    const created = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: {
        name,
        categories: [],
        images: [],
        ...(input.rate != null
          ? {
              rate: input.rate,
              unit: input.unit ?? 'pc',
              catalogRateUnit: input.catalogRateUnit ?? 'pc',
            }
          : {}),
      },
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
      ...(input.rate != null
        ? {
            rate: input.rate,
            unit: input.unit ?? 'pc',
            catalogRateUnit: input.catalogRateUnit ?? 'pc',
          }
        : {}),
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
      rateVisibility: input.rateVisibility ?? 'on_request',
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

async function expectCatalogHowMany(page: Page, catalogName: string, members: string[]) {
  await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 20_000 });
  await expect(
    page.locator('.ekum-sheet').getByRole('heading', { name: catalogName }),
  ).toBeVisible();
  await expect(page.getByTestId('how-many-catalog')).toBeVisible();
  await expect(page.getByTestId('qty-stepper')).toHaveCount(1);
  await expect(page.getByTestId('resolve-pick-designs')).toHaveCount(0);
  await expect(page.getByTestId('how-many-remove')).toHaveCount(0);
  await expect(page.getByTestId('same-for-all-chip')).toHaveCount(0);
  const memberList = page.getByTestId('how-many-catalog-members');
  await expect(memberList).toBeVisible();
  for (const name of members) {
    await expect(memberList.getByText(name)).toBeVisible();
  }
  await expect(memberList.getByRole('textbox')).toHaveCount(0);
}

test.describe('catalog Order as whole @functional @catalog @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('DesignSheet Order opens catalog How many with one qty', async ({ page, request }) => {
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
    await expectCatalogHowMany(page, catalogName, [silk, cotton]);
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
    await expectCatalogHowMany(page, catalogName, [silk, cotton]);
  });

  test('Place 1 pc is one ticket row and Confirm has one tick', async ({ page, request }) => {
    test.setTimeout(180_000);
    const stamp = Date.now();
    const catalogName = `Bill catalog ${stamp}`;
    const silk = `Bill silk ${stamp}`;
    const cotton = `Bill cotton ${stamp}`;
    const linen = `Bill linen ${stamp}`;

    const auth = await raviAuth(page);
    const catalog = await publishCatalog(request, auth, {
      name: catalogName,
      orderMode: 'whole',
      designNames: [silk, cotton, linen],
      rate: 450,
      unit: 'pc',
      catalogRateUnit: 'pc',
      rateVisibility: 'visible',
    });

    await loginAsMeena(page);
    await page.goto(`/collections/${catalog.id}`);
    await expect(page.getByText(silk).first()).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: silk }).first().click();
    const designSheet = page.getByRole('dialog');
    await expect(designSheet).toBeVisible({ timeout: 15_000 });
    await designSheet.getByRole('button', { name: 'Order' }).click();
    await expectCatalogHowMany(page, catalogName, [silk, cotton, linen]);
    await page.getByRole('button', { name: /Increase/i }).click();
    await page.getByTestId('how-many-place-order').click();
    await expect(page.getByText('1 order placed')).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/chats\//, { timeout: 25_000 });

    const meenaToken = await accessTokenFromPage(page);
    const list = await request.get(`${API_URL}/orders?limit=10&direction=buying`, {
      headers: { authorization: `Bearer ${meenaToken}` },
    });
    expect(list.ok(), await list.text()).toBeTruthy();
    const body = (await list.json()) as { results: Array<{ id: string }> };
    const orderId = body.results[0]?.id;
    expect(orderId).toBeTruthy();

    await page.goto(`/orders/${orderId}`);
    await expect(page.getByText(catalogName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('order-ticket-qty-total')).toContainText('1 pc');
    await expect(page.getByTestId('order-ticket-bill-total')).toContainText('1,350');
    await expect(page.getByText(silk)).toHaveCount(0);
    await expect(page.getByText(cotton)).toHaveCount(0);

    await loginAsRavi(page);
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('order-dock-confirm')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('order-dock-confirm').click();
    const confirm = page.getByRole('dialog');
    await expect(confirm.getByRole('heading', { name: 'Confirm / decline lines' })).toBeVisible();
    await expect(confirm.getByTestId('order-lines-decide-row')).toHaveCount(1);
    await expect(confirm.getByText(catalogName).first()).toBeVisible();
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
