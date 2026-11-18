import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

const KAVITA_COMPANY = 'seed-company-kavita';

async function resetFollow(
  page: { request: { delete: typeof import('@playwright/test').APIRequestContext['delete'] } },
  token: string,
) {
  await page.request.delete(`${API_URL}/follows/${KAVITA_COMPANY}`, {
    headers: { authorization: `Bearer ${token}` },
  });
}

/** Restore seed Meena→Kavita look so later from-pack / shop journeys stay green. */
async function restoreSeedFollow(
  page: {
    request: {
      post: typeof import('@playwright/test').APIRequestContext['post'];
    };
  },
  meenaToken: string,
  kavitaToken: string,
) {
  await page.request.post(`${API_URL}/follows`, {
    headers: { authorization: `Bearer ${meenaToken}` },
    data: { companyId: KAVITA_COMPANY },
  });
  await page.request.post(`${API_URL}/follows/decide`, {
    headers: { authorization: `Bearer ${kavitaToken}` },
    data: { followerCompanyId: 'seed-company-meena', decision: 'look' },
  });
}

test.describe('follow-ask extra gate @functional @network', () => {
  test('ask stays pending until the shop allows look-through', async ({ page }) => {
    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    await resetFollow(page, meenaToken);

    await page.goto(`/company/${KAVITA_COMPANY}`);
    const follow = page.getByTestId('company-follow');
    await expect(follow).toBeVisible({ timeout: 15_000 });
    await expect(follow).toHaveText('Follow');
    await follow.click();
    await expect(follow).toHaveText('Requested', { timeout: 10_000 });

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);
    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'Followers' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('follow-ask-row')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Jaipur Emporium/i).first()).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Allow Repost' })).not.toBeChecked();
    await page.getByRole('button', { name: 'Accept' }).click();
    await expect(page.getByTestId('follow-ask-row')).toHaveCount(0, { timeout: 10_000 });

    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'Followers' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('they-see-mine-search')).toBeVisible();
    const meenaRow = page.getByTestId('follow-allowed-row-seed-company-meena');
    await expect(meenaRow.getByText(/Jaipur Emporium/i)).toBeVisible();
    await expect(meenaRow.getByRole('button', { name: 'Stop them seeing' })).toBeVisible();
    await page.getByTestId('they-see-mine-search').fill('Jaipur');
    await expect(meenaRow).toBeVisible();
    await page.getByTestId('they-see-mine-search').fill('zzzz-no-match');
    await expect(page.getByText('No businesses match')).toBeVisible();
    await page.getByTestId('they-see-mine-search').fill('');

    await loginAsMeena(page);
    await page.goto(`/company/${KAVITA_COMPANY}`);
    await expect(page.getByTestId('company-follow')).toHaveText('Following', { timeout: 15_000 });

    await loginAsKavita(page);
    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'Followers' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(meenaRow.getByRole('button', { name: 'Stop them seeing' })).toBeVisible();
    await meenaRow.getByRole('button', { name: 'Stop them seeing' }).click();
    // Affected Direct links open a confirm sheet — wait briefly, then Continue if present.
    const revokeContinue = page.getByTestId('direct-link-revoke-continue');
    try {
      await revokeContinue.waitFor({ state: 'visible', timeout: 5_000 });
      await revokeContinue.click();
    } catch {
      /* no Direct-link confirm — Stop applied immediately */
    }
    await expect(meenaRow.getByText(/Jaipur Emporium/i)).toBeVisible({ timeout: 10_000 });
    await expect(meenaRow.getByText('Stopped')).toBeVisible({ timeout: 15_000 });
    await expect(meenaRow.getByRole('button', { name: 'Stop them seeing' })).toHaveCount(0);

    await page.goto('/network');
    await expect(page.getByRole('link', { name: /Following/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Followers/ })).toBeVisible();

    await loginAsMeena(page);
    await page.goto(`/company/${KAVITA_COMPANY}`);
    await expect(page.getByTestId('company-follow')).toHaveText('Follow', {
      timeout: 15_000,
    });

    await restoreSeedFollow(page, await accessTokenFromPage(page), kavitaToken);
  });
});
