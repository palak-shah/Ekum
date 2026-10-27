import { expect, test } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsRavi } from '../../helpers/persona';

test.describe('General Collection is leftover bouquet @functional @collections', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('album has no pack journey; edit has no apply-all or Order and dispatch', async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const designName = `Leftover bouquet ${Date.now()}`;

    await loginAsRavi(page);
    const token = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${token}` };

    const createdDesign = await request.post(`${API_URL}/products`, {
      headers: auth,
      data: {
        name: designName,
        categories: [],
        images: [],
        unit: 'set',
        dispatchUnit: 'set',
        catalogRateUnit: 'pc',
      },
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

    const listed = await request.get(`${API_URL}/collections`, { headers: auth });
    expect(listed.ok(), await listed.text()).toBeTruthy();
    const albums = (await listed.json()) as Array<{ id: string; kind: string }>;
    const general = albums.find((row) => row.kind === 'general');
    expect(general?.id).toBeTruthy();

    await page.goto(`/collections/${general!.id}`);
    await expect(page.getByText(designName).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('collection-pack-journey')).toHaveCount(0);
    await expect(page.getByTestId('collection-pack-facts')).toHaveCount(0);

    await page.getByTestId('collection-more').click();
    await page.getByTestId('collection-menu-edit').click();
    await expect(page.getByTestId('collection-edit-details')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('collection-apply-all')).toHaveCount(0);
    await expect(page.getByTestId('collection-order-dispatch')).toHaveCount(0);
    await expect(page.getByTestId('collection-product-details')).toHaveCount(0);

    const note = `Leftover note ${Date.now()}`;
    await page.getByLabel('Description').fill(note);
    await page.getByTestId('collection-editor-update').click();
    await expect(page.getByText('Updated').first()).toBeVisible({ timeout: 15_000 });
    await page.goto(`/collections/${general!.id}`);
    await expect(page.getByTestId('collection-pack-details-description')).toHaveTextContent(note, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('collection-pack-facts')).toHaveCount(0);
    await expect(page.getByTestId('collection-about')).toHaveCount(0);
  });
});
