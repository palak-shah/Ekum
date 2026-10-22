import { expect, test } from '@playwright/test';
import { API_URL } from '../../helpers/env';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';

type PackDetail = {
  id: string;
  rate: number | null;
  rateUnit?: string | null;
  products: Array<{
    rate: number | null;
    unit: string | null;
    dispatchUnit?: string | null;
    piecesPerPack?: number | null;
  }>;
};

async function fetchPack(request: import('@playwright/test').APIRequestContext, token: string, id: string) {
  const res = await request.get(`${API_URL}/collections/${id}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return res.json() as Promise<PackDetail>;
}

test.describe('pack Rate per + clear set size @functional @release @collections @orders', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('Explore ₹91/mtr; 0 clears pack; How many withholds ₹', async ({ page, request }) => {
    test.setTimeout(180_000);
    const name = `Picasso ${Date.now()}`;

    await loginAsRavi(page);
    await page.goto('/catalog/collections/new');
    await page.getByTestId('collection-add-designs').click();
    await expect(page.getByPlaceholder('Search by name')).toBeVisible({ timeout: 8_000 });
    await page.getByPlaceholder('Search by name').fill('Banarasi');
    await page
      .getByRole('dialog')
      .locator('button')
      .filter({ has: page.locator('img') })
      .first()
      .click();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByLabel('Collection name').fill(name);
    await page.getByTestId('collection-master-category').selectOption({ index: 1 });
    await page.getByTestId('collection-rate-from').fill('91');
    await page.getByTestId('collection-order-dispatch-toggle').click();
    await page.getByTestId('collection-set-contains').fill('39');
    await expect(page.getByTestId('collection-apply-all')).not.toBeChecked();
    await page.getByTestId('collection-create-dock').getByRole('button', { name: 'Create & Publish' }).click();
    const applyPackRate = page.getByTestId('collection-rate-change');
    if (await applyPackRate.isVisible().catch(() => false)) {
      await applyPackRate.click();
    }
    await expect(page.getByText(/Published|Collection saved/i).first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page).toHaveURL(/\/catalog/, { timeout: 20_000 });

    const catalogLink = page.getByRole('link', { name: new RegExp(name) }).first();
    await expect(catalogLink).toBeVisible({ timeout: 20_000 });
    const href = await catalogLink.getAttribute('href');
    expect(href).toMatch(/\/collections\//);
    const id = href!.split('/').filter(Boolean).pop()!;

    await page.goto(`/catalog/collections/${id}`);
    await expect(page.getByTestId('collection-edit-details')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-rate-unit').selectOption('mtr');
    await page.getByTestId('collection-editor-update').click();
    await expect(page.getByText('Updated').first()).toBeVisible({ timeout: 30_000 });

    const token = await accessTokenFromPage(page);
    const stamped = await fetchPack(request, token, id);
    expect(stamped.rate).toBe(91);
    expect(stamped.rateUnit).toBe('mtr');
    expect(stamped.products[0]?.dispatchUnit).toBe('mtr');
    expect(stamped.products[0]?.piecesPerPack).toBe(39);

    await loginAsMeena(page);
    await page.goto('/explore');
    await page.getByText('Search supplier, collection or design').click();
    await page.getByLabel('Search').fill(name);
    await expect(page.getByText('₹91/mtr').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('₹91/pc')).toHaveCount(0);

    await loginAsRavi(page);
    await page.goto(`/catalog/collections/${id}`);
    await expect(page.getByTestId('collection-edit-details')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('collection-order-dispatch-toggle').click();
    await page.getByTestId('collection-set-contains').fill('0');
    await page.getByTestId('collection-apply-all').click();
    await expect(page.getByTestId('collection-apply-all')).toBeChecked();
    await page.getByTestId('collection-editor-update').click();
    await expect(page.getByText('Updated').first()).toBeVisible({ timeout: 30_000 });

    const raviToken = await accessTokenFromPage(page);
    const cleared = await fetchPack(request, raviToken, id);
    expect(cleared.products[0]?.piecesPerPack).toBeNull();

    await loginAsMeena(page);
    await page.goto(href!);
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: 'Select' }).click();
    await page.getByRole('button', { name: 'Select all' }).click();
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(page.getByTestId('how-many-lines')).toBeVisible({ timeout: 15_000 });
    const qty = page.getByRole('group', { name: /Sets for/i }).getByRole('textbox');
    await qty.click();
    await qty.pressSequentially('3');
    await expect(page.getByTestId('how-many-sets-summary')).toHaveText(/3 sets/);
    await expect(page.getByTestId('how-many-sets-summary')).not.toContainText('117');
    await expect(page.getByTestId('how-many-billing-total')).toHaveCount(0);
    await expect(page.getByText('₹10,647')).toHaveCount(0);
    await expect(page.getByText('₹3,549')).toHaveCount(0);
    await expect(page.getByText('No pcs in a set').first()).toBeVisible();
    await expect(page.getByText('₹91/mtr').first()).toBeVisible();
  });
});
