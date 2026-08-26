# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: functional\photo-order-add.journey.spec.ts >> photo order add phone @functional @orders >> Add photos opens continuous camera with Gallery in chrome
- Location: tests\functional\photo-order-add.journey.spec.ts:24:7

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3000
Call log:
  - → POST http://127.0.0.1:3000/api/v1/auth/otp/request
    - user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1
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