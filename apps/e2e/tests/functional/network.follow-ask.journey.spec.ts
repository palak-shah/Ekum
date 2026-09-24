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
    await expect(follow).toHaveText('Follow');
    await follow.click();
    await expect(follow).toHaveText('Pending', { timeout: 10_000 });

    await loginAsKavita(page);
    await page.goto('/network/followers?tab=asked');
    await expect(page.getByTestId('follow-ask-row')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Jaipur Emporium/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Look through' }).click();
    await expect(page.getByTestId('follow-ask-row')).toHaveCount(0, { timeout: 10_000 });

    await loginAsMeena(page);
    await page.goto(`/company/${KAVITA_COMPANY}`);
    await expect(page.getByTestId('company-follow')).toHaveText('Following', { timeout: 15_000 });

    await resetFollow(page, await accessTokenFromPage(page));
  });
});
