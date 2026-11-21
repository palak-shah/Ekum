import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

const MEENA_COMPANY = 'seed-company-meena';
const SOURCE_PACK = 'seed-col-1';

type CollectionView = {
  id: string;
  status: string;
  exploreActivityAt: string | null;
  productCount: number;
  name: string;
};

type CollectionDetail = CollectionView & {
  products: Array<{ id: string }>;
};

async function authHeaders(page: import('@playwright/test').Page) {
  return { authorization: `Bearer ${await accessTokenFromPage(page)}` };
}

async function getCollection(
  page: import('@playwright/test').Page,
  headers: { authorization: string },
  id: string,
): Promise<CollectionDetail> {
  const res = await page.request.get(`${API_URL}/collections/${id}`, { headers });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as CollectionDetail;
}

test.describe('explore remove repost rank lock @functional @explore', () => {
  test('Remove repost → Draft preserves exploreActivityAt; republish reuses id without rank bump', async ({
    page,
  }) => {
    const packName = `Remove repost ${Date.now()}`;

    await loginAsKavita(page);
    const headers = await authHeaders(page);

    const ordersBefore = await page.request.get(`${API_URL}/orders?limit=1`, { headers });
    expect(ordersBefore.ok()).toBeTruthy();
    const ordersBeforeBody = (await ordersBefore.json()) as { results?: unknown[] };
    const orderCountHint = ordersBeforeBody.results?.length ?? 0;

    const preview = await page.request.get(`${API_URL}/explore/collections/${SOURCE_PACK}`, {
      headers,
    });
    expect(preview.ok(), await preview.text()).toBeTruthy();
    const previewBody = (await preview.json()) as { products?: { id: string }[] };
    const productIds = (previewBody.products ?? []).map((row) => row.id);
    expect(productIds.length).toBeGreaterThan(0);

    const check = await page.request.post(`${API_URL}/collections/curate-check`, {
      headers,
      data: { productIds, sourceCollectionId: SOURCE_PACK },
    });
    expect(check.ok(), await check.text()).toBeTruthy();
    const allowed = ((await check.json()) as { allowedProductIds: string[] }).allowedProductIds;
    expect(allowed.length).toBeGreaterThan(0);

    const created = await page.request.post(`${API_URL}/collections`, {
      headers,
      data: {
        name: packName,
        categories: [],
        repostSourceCollectionId: SOURCE_PACK,
      },
    });
    let childId: string;
    if (created.ok()) {
      childId = ((await created.json()) as { id: string }).id;
    } else {
      // Prior journey left a child for this source — reuse it (no duplicate create).
      const body = (await created.json()) as {
        code?: string;
        details?: { collectionId?: string };
      };
      expect(body.code).toBe('ALREADY_REPOSTED');
      expect(body.details?.collectionId).toBeTruthy();
      childId = body.details!.collectionId!;
      await page.request.patch(`${API_URL}/collections/${childId}`, {
        headers,
        data: { name: packName },
      });
    }

    const members = await page.request.put(`${API_URL}/collections/${childId}/products`, {
      headers,
      data: { productIds: allowed, sourceCollectionId: SOURCE_PACK },
    });
    expect(members.ok(), await members.text()).toBeTruthy();

    const published = await page.request.post(`${API_URL}/collections/${childId}/publish`, {
      headers,
      data: {
        audience: 'followers',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(published.ok(), await published.text()).toBeTruthy();

    const live = await getCollection(page, headers, childId);
    expect(live.status).toBe('published');
    expect(live.exploreActivityAt).toBeTruthy();
    const stampedAt = live.exploreActivityAt!;
    const memberCount = live.productCount;
    expect(memberCount).toBeGreaterThan(0);

    await page.goto('/explore');
    await expect(page.getByRole('link', { name: packName }).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Edit repost' }).first().click();
    await expect(page.getByRole('heading', { name: 'Edit repost' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId('repost-remove')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Archive', exact: true })).toHaveCount(0);

    await page.getByTestId('repost-remove').click();
    await expect(page.getByRole('heading', { name: 'Remove this repost?' })).toBeVisible();
    await page.getByTestId('owner-pack-lifecycle-confirm').click();
    await expect(page.getByText(/Repost removed/i).first()).toBeVisible({ timeout: 15_000 });

    const drafted = await getCollection(page, headers, childId);
    expect(drafted.status).toBe('draft');
    expect(drafted.exploreActivityAt).toBe(stampedAt);
    expect(drafted.productCount).toBe(memberCount);

    await page.goto('/explore');
    await expect(page.getByRole('link', { name: packName })).toHaveCount(0);

    // Buyer (Meena) must not see the drafted child on Explore.
    await loginAsMeena(page);
    await page.goto('/explore');
    await expect(page.getByRole('link', { name: packName })).toHaveCount(0);

    await loginAsKavita(page);
    const kavitaHeaders = await authHeaders(page);

    const republished = await page.request.post(`${API_URL}/collections/${childId}/publish`, {
      headers: kavitaHeaders,
      data: {
        audience: 'followers',
        rateVisibility: 'on_request',
        allowForward: true,
        consentToSell: true,
      },
    });
    expect(republished.ok(), await republished.text()).toBeTruthy();

    const again = await getCollection(page, kavitaHeaders, childId);
    expect(again.status).toBe('published');
    expect(again.id).toBe(childId);
    expect(again.exploreActivityAt).toBe(stampedAt);

    const mine = await page.request.get(`${API_URL}/collections`, {
      headers: kavitaHeaders,
    });
    expect(mine.ok()).toBeTruthy();
    const mineBody = (await mine.json()) as Array<{ id: string; name: string; status: string }>;
    const sameName = mineBody.filter((row) => row.name === packName);
    expect(sameName).toHaveLength(1);
    expect(sameName[0]?.id).toBe(childId);

    const reuse = await page.request.post(`${API_URL}/collections`, {
      headers: kavitaHeaders,
      data: {
        name: `${packName} again`,
        categories: [],
        repostSourceCollectionId: SOURCE_PACK,
      },
    });
    // Must not create a second child for the same immediate source.
    expect(reuse.status()).toBe(409);
    const reuseBody = (await reuse.json()) as {
      code?: string;
      details?: { collectionId?: string };
    };
    expect(reuseBody.code).toBe('ALREADY_REPOSTED');
    expect(reuseBody.details?.collectionId).toBe(childId);

    const ordersAfter = await page.request.get(`${API_URL}/orders?limit=1`, {
      headers: kavitaHeaders,
    });
    expect(ordersAfter.ok()).toBeTruthy();
    const ordersAfterBody = (await ordersAfter.json()) as { results?: unknown[] };
    expect(ordersAfterBody.results?.length ?? 0).toBe(orderCountHint);

    // Cleanup: draft again so Explore stays tidy for later journeys.
    await page.request.post(`${API_URL}/collections/${childId}/remove-repost`, {
      headers: kavitaHeaders,
    });

    void MEENA_COMPANY;
  });
});
