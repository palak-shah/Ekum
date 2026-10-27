import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

const MEENA_COMPANY = 'seed-company-meena';

test.describe('explore own repost @functional @explore', () => {
  test('own Followers pack shows on Buying and Stories You, and an allowed follower sees it', async ({
    page,
  }) => {
    const packName = `Own explore ${Date.now()}`;

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const headers = { authorization: `Bearer ${meenaToken}` };

    const preview = await page.request.get(`${API_URL}/explore/collections/seed-col-1`, {
      headers,
    });
    expect(preview.ok()).toBeTruthy();
    const previewBody = (await preview.json()) as { products?: { id: string }[] };
    const productIds = (previewBody.products ?? []).map((row) => row.id);
    expect(productIds.length).toBeGreaterThan(0);

    const check = await page.request.post(`${API_URL}/collections/curate-check`, {
      headers,
      data: { productIds },
    });
    expect(check.ok()).toBeTruthy();
    const allowed = ((await check.json()) as { allowedProductIds: string[] }).allowedProductIds;
    expect(allowed.length).toBeGreaterThan(0);

    const created = await page.request.post(`${API_URL}/collections`, {
      headers,
      data: { name: packName, categories: [] },
    });
    expect(created.ok()).toBeTruthy();
    const pack = (await created.json()) as { id: string };
    const members = await page.request.put(`${API_URL}/collections/${pack.id}/products`, {
      headers,
      data: { productIds: allowed },
    });
    expect(members.ok()).toBeTruthy();
    const published = await page.request.post(`${API_URL}/collections/${pack.id}/publish`, {
      headers,
      data: {
        audience: 'followers',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(published.ok()).toBeTruthy();

    await page.goto('/explore');
    await expect(page.getByTestId('explore-story-you')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: packName }).first()).toBeVisible();

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    await page.request.delete(`${API_URL}/follows/${MEENA_COMPANY}`, {
      headers: { authorization: `Bearer ${kavitaToken}` },
    });
    const ask = await page.request.post(`${API_URL}/follows`, {
      headers: { authorization: `Bearer ${kavitaToken}` },
      data: { companyId: MEENA_COMPANY },
    });
    expect(ask.ok()).toBeTruthy();

    await loginAsMeena(page);
    const allow = await page.request.post(`${API_URL}/follows/decide`, {
      headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
      data: { followerCompanyId: 'seed-company-kavita', decision: 'pack' },
    });
    expect(allow.ok()).toBeTruthy();

    await loginAsKavita(page);
    await page.goto('/explore');
    await expect(page.getByRole('link', { name: packName }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.request.delete(`${API_URL}/follows/${MEENA_COMPANY}`, {
      headers: { authorization: `Bearer ${await accessTokenFromPage(page)}` },
    });
  });
});
