import { expect, test } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsRavi } from '../../helpers/persona';

test.describe('catalog exclusive Move to pack @functional @catalog @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Move leaves the catalog and follows catalog exclusivity', async ({ page, request }) => {
    test.setTimeout(120_000);
    const designName = `Move exclusive ${Date.now()}`;
    const fromCatalog = `From catalog ${Date.now()}`;
    const otherCatalog = `Other catalog ${Date.now()}`;
    const destCollection = `Move dest ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name: designName, categories: [], images: [] },
    });
    expect(createdDesign.ok(), await createdDesign.text()).toBeTruthy();
    const product = (await createdDesign.json()) as { id: string };

    const createdFrom = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: fromCatalog, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdFrom.ok(), await createdFrom.text()).toBeTruthy();
    const source = (await createdFrom.json()) as { id: string };

    const createdOther = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: otherCatalog, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdOther.ok(), await createdOther.text()).toBeTruthy();
    const other = (await createdOther.json()) as { id: string };

    const createdDest = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: destCollection },
    });
    expect(createdDest.ok(), await createdDest.text()).toBeTruthy();
    const dest = (await createdDest.json()) as { id: string };

    const members = await request.put(`${API_URL}/collections/${source.id}/products`, {
      headers: auth,
      data: { productIds: [product.id] },
    });
    expect(members.ok(), await members.text()).toBeTruthy();

    await page.goto(`/collections/${source.id}`);
    await expect(page.getByRole('button', { name: designName }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: designName }).first().click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible({ timeout: 15_000 });
    await sheet.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Move to catalog / collection' }).click();
    await expect(page.getByRole('heading', { name: 'Move to catalog / collection' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId(`add-to-pack-row-${other.id}`).click();
    await expect(page.getByTestId(`add-to-pack-row-${other.id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.getByTestId(`add-to-pack-row-${dest.id}`).click();
    await expect(page.getByTestId(`add-to-pack-row-${dest.id}`)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId(`add-to-pack-row-${other.id}`)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.getByTestId('add-to-pack-confirm')).toHaveText('Move');
    await page.getByTestId('add-to-pack-confirm').click();
    await expect(page.getByText('Moved to collection').first()).toBeVisible({ timeout: 15_000 });

    await page.goto(`/collections/${source.id}`);
    await expect(page.getByText(designName)).toHaveCount(0, { timeout: 20_000 });
    await page.goto(`/collections/${dest.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Move into another catalog leaves the source catalog', async ({ page, request }) => {
    test.setTimeout(120_000);
    const designName = `Move catalog ${Date.now()}`;
    const fromCatalog = `From catalog ${Date.now()}`;
    const otherCatalog = `Other catalog ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: { name: designName, categories: [], images: [] },
    });
    expect(createdDesign.ok(), await createdDesign.text()).toBeTruthy();
    const product = (await createdDesign.json()) as { id: string };

    const createdFrom = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: fromCatalog, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdFrom.ok(), await createdFrom.text()).toBeTruthy();
    const source = (await createdFrom.json()) as { id: string };

    const createdOther = await request.post(`${API_URL}/collections`, {
      headers: auth,
      data: { name: otherCatalog, kind: 'catalog', orderMode: 'pick' },
    });
    expect(createdOther.ok(), await createdOther.text()).toBeTruthy();
    const other = (await createdOther.json()) as { id: string };

    const members = await request.put(`${API_URL}/collections/${source.id}/products`, {
      headers: auth,
      data: { productIds: [product.id] },
    });
    expect(members.ok(), await members.text()).toBeTruthy();

    await page.goto(`/collections/${source.id}`);
    await expect(page.getByRole('button', { name: designName }).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('button', { name: designName }).first().click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible({ timeout: 15_000 });
    await sheet.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Move to catalog / collection' }).click();
    await expect(page.getByRole('heading', { name: 'Move to catalog / collection' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId(`add-to-pack-row-${other.id}`).click();
    await page.getByTestId('add-to-pack-confirm').click();
    await expect(page.getByText('Moved to catalog').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/already in a catalog/i)).toHaveCount(0);
    await expect(page.getByText(/cannot also sit/i)).toHaveCount(0);

    await page.goto(`/collections/${source.id}`);
    await expect(page.getByText(designName)).toHaveCount(0, { timeout: 20_000 });
    await page.goto(`/collections/${other.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
  });
});
