# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: functional\photo-order-add.journey.spec.ts >> photo order add @functional @orders >> no separate Choose from gallery link on photo order
- Location: tests\functional\photo-order-add.journey.spec.ts:5:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000
Call log:
  - → POST http://127.0.0.1:3000/api/v1/auth/otp/request
    - user-agent: Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Mobile Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 25

```

# Test source

```ts
  1  | import type { Page } from '@playwright/test';
  2  | import { API_URL, WEB_URL } from './env';
  3  | 
  4  | export async function loginAs(page: Page, phone: string): Promise<void> {
> 5  |   const issued = await page.request.post(`${API_URL}/auth/otp/request`, {
     |                                     ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000
  6  |     data: { phone },
  7  |   });
  8  |   if (!issued.ok()) {
  9  |     throw new Error(`OTP request failed: ${issued.status()} ${await issued.text()}`);
  10 |   }
  11 | 
  12 |   const { devCode } = (await issued.json()) as { devCode?: string };
  13 |   if (!devCode) {
  14 |     throw new Error('OTP_EXPOSE_DEV_CODE must be enabled for e2e (missing devCode)');
  15 |   }
  16 | 
  17 |   const verified = await page.request.post(`${API_URL}/auth/otp/verify`, {
  18 |     data: { phone, code: devCode },
  19 |   });
  20 |   if (!verified.ok()) {
  21 |     throw new Error(`OTP verify failed: ${verified.status()} ${await verified.text()}`);
  22 |   }
  23 | 
  24 |   const session = (await verified.json()) as { tokens: unknown };
  25 |   await page.goto(WEB_URL);
  26 |   await page.evaluate((tokens) => {
  27 |     localStorage.setItem('ekum.tokens', JSON.stringify(tokens));
  28 |   }, session.tokens);
  29 |   await page.goto(WEB_URL);
  30 | }
  31 | 
```