import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { createDirectLink, grantPackAccess } from '../../helpers/tradeLanes';

const KAVITA = 'seed-company-kavita';
const MEENA = 'seed-company-meena';
const RAVI = 'seed-company-ravi';

type CollectionRow = {
  id: string;
  name: string;
  status: string;
  audience: string;
  audienceCompanyIds: string[];
  showSourceShops: boolean;
  productCount: number;
  masterCategoryId: string | null;
  kind?: string;
};

type ExploreCollectionsPage = {
  results?: Array<{
    id: string;
    name: string;
    company?: { id: string };
    showSourceShops?: boolean;
    sourceShopNames?: string[];
  }>;
};

async function authHeaders(page: import('@playwright/test').Page, token?: string) {
  return { authorization: `Bearer ${token ?? (await accessTokenFromPage(page))}` };
}

async function listMine(
  page: import('@playwright/test').Page,
  token: string,
): Promise<CollectionRow[]> {
  const res = await page.request.get(`${API_URL}/collections`, {
    headers: await authHeaders(page, token),
  });
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as CollectionRow[];
}

async function exploreCollections(
  page: import('@playwright/test').Page,
  token: string,
): Promise<NonNullable<ExploreCollectionsPage['results']>> {
  const res = await page.request.get(`${API_URL}/explore/collections?following=true&limit=50`, {
    headers: await authHeaders(page, token),
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as ExploreCollectionsPage;
  return body.results ?? [];
}

async function ensureFollow(
  page: import('@playwright/test').Page,
  followerToken: string,
  followedCompanyId: string,
  ownerToken: string,
  followerCompanyId: string,
): Promise<void> {
  await page.request.post(`${API_URL}/follows`, {
    headers: { authorization: `Bearer ${followerToken}` },
    data: { companyId: followedCompanyId },
  });
  await page.request.post(`${API_URL}/follows/decide`, {
    headers: { authorization: `Bearer ${ownerToken}` },
    data: { followerCompanyId, decision: 'look' },
  });
}

async function removeDirectLinksForSupplier(
  page: import('@playwright/test').Page,
  traderToken: string,
  sellerCompanyId: string,
): Promise<void> {
  const res = await page.request.get(`${API_URL}/trade-lanes`, {
    headers: { authorization: `Bearer ${traderToken}` },
  });
  expect(res.ok()).toBeTruthy();
  const lanes = (await res.json()) as Array<{ id: string; sellerCompanyId: string }>;
  for (const lane of lanes.filter((row) => row.sellerCompanyId === sellerCompanyId)) {
    const del = await page.request.delete(`${API_URL}/trade-lanes/${lane.id}`, {
      headers: { authorization: `Bearer ${traderToken}` },
    });
    expect(del.ok(), await del.text()).toBeTruthy();
  }
}

async function publishMillPack(
  page: import('@playwright/test').Page,
  millToken: string,
  input: { name: string; productIds: string[]; masterCategoryId: string | null },
): Promise<{ id: string }> {
  const created = await page.request.post(`${API_URL}/collections`, {
    headers: { authorization: `Bearer ${millToken}` },
    data: {
      name: input.name,
      categories: [],
      masterCategoryId: input.masterCategoryId ?? 'womens_readymade_ethnic',
    },
  });
  expect(created.ok(), await created.text()).toBeTruthy();
  const millPack = (await created.json()) as { id: string };
  const members = await page.request.put(`${API_URL}/collections/${millPack.id}/products`, {
    headers: { authorization: `Bearer ${millToken}` },
    data: { productIds: input.productIds },
  });
  expect(members.ok(), await members.text()).toBeTruthy();
  const published = await page.request.post(`${API_URL}/collections/${millPack.id}/publish`, {
    headers: { authorization: `Bearer ${millToken}` },
    data: {
      audience: 'followers',
      rateVisibility: 'on_request',
      allowForward: true,
      consentToSell: true,
    },
  });
  expect(published.ok(), await published.text()).toBeTruthy();
  return millPack;
}

test.describe('Direct Link auto-repost Selected buyer @functional @explore', () => {
  test('auto pack is Selected to the linked buyer; Followers later is T2 not B1', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const stamp = Date.now();
    const oldPackName = `Auto old ${stamp}`;
    const packName = `Auto B1 ${stamp}`;

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    const millPacks = (await listMine(page, kavitaToken)).filter(
      (row) =>
        row.status === 'published' &&
        row.productCount > 0 &&
        (row.kind ?? 'regular') === 'regular',
    );
    expect(millPacks.length).toBeGreaterThan(0);
    const sourceTemplate = millPacks[0];
    const sourceDetail = await page.request.get(`${API_URL}/collections/${sourceTemplate.id}`, {
      headers: { authorization: `Bearer ${kavitaToken}` },
    });
    expect(sourceDetail.ok()).toBeTruthy();
    const sourceBody = (await sourceDetail.json()) as {
      products: { id: string }[];
      masterCategoryId: string | null;
    };
    const productIds = sourceBody.products.map((row) => row.id);
    expect(productIds.length).toBeGreaterThan(0);

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await grantPackAccess(page.request, kavitaToken, MEENA);
    await removeDirectLinksForSupplier(page, meenaToken, KAVITA);

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    await ensureFollow(page, raviToken, MEENA, meenaToken, RAVI);

    const oldMillPack = await publishMillPack(page, kavitaToken, {
      name: oldPackName,
      productIds,
      masterCategoryId: sourceBody.masterCategoryId,
    });
    void oldMillPack;

    await createDirectLink(page.request, meenaToken, KAVITA, RAVI);

    const meenaAfterLink = await listMine(page, meenaToken);
    expect(
      meenaAfterLink.some((row) => row.name === oldPackName && row.status === 'published'),
    ).toBe(false);

    const millPack = await publishMillPack(page, kavitaToken, {
      name: packName,
      productIds,
      masterCategoryId: sourceBody.masterCategoryId,
    });

    let autoPack: CollectionRow | undefined;
    await expect
      .poll(
        async () => {
          const meenaPacks = await listMine(page, meenaToken);
          autoPack = meenaPacks.find((row) => row.name === packName && row.status === 'published');
          return Boolean(autoPack);
        },
        { timeout: 45_000 },
      )
      .toBe(true);
    expect(autoPack!.audience).toBe('selected');
    expect(autoPack!.audienceCompanyIds).toContain(RAVI);
    expect(autoPack!.showSourceShops).toBe(true);
    expect(
      (await listMine(page, meenaToken)).some(
        (row) => row.name === oldPackName && row.status === 'published',
      ),
    ).toBe(false);

    const raviExplore = await exploreCollections(page, raviToken);
    const raviSeesAuto = raviExplore.find((row) => row.id === autoPack!.id);
    expect(raviSeesAuto).toBeTruthy();
    expect(raviSeesAuto!.showSourceShops).toBe(true);
    expect((raviSeesAuto!.sourceShopNames ?? []).length).toBeGreaterThan(0);

    const issuedPhone = `+919811${String(Date.now()).slice(-6)}`;
    const issued = await page.request.post(`${API_URL}/auth/otp/request`, {
      data: { phone: issuedPhone },
    });
    expect(issued.ok()).toBeTruthy();
    const { devCode } = (await issued.json()) as { devCode?: string };
    expect(devCode).toBeTruthy();
    const verified = await page.request.post(`${API_URL}/auth/otp/verify`, {
      data: { phone: issuedPhone, code: devCode },
    });
    expect(verified.ok()).toBeTruthy();
    const session = (await verified.json()) as { tokens: { accessToken: string } };
    const onboard = await page.request.post(`${API_URL}/companies`, {
      headers: { authorization: `Bearer ${session.tokens.accessToken}` },
      data: {
        name: `T2 ${Date.now()}`,
        city: 'Surat',
        contactPerson: 'Trader Two',
        masterCategories: ['womens_unstitched'],
        buyCategories: ['saree'],
      },
    });
    expect(onboard.ok(), await onboard.text()).toBeTruthy();
    const onboarded = (await onboard.json()) as {
      tokens: { accessToken: string };
      company: { id: string };
    };
    const t2Token = onboarded.tokens.accessToken;
    const t2CompanyId = onboarded.company.id;

    await ensureFollow(page, t2Token, KAVITA, kavitaToken, t2CompanyId);
    await ensureFollow(page, t2Token, MEENA, meenaToken, t2CompanyId);

    const t2Before = await exploreCollections(page, t2Token);
    expect(t2Before.some((row) => row.id === millPack.id)).toBe(true);
    expect(t2Before.some((row) => row.id === autoPack!.id)).toBe(false);

    const reuse = await page.request.post(`${API_URL}/collections`, {
      headers: { authorization: `Bearer ${meenaToken}` },
      data: { name: packName, categories: [], repostSourceCollectionId: millPack.id },
    });
    expect(reuse.ok(), await reuse.text()).toBeTruthy();
    const reused = (await reuse.json()) as { id: string };
    expect(reused.id).toBe(autoPack!.id);
    const widen = await page.request.post(`${API_URL}/collections/${reused.id}/publish`, {
      headers: { authorization: `Bearer ${meenaToken}` },
      data: {
        audience: 'followers',
        rateVisibility: 'on_request',
        allowForward: true,
        showSourceShops: true,
        consentToSell: true,
      },
    });
    expect(widen.ok(), await widen.text()).toBeTruthy();

    const t2After = await exploreCollections(page, t2Token);
    expect(t2After.some((row) => row.id === millPack.id)).toBe(true);
    expect(t2After.some((row) => row.id === autoPack!.id)).toBe(true);

    const raviExploreAfter = await exploreCollections(page, raviToken);
    expect(raviExploreAfter.some((row) => row.id === autoPack!.id)).toBe(false);

    const meenaAfter = await listMine(page, meenaToken);
    expect(meenaAfter.filter((row) => row.name === packName && row.status === 'published')).toHaveLength(
      1,
    );
    const hop = meenaAfter.find((row) => row.id === autoPack!.id);
    expect(hop?.audience).toBe('followers');
    expect(hop?.audienceCompanyIds).toContain(RAVI);
  });
});
