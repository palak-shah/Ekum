import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';

const KAVITA_COMPANY = 'seed-company-kavita';

async function resetFollow(page: { request: { delete: typeof import('@playwright/test').APIRequestContext['delete'] } }, token: string) {
  await page.request.delete(`${API_URL}/follows/${KAVITA_COMPANY}`, {
    headers: { authorization: `Bearer ${token}` },
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
    await expect(follow).toHaveText('Request catalog access');
    await follow.click();
    await expect(follow).toHaveText('Requested', { timeout: 10_000 });

    await loginAsKavita(page);
    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'They see mine' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Asked' })).toHaveCount(0);
    await expect(page.getByTestId('follow-ask-row')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Jaipur Emporium/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Asked/ })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'They can see my collections' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'They can share my collections' })).not.toBeChecked();
    await page.getByRole('button', { name: 'Allow' }).click();
    await expect(page.getByTestId('follow-ask-row')).toHaveCount(0, { timeout: 10_000 });

    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'They see mine' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('they-see-mine-search')).toBeVisible();
    await expect(page.getByRole('button', { name: /Seeing collections/ })).toHaveCount(0);
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
    await expect(page.getByTestId('company-follow')).toHaveText('Has access', { timeout: 15_000 });

    await loginAsKavita(page);
    await page.goto('/network/followers');
    await expect(page.getByRole('heading', { name: 'They see mine' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(meenaRow.getByRole('button', { name: 'Stop them seeing' })).toBeVisible();
    await meenaRow.getByRole('button', { name: 'Stop them seeing' }).click();
    await expect(meenaRow.getByText(/Jaipur Emporium/i)).toBeVisible({ timeout: 10_000 });
    await expect(meenaRow.getByText('Stopped')).toBeVisible();
    await expect(meenaRow.getByRole('button', { name: 'Stop them seeing' })).toHaveCount(0);

    await page.goto('/network');
    await expect(page.getByRole('link', { name: /I see theirs/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /They see mine/ })).toBeVisible();
    await expect(page.getByText('Following', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Followers', { exact: true })).toHaveCount(0);

    await loginAsMeena(page);
    await page.goto(`/company/${KAVITA_COMPANY}`);
    await expect(page.getByTestId('company-follow')).toHaveText('Request catalog access', {
      timeout: 15_000,
    });

    await resetFollow(page, await accessTokenFromPage(page));
  });
});
