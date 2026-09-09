import { test, expect } from '@playwright/test';
import { accessTokenFromPage, createOrder } from '../../helpers/orders';
import { API_URL } from '../../helpers/env';
import { loginAsMeena, loginAsRavi } from '../../helpers/persona';
import { resetTradeLanesToMe } from '../../helpers/tradeLanes';

test.describe('TradeLane reveal On @functional @orders', () => {
  test('see-each-other opens one trio after Send; Send-hold keeps mill out', async ({ page }) => {
    await loginAsRavi(page);
    await resetTradeLanesToMe(page.request, await accessTokenFromPage(page));

    await loginAsMeena(page);
    const meenaToken = await accessTokenFromPage(page);
    const created = await createOrder(page.request, meenaToken, {
      sellerCompanyId: 'seed-company-ravi',
      orderPathPreference: 'handle',
      items: [{ productId: 'seed-prod-fabric-1', quantity: 20 }],
    });

    await loginAsRavi(page);
    const raviToken = await accessTokenFromPage(page);
    const auth = { authorization: `Bearer ${raviToken}` };

    const beforeSend = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth,
    });
    expect(beforeSend.ok()).toBeTruthy();
    const held = (await beforeSend.json()) as {
      millDesks: Array<{
        upstreamOrderId: string;
        sellerCompanyId: string;
        held: boolean;
        reveal: boolean;
        revealThreadId: string | null;
      }>;
      counterpart: { name: string };
    };
    const desk = held.millDesks.find((row) => row.held) ?? held.millDesks[0];
    expect(desk).toBeTruthy();
    expect(desk!.reveal).toBe(false);
    expect(desk!.revealThreadId).toBeNull();

    const revealWhileHeld = await page.request.post(
      `${API_URL}/orders/${created.id}/mill-reveal`,
      {
        headers: auth,
        data: { upstreamOrderId: desk!.upstreamOrderId, reveal: true },
      },
    );
    expect(revealWhileHeld.ok()).toBeTruthy();
    const heldOn = (await revealWhileHeld.json()) as {
      millDesks: Array<{ reveal: boolean; revealThreadId: string | null; held: boolean }>;
    };
    const heldDesk = heldOn.millDesks.find((row) => row.held) ?? heldOn.millDesks[0];
    expect(heldDesk?.reveal).toBe(true);
    expect(heldDesk?.revealThreadId).toBeNull();

    await page.goto(`/orders/${created.id}`);
    await expect(page.getByTestId(`order-mill-reveal-${desk!.upstreamOrderId}`)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /Send to / }).click();
    await expect(page.getByText('Sent.')).toBeVisible({ timeout: 15_000 });

    const afterSend = await page.request.get(`${API_URL}/orders/${created.id}`, {
      headers: auth,
    });
    const sent = (await afterSend.json()) as {
      millDesks: Array<{
        upstreamOrderId: string;
        sellerCompanyId: string;
        reveal: boolean;
        revealThreadId: string | null;
        held: boolean;
      }>;
      threadId: string | null;
    };
    const released = sent.millDesks.find((row) => row.upstreamOrderId === desk!.upstreamOrderId);
    expect(released?.held).toBe(false);
    expect(released?.reveal).toBe(true);
    expect(released?.revealThreadId).toBeTruthy();
    // Parent Open chat stays buyer↔trader 1:1; trio is on the mill desk only (BM-08).
    expect(sent.threadId).toBeTruthy();
    expect(sent.threadId).not.toBe(released?.revealThreadId);

    const mainThreadRes = await page.request.get(`${API_URL}/threads/${sent.threadId}`, {
      headers: auth,
    });
    expect(mainThreadRes.ok()).toBeTruthy();
    const mainThread = (await mainThreadRes.json()) as {
      type: string;
      participants: Array<{ companyId: string }>;
    };
    expect(mainThread.type).toBe('direct');
    expect(new Set(mainThread.participants.map((p) => p.companyId))).toEqual(
      new Set(['seed-company-ravi', 'seed-company-meena']),
    );

    const threadRes = await page.request.get(`${API_URL}/threads/${released!.revealThreadId}`, {
      headers: auth,
    });
    expect(threadRes.ok()).toBeTruthy();
    const thread = (await threadRes.json()) as {
      type: string;
      participants: Array<{ companyId: string }>;
    };
    expect(thread.type).toBe('group');
    const companyIds = new Set(thread.participants.map((p) => p.companyId));
    expect(companyIds).toEqual(
      new Set(['seed-company-ravi', desk!.sellerCompanyId, 'seed-company-meena']),
    );

    const flipOff = await page.request.post(`${API_URL}/orders/${created.id}/mill-reveal`, {
      headers: auth,
      data: { upstreamOrderId: desk!.upstreamOrderId, reveal: false },
    });
    expect(flipOff.ok()).toBeTruthy();
    const off = (await flipOff.json()) as {
      millDesks: Array<{ reveal: boolean; revealThreadId: string | null }>;
      threadId: string | null;
    };
    const offDesk = off.millDesks.find((row) => row.upstreamOrderId === desk!.upstreamOrderId);
    expect(offDesk?.reveal).toBe(false);
    expect(offDesk?.revealThreadId).toBeNull();

    const stillThere = await page.request.get(`${API_URL}/threads/${released!.revealThreadId}`, {
      headers: auth,
    });
    expect(stillThere.ok()).toBeTruthy();
  });
});
