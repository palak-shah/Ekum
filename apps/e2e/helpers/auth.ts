import type { Page } from '@playwright/test';
import { API_URL, WEB_URL } from './env';

export async function loginAs(page: Page, phone: string): Promise<void> {
  const issued = await page.request.post(`${API_URL}/auth/otp/request`, {
    data: { phone },
  });
  if (!issued.ok()) {
    throw new Error(`OTP request failed: ${issued.status()} ${await issued.text()}`);
  }

  const { devCode } = (await issued.json()) as { devCode?: string };
  if (!devCode) {
    throw new Error('OTP_EXPOSE_DEV_CODE must be enabled for e2e (missing devCode)');
  }

  const verified = await page.request.post(`${API_URL}/auth/otp/verify`, {
    data: { phone, code: devCode },
  });
  if (!verified.ok()) {
    throw new Error(`OTP verify failed: ${verified.status()} ${await verified.text()}`);
  }

  const session = (await verified.json()) as { tokens: unknown };
  await page.goto(WEB_URL);
  await page.evaluate((tokens) => {
    localStorage.setItem('ekum.tokens', JSON.stringify(tokens));
  }, session.tokens);
  await page.goto(WEB_URL);
}
