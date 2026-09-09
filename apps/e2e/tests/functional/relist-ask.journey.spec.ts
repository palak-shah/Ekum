import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';

async function createLockedDesign(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  name: string,
): Promise<{ id: string; name: string; companyId: string }> {
  const auth = { authorization: `Bearer ${token}` };
  const created = await request.post(`${API_URL}/products`, {
    headers: auth,
    data: { name, categories: [], images: [] },
  });
  if (!created.ok()) {
    throw new Error(`create product failed: ${created.status()} ${await created.text()}`);
  }
  const product = (await created.json()) as { id: string; name: string; companyId: string };
  const published = await request.post(`${API_URL}/products/${product.id}/publish`, {
    headers: auth,
    data: {
      audience: 'everyone',
      rateVisibility: 'on_request',
      allowForward: false,
      consentToSell: true,
    },
  });
  if (!published.ok()) {
    throw new Error(`publish product failed: ${published.status()} ${await published.text()}`);
  }
  return product;
}

function seedLockedSelection(
  page: import('@playwright/test').Page,
  input: { productId: string; name: string; companyId: string },
) {
  return page.evaluate(({ productId, name, companyId }) => {
    sessionStorage.setItem(
      'ekum:browseShortlist',
      JSON.stringify([
        {
          productId,
          name,
          thumbUrl: null,
          companyId,
          companyName: 'Surat Silk House',
          allowForward: false,
        },
      ]),
    );
    sessionStorage.removeItem('ekum:browseAlbumPick');
  }, input);
}

test.describe('relist Ask → Allow → Curate @functional @catalog', () => {
  test('Ask → Allow unlocks Curate; Deny silent; revoke locks again', async ({ page }) => {
    const designName = `Pack-lock ${Date.now()}`;

    await loginAsRavi(page);
    const product = await createLockedDesign(
      page.request,
      await accessTokenFromPage(page),
      designName,
    );

    await loginAsKavita(page);
    await seedLockedSelection(page, {
      productId: product.id,
      name: designName,
      companyId: product.companyId,
    });
    await page.goto('/selection');
    await expect(page.getByText(designName)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveText("Can't put in a pack");
    await page.getByTestId('selection-ask-relist').click();
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveText('Waiting for Allow', {
      timeout: 15_000,
    });

    await loginAsRavi(page);
    await page.goto('/chats');
    await expect(page.locator('a[href^="/chats/"]').first()).toBeVisible({ timeout: 15_000 });
    const thread = page.locator('a[href^="/chats/"]').filter({ hasText: /Ahmedabad|Loom/i }).first();
    if ((await thread.count()) === 0) {
      await page.locator('a[href^="/chats/"]').first().click();
    } else {
      await thread.click();
    }
    await expect(page.getByTestId('relist-request-allow')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Wants to put/i)).toBeVisible();
    await page.getByTestId('relist-request-allow').click();
    await expect(page.getByText(/You can put this in your pack/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await loginAsKavita(page);
    await seedLockedSelection(page, {
      productId: product.id,
      name: designName,
      companyId: product.companyId,
    });
    await page.goto('/selection');
    await expect(page.getByText(designName)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveCount(0, {
      timeout: 15_000,
    });
    await page.getByTestId('selection-curate').click();
    await expect(page.getByRole('heading', { name: 'Curate pack' })).toBeVisible({
      timeout: 15_000,
    });

    // Deny path — silent to asker
    await loginAsRavi(page);
    const denyName = `Deny-lock ${Date.now()}`;
    const deniedProduct = await createLockedDesign(
      page.request,
      await accessTokenFromPage(page),
      denyName,
    );

    await loginAsKavita(page);
    const ask = await page.request.post(`${API_URL}/relist-requests`, {
      headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
      data: { productIds: [deniedProduct.id] },
    });
    expect(ask.ok()).toBeTruthy();
    const askView = (await ask.json()) as { id: string; threadId: string | null };

    await loginAsRavi(page);
    const denyRes = await page.request.post(`${API_URL}/relist-requests/${askView.id}/deny`, {
      headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
      data: {},
    });
    expect(denyRes.ok()).toBeTruthy();

    await loginAsKavita(page);
    if (askView.threadId) {
      await page.goto(`/chats/${askView.threadId}`);
      await expect(page.getByText(/Declined/i)).toHaveCount(0);
    }
    await seedLockedSelection(page, {
      productId: deniedProduct.id,
      name: denyName,
      companyId: deniedProduct.companyId,
    });
    await page.goto('/selection');
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveText("Can't put in a pack", {
      timeout: 15_000,
    });

    // Owner revoke UI + lock returns
    await loginAsRavi(page);
    await page.goto(`/products/${product.id}`);
    await expect(page.getByTestId('product-relist-grants')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('product-relist-revoke').click();
    await expect(page.getByTestId('product-relist-grants')).toHaveCount(0, { timeout: 10_000 });

    await loginAsKavita(page);
    await seedLockedSelection(page, {
      productId: product.id,
      name: designName,
      companyId: product.companyId,
    });
    await page.goto('/selection');
    await expect(page.getByTestId('selection-pack-lock-reason')).toHaveText("Can't put in a pack", {
      timeout: 15_000,
    });
  });

  test('Ask via source pack goes to pack owner, not mill', async ({ page }) => {
    const designName = `Desk-chain ${Date.now()}`;

    await loginAsRavi(page);
    const product = await createLockedDesign(
      page.request,
      await accessTokenFromPage(page),
      designName,
    );

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    const millAsk = await page.request.post(`${API_URL}/relist-requests`, {
      headers: { authorization: `Bearer ${kavitaToken}` },
      data: { productIds: [product.id] },
    });
    expect(millAsk.ok()).toBeTruthy();
    const millView = (await millAsk.json()) as { id: string };
    await loginAsRavi(page);
    const millAllow = await page.request.post(
      `${API_URL}/relist-requests/${millView.id}/allow`,
      {
        headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
        data: {},
      },
    );
    expect(millAllow.ok()).toBeTruthy();

    await loginAsKavita(page);
    const kToken = await accessTokenFromPage(page);
    const packRes = await page.request.post(`${API_URL}/collections`, {
      headers: { authorization: `Bearer ${kToken}` },
      data: { name: `Desk pack ${Date.now()}` },
    });
    expect(packRes.ok()).toBeTruthy();
    const pack = (await packRes.json()) as { id: string };
    const setMembers = await page.request.put(`${API_URL}/collections/${pack.id}/products`, {
      headers: { authorization: `Bearer ${kToken}` },
      data: { productIds: [product.id] },
    });
    expect(setMembers.ok()).toBeTruthy();
    const publish = await page.request.post(`${API_URL}/collections/${pack.id}/publish`, {
      headers: { authorization: `Bearer ${kToken}` },
      data: {
        audience: 'everyone',
        rateVisibility: 'on_request',
        allowForward: false,
        consentToSell: true,
      },
    });
    expect(publish.ok()).toBeTruthy();

    await loginAsMeena(page);
    const meenaAsk = await page.request.post(`${API_URL}/relist-requests`, {
      headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
      data: { productIds: [product.id], sourceCollectionId: pack.id },
    });
    expect(meenaAsk.ok()).toBeTruthy();
    const deskAsk = (await meenaAsk.json()) as {
      id: string;
      target: { id: string };
      sourceCollectionId: string | null;
    };
    expect(deskAsk.target.id).toBe('seed-company-kavita');
    expect(deskAsk.sourceCollectionId).toBe(pack.id);
  });
});
