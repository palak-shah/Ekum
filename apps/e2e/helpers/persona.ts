import type { Page } from '@playwright/test';
import { loginAs } from './auth';
import { PHONES } from './env';

export async function loginAsMeena(page: Page): Promise<void> {
  await loginAs(page, PHONES.meena);
}

export async function loginAsRavi(page: Page): Promise<void> {
  await loginAs(page, PHONES.ravi);
}

export { PHONES };
