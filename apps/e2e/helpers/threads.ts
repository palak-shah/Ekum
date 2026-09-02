import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function startDirectThread(
  request: APIRequestContext,
  accessToken: string,
  companyId: string,
): Promise<{ id: string; threadId?: string }> {
  const res = await request.post(`${API_URL}/threads/direct`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { companyId },
  });
  if (!res.ok()) {
    throw new Error(`start direct thread failed: ${res.status()} ${await res.text()}`);
  }
  const body = (await res.json()) as { id: string };
  return body;
}

export async function sendThreadMessage(
  request: APIRequestContext,
  accessToken: string,
  threadId: string,
  body: string,
): Promise<{ id: string }> {
  const res = await request.post(`${API_URL}/threads/${threadId}/messages`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: { type: 'text', body },
  });
  if (!res.ok()) {
    throw new Error(`send message failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string }>;
}
