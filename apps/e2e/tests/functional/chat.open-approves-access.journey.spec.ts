import { test, expect } from '@playwright/test';
import { accessTokenFromPage } from '../../helpers/orders';
import { loginAsKavita, loginAsMeena } from '../../helpers/persona';
import { API_URL } from '../../helpers/env';

const KAVITA_COMPANY = 'seed-company-kavita';
const MEENA_COMPANY = 'seed-company-meena';

test.describe('chat open approves access @functional @chat @network', () => {
  test('accepting access-request chat grants Connection without Network Approve', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const note = `E2E access open ${Date.now()}`;
    const created = await page.request.post(`${API_URL}/access-requests`, {
      headers: { Authorization: `Bearer ${meenaToken}` },
      data: { targetCompanyId: KAVITA_COMPANY, note },
    });
    expect(created.ok()).toBeTruthy();

    await loginAsKavita(page);
    const kavitaToken = await accessTokenFromPage(page);

    const incoming = await page.request.get(`${API_URL}/access-requests/incoming`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
    });
    expect(incoming.ok()).toBeTruthy();
    const incomingBody = (await incoming.json()) as Array<{ id: string; company: { id: string } }>;
    expect(incomingBody.some((row) => row.company.id === MEENA_COMPANY)).toBe(true);

    const threadsRes = await page.request.get(`${API_URL}/threads`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
      params: { limit: 40 },
    });
    expect(threadsRes.ok()).toBeTruthy();
    const threadsBody = (await threadsRes.json()) as {
      results: Array<{ id: string; counterpart?: { id: string } | null; title?: string | null }>;
    };
    // Prefer pending list, then any direct with Meena.
    const pendingRes = await page.request.get(`${API_URL}/threads`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
      params: { limit: 40, state: 'pending' },
    });
    const pendingBody = pendingRes.ok()
      ? ((await pendingRes.json()) as { results: Array<{ id: string; counterpart?: { id: string } }> })
      : { results: [] };
    const thread =
      pendingBody.results.find((row) => row.counterpart?.id === MEENA_COMPANY) ??
      threadsBody.results.find((row) => row.counterpart?.id === MEENA_COMPANY);
    expect(thread?.id).toBeTruthy();

    const accepted = await page.request.post(`${API_URL}/threads/${thread!.id}/accept`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
      data: {},
    });
    expect(accepted.ok()).toBeTruthy();

    const connections = await page.request.get(`${API_URL}/connections`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
    });
    expect(connections.ok()).toBeTruthy();
    const connectionRows = (await connections.json()) as Array<{
      company: { id: string };
      status: string;
    }>;
    expect(
      connectionRows.some((row) => row.company.id === MEENA_COMPANY && row.status === 'active'),
    ).toBe(true);

    const incomingAfter = await page.request.get(`${API_URL}/access-requests/incoming`, {
      headers: { Authorization: `Bearer ${kavitaToken}` },
    });
    const incomingAfterBody = (await incomingAfter.json()) as Array<{ company: { id: string } }>;
    expect(incomingAfterBody.some((row) => row.company.id === MEENA_COMPANY)).toBe(false);

    await page.goto('/network/connections');
    await expect(page.getByText(/Jaipur Emporium/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Connected').first()).toBeVisible();
  });
});
