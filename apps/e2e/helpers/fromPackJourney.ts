import { expect, type Page } from '@playwright/test';
import { accessTokenFromPage } from './orders';
import { API_URL } from './env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from './persona';
import { publishRepostNew } from './repost';
import { createDirectLink, grantPackAccess, resetTradeLanesToMe } from './tradeLanes';

export type FromPackResult = {
  downstream: { id: string } | null;
  directs: Array<{
    id: string;
    sellerCompanyId: string;
    threadId?: string | null;
    facilitatorCompanyId?: string | null;
    tradeMode?: string;
  }>;
  failures: Array<{ sellerCompanyId: string; code: string; message: string }>;
};

async function fillHowManyQty(page: Page): Promise<void> {
  const qtyBoxes = page.getByRole('textbox', {
    name: /^(pieces|sets|metres|pcs|mtrs) for /i,
  });
  const qtyCount = await qtyBoxes.count();
  expect(qtyCount).toBeGreaterThan(0);
  for (let i = 0; i < qtyCount; i += 1) {
    await qtyBoxes.nth(i).fill('12');
  }
}

async function clickHowManyPlace(page: Page): Promise<FromPackResult> {
  const placedWait = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST') return false;
    return /\/orders\/from-pack\/?$/.test(new URL(res.url()).pathname);
  });
  await page.getByTestId('how-many-place-order').click();
  const placed = await placedWait;
  if (!placed.ok()) {
    throw new Error(`from-pack failed: ${placed.status()} ${await placed.text()}`);
  }
  const body = (await placed.json()) as FromPackResult;
  if ((body.failures ?? []).length > 0) {
    throw new Error(`from-pack mill failures: ${JSON.stringify(body.failures)}`);
  }
  return body;
}

function mergeFromPack(first: FromPackResult, second: FromPackResult): FromPackResult {
  return {
    downstream: second.downstream ?? first.downstream,
    directs: [...(first.directs ?? []), ...(second.directs ?? [])],
    failures: [...(first.failures ?? []), ...(second.failures ?? [])],
  };
}

/** Dual-role Ravi Places a peer pack from How many (not Order for buyer). */
export async function raviPlaceFromHowMany(
  page: Page,
  opts?: { sequential?: boolean; firstGoesTo?: RegExp; secondGoesTo?: RegExp },
): Promise<FromPackResult> {
  await page.getByTestId('collection-select').click();
  await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('select-all-float-select-all').click();
  await expect(page.getByTestId('selection-workspace-order')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('selection-workspace-order').click();
  await expect(page.getByTestId('how-many-place-order')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('how-many-choose-buyer')).toHaveCount(0);

  if (opts?.firstGoesTo) {
    await expect(page.getByText(opts.firstGoesTo)).toBeVisible();
  }

  await fillHowManyQty(page);
  const first = await clickHowManyPlace(page);
  if (!opts?.sequential) return first;

  await expect(page.getByTestId('how-many-place-order')).toBeVisible({ timeout: 15_000 });
  if (opts.secondGoesTo) {
    await expect(page.getByText(opts.secondGoesTo).first()).toBeVisible();
  }
  await fillHowManyQty(page);
  const second = await clickHowManyPlace(page);
  return mergeFromPack(first, second);
}

/** Look-only seed follow cannot curate Kavita — mill must grant pack first. */
export async function grantMeenaPackOnKavita(page: Page): Promise<void> {
  await loginAsKavita(page);
  const kavitaToken = await accessTokenFromPage(page);
  await grantPackAccess(page.request, kavitaToken, 'seed-company-meena');
}

/** Meena publishes A+B pack; Ravi places from-pack. */
export async function placeCuratedABPack(
  page: Page,
  opts?: { directMillCompanyId?: string },
): Promise<FromPackResult> {
  const packName = `A+B pack ${Date.now()}`;

  await grantMeenaPackOnKavita(page);
  await loginAsMeena(page);

  await page.goto('/collections/seed-col-1');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('button').filter({ has: page.locator('img') }).first().click({
    button: 'right',
  });
  await expect(page.getByTestId('select-all-float')).toBeVisible({ timeout: 10_000 });

  await page.goto('/collections/seed-col-fabric');
  await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 });
  await page.locator('button').filter({ has: page.locator('img') }).first().click({
    button: 'right',
  });
  await expect(page.getByTestId('selection-workspace-bar')).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId('selection-workspace-cart').click();
  await page.goto('/selection');
  await page.getByTestId('selection-curate').click();
  await expect(page.getByRole('heading', { name: 'Repost' })).toBeVisible({
    timeout: 15_000,
  });
  const collectionId = await publishRepostNew(page, packName);

  const meenaToken = await accessTokenFromPage(page);
  const packRes = await page.request.get(`${API_URL}/collections/${collectionId}`, {
    headers: { authorization: `Bearer ${meenaToken}` },
  });
  expect(packRes.ok()).toBeTruthy();
  const pack = (await packRes.json()) as {
    products: Array<{ id: string; companyId: string }>;
  };
  const productIds = pack.products.map((product) => product.id);
  const owners = new Set(pack.products.map((product) => product.companyId));
  expect(owners.has('seed-company-ravi')).toBe(true);
  expect(owners.has('seed-company-kavita')).toBe(true);
  await resetTradeLanesToMe(page.request, meenaToken, 'seed-company-ravi');

  await loginAsRavi(page);
  const raviFollowToken = await accessTokenFromPage(page);
  await page.request.post(`${API_URL}/follows`, {
    headers: { authorization: `Bearer ${raviFollowToken}` },
    data: { companyId: 'seed-company-meena' },
  });
  await page.request.post(`${API_URL}/follows/decide`, {
    headers: { authorization: `Bearer ${meenaToken}` },
    data: { followerCompanyId: 'seed-company-ravi', decision: 'look' },
  });
  if (opts?.directMillCompanyId) {
    await createDirectLink(
      page.request,
      meenaToken,
      opts.directMillCompanyId,
      'seed-company-ravi',
    );
  }

  await page.goto(`/collections/${collectionId}`);
  await expect(page.getByRole('heading', { name: packName })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Order goes to Jaipur Emporium/i)).toBeVisible();

  if (opts?.directMillCompanyId) {
    return raviPlaceFromHowMany(page, {
      sequential: true,
      firstGoesTo: /Order goes to Ahmedabad Loom Co/i,
      secondGoesTo: /Order goes to Jaipur Emporium/i,
    });
  }
  return raviPlaceFromHowMany(page);
}
