import { test, expect } from '@playwright/test';
import { loginAsMeena } from '../../helpers/persona';

test.describe('chat group info @functional @chat', () => {
  test('title opens group page with businesses, search, add, and share', async ({ page }) => {
    await loginAsMeena(page);
    await page.goto('/chats/seed-group-1');
    await page.getByRole('link', { name: /Wedding circle/ }).click();
    await expect(page).toHaveURL(/\/chats\/seed-group-1\/info/);
    await expect(page.getByText('2 businesses')).toBeVisible();
    await expect(page.getByTestId('group-info-photo')).toBeVisible();
    await page.getByTestId('group-info-name').click();
    await expect(page.getByRole('textbox', { name: 'Group name' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByTestId('group-info-description').click();
    await expect(page.getByRole('textbox', { name: 'One line' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Rates and pcs for wedding lots')).toBeVisible();
    await expect(page.getByTestId('group-info-company-seed-company-meena')).toBeVisible();
    await expect(page.getByTestId('group-info-company-seed-company-ravi')).toBeVisible();
    await expect(page.getByTestId('group-info-team-list')).toBeVisible();
    await expect(page.getByTestId('group-info-person-seed-user-meena')).toBeVisible();
    await expect(page.getByText('Your team')).toBeVisible();
    await page.getByTestId('group-info-team-add').click();
    await expect(page.getByRole('heading', { name: 'Team on chat' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByTestId('group-info-search').fill('surat');
    await expect(page.getByTestId('group-info-company-seed-company-ravi')).toBeVisible();
    await expect(page.getByTestId('group-info-company-seed-company-meena')).toHaveCount(0);
    await expect(page.getByTestId('group-info-team-list')).toHaveCount(0);

    await page.getByTestId('group-info-search').fill('');
    await page.getByTestId('group-info-add').click();
    await expect(page.getByRole('heading', { name: 'Add businesses' })).toBeVisible();
    await expect(page.getByTestId('group-info-invite')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByTestId('group-info-tab-media').click();
    await expect(page.getByTestId('group-info-media-photos')).toBeVisible();
    await expect(page.getByTestId('group-info-media-documents')).toBeVisible();
    await expect(page.getByTestId('group-info-media-designs')).toBeVisible();
    await expect(page.getByTestId('group-info-media-collections')).toBeVisible();

    await page.getByTestId('group-info-tab-settings').click();
    await expect(page.getByTestId('group-info-mute')).toBeVisible();
    await expect(page.getByTestId('group-info-pin')).toBeVisible();
  });
});

