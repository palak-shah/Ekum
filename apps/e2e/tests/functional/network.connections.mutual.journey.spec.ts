import { test, expect } from '@playwright/test';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

test.describe('mutual connections @functional @network', () => {
  test('each side sees one Connected card for the seed pair', async ({ page }) => {
    await loginAsRavi(page);
    await page.goto('/network/connections');
    await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();

    const jaipur = page.getByText(/Jaipur Emporium/i);
    await expect(jaipur.first()).toBeVisible({ timeout: 15_000 });
    expect(await jaipur.count()).toBe(1);
    await expect(page.getByText('Connected').first()).toBeVisible();
    await expect(page.getByText(/They buy from you|You buy from them/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Pause' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Block' }).first()).toBeVisible();

    await loginAsMeena(page);
    await page.goto('/network/connections');
    await expect(page.getByRole('heading', { name: 'Connections' })).toBeVisible();

    const surat = page.getByText(/Surat Silk House/i);
    await expect(surat.first()).toBeVisible({ timeout: 15_000 });
    expect(await surat.count()).toBe(1);
    await expect(page.getByText('Connected').first()).toBeVisible();
    await expect(page.getByText(/They buy from you|You buy from them/i)).toHaveCount(0);
  });
});
