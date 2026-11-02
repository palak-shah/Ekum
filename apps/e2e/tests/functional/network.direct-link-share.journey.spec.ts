import { test, expect, type Page } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { createDirectLink, resetTradeLanesToMe } from '../../helpers/tradeLanes';

const KAVITA = 'seed-company-kavita';
const MEENA = 'seed-company-meena';
const RAVI = 'seed-company-ravi';
const KAVITA_REQUEST = 'picker-request-seed-company-kavita';

type FollowAsk = { company: { id: string }; kind?: string };

async function auth(page: Page, token: string) {
  return { authorization: `Bearer ${token}` };
}

async function ensureMeenaLookOnKavita(page: Page): Promise<void> {
  await loginAsMeena(page);
  const meenaToken = await accessTokenFromPage(page);
  await page.request.post(`${API_URL}/follows`, {
    headers: await auth(page, meenaToken),
    data: { companyId: KAVITA },
  });

  await loginAsKavita(page);
  const kavitaToken = await accessTokenFromPage(page);
  const asksRes = await page.request.get(`${API_URL}/follows/asks`, {
    headers: await auth(page, kavitaToken),
  });
  expect(asksRes.ok(), await asksRes.text()).toBeTruthy();
  const asks = (await asksRes.json()) as FollowAsk[];
  const meenaAsk = asks.find((row) => row.company.id === MEENA);
  if (meenaAsk?.kind === 'share') {
    const deny = await page.request.post(`${API_URL}/follows/decide`, {
      headers: await auth(page, kavitaToken),
      data: { followerCompanyId: MEENA, decision: 'deny' },
    });
    expect(deny.ok(), await deny.text()).toBeTruthy();
  } else if (meenaAsk) {
    const allowLook = await page.request.post(`${API_URL}/follows/decide`, {
      headers: await auth(page, kavitaToken),
      data: { followerCompanyId: MEENA, decision: 'look' },
    });
    expect(allowLook.ok(), await allowLook.text()).toBeTruthy();
  }

  const look = await page.request.patch(`${API_URL}/follows/${MEENA}/access`, {
    headers: await auth(page, kavitaToken),
    data: { accessKind: 'look' },
  });
  expect(look.ok(), await look.text()).toBeTruthy();

  const leftoverRes = await page.request.get(`${API_URL}/follows/asks`, {
    headers: await auth(page, kavitaToken),
  });
  const leftover = (await leftoverRes.json()) as FollowAsk[];
  if (leftover.some((row) => row.company.id === MEENA && row.kind === 'share')) {
    const clear = await page.request.post(`${API_URL}/follows/decide`, {
      headers: await auth(page, kavitaToken),
      data: { followerCompanyId: MEENA, decision: 'deny' },
    });
    expect(clear.ok(), await clear.text()).toBeTruthy();
  }
}

async function ensureRaviFollowsMeena(page: Page, meenaToken: string): Promise<void> {
  await loginAsRavi(page);
  const raviToken = await accessTokenFromPage(page);
  await page.request.post(`${API_URL}/follows`, {
    headers: await auth(page, raviToken),
    data: { companyId: MEENA },
  });
  await page.request.post(`${API_URL}/follows/decide`, {
    headers: await auth(page, meenaToken),
    data: { followerCompanyId: RAVI, decision: 'look' },
  });
}

test.describe('Direct Link Request share @functional @network', () => {
  test.setTimeout(120_000);

  test('Look mill cannot be selected until Share is granted; revoke grays the row', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ensureMeenaLookOnKavita(page);

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await resetTradeLanesToMe(page.request, meenaToken, RAVI);
    await ensureRaviFollowsMeena(page, meenaToken);

    await loginAsMeena(page);
    await page.goto('/network/direct-links');
    await expect(page.getByTestId('direct-links-page')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('paths-new').click();
    await expect(page.getByRole('heading', { name: 'New Direct link' })).toBeVisible();
    const requestShare = page.getByTestId(KAVITA_REQUEST);
    await expect(requestShare).toHaveText('Request share');
    await requestShare.click();
    await expect(requestShare).toHaveText('Requested', { timeout: 10_000 });

    await loginAsKavita(page);
    await page.goto('/chats?inbox=requests');
    const millAsk = page.getByTestId(`chats-see-packs-ask-${MEENA}`);
    await expect(millAsk.getByText('Wants to share all your collections')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      millAsk.getByText(
        'They can put your collections in their catalog and send them to their buyers.',
      ),
    ).toBeVisible();
    await millAsk.getByRole('button', { name: 'Allow' }).click();
    await expect(page.getByTestId(`chats-see-packs-ask-${MEENA}`)).toHaveCount(0, {
      timeout: 10_000,
    });

    await loginAsMeena(page);
    await page.goto('/network/direct-links');
    await page.getByTestId('paths-new').click();
    await expect(page.getByTestId(KAVITA_REQUEST)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText('Select').first()).toBeVisible();

    await createDirectLink(page.request, meenaToken, KAVITA, RAVI);

    await loginAsKavita(page);
    const millToken = await accessTokenFromPage(page);
    const look = await page.request.patch(`${API_URL}/follows/${MEENA}/access`, {
      headers: await auth(page, millToken),
      data: { accessKind: 'look' },
    });
    expect(look.ok(), await look.text()).toBeTruthy();

    await loginAsMeena(page);
    await page.goto('/network/direct-links');
    await expect(page.getByTestId('direct-links-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Request share').first()).toBeVisible({ timeout: 15_000 });
  });
});
