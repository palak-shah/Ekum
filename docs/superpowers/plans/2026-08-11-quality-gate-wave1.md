# Quality Gate Wave 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up web unit tests + Playwright smoke for chat/orders, encode the senior feature gate in Cursor rules, and wire CI so UI regressions (BM-01+) and a seed trade path cannot silently break.

**Architecture:** Keep API Vitest as-is. Add Vitest + Testing Library inside `@ekum/web` for pure helpers and `PhotoAlbum`. Add `@ekum/e2e` (Playwright) that boots against local API+web, logs in via OTP `devCode`, and covers seed chat + order-card overflow. Extend existing always-on Cursor rules so every feature gets architect/UX challenge + test matrix + bug-mode coverage.

**Tech Stack:** Vitest 2, `@testing-library/react`, jsdom, Playwright, pnpm workspaces, existing Nest OTP (`OTP_EXPOSE_DEV_CODE`), seed phones `+919800000001` / `+919800000002`.

## Global Constraints

- Feature gate from `docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md` is mandatory on every feature.
- Actors on order cards: **You** / business name — never Seller/Buyer in body copy.
- Living order reference: one chat message per order; rich for create/quote; compact later.
- Web unit tests join `pnpm test` via `@ekum/web` `test` script.
- Playwright `@smoke` is the CI subset; full tags grow in later waves.
- Prefer testing helpers + small components over mounting `ThreadPage`.
- Do not claim done without running the relevant tests and confirming pass.
- Commits only when the user asks (plan steps say “Commit” — skip unless requested).

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/vitest.config.ts` | Web Vitest (jsdom, `@` alias) |
| `apps/web/package.json` | `test` script + vitest/RTL deps |
| `apps/web/src/features/chats/PhotoAlbum.tsx` | `data-testid` on overflow label |
| `apps/web/src/features/chats/PhotoAlbum.test.tsx` | BM-01 overflow for 1–4 layouts |
| `apps/web/src/features/chats/orderCardCopy.test.ts` | Rich/compact, dedupe, actor copy |
| `apps/web/src/features/chats/threadMessageSearch.test.ts` | Match + hit order + empty-q |
| `apps/web/src/test/messageFixtures.ts` | Minimal `MessageView` builders |
| `.cursor/rules/feature-tests-required.mdc` | Extend: web + E2E + challenge + matrix |
| `.cursor/rules/quality-feature-gate.mdc` | Standing architect/UX gate (alwaysApply) |
| `apps/e2e/package.json` | Playwright workspace package |
| `apps/e2e/playwright.config.ts` | baseURL, webServer optional, tags |
| `apps/e2e/helpers/auth.ts` | OTP login → `localStorage` tokens |
| `apps/e2e/tests/smoke.chat.spec.ts` | Login + open seeded thread |
| `apps/e2e/tests/orders.card.spec.ts` | Order card `+N` when count > thumbs |
| `.github/workflows/ci.yml` | Keep unit `pnpm test`; optional `e2e` job |
| `docs/features/chat.md` | Link Wave 1 verification / bug modes |
| `docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md` | Mark Wave 1 in progress / done notes |

---

### Task 1: Web Vitest scaffold

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Modify: `apps/web/package.json`
- Create: `apps/web/src/features/chats/threadMessageSearch.test.ts` (smoke import only first)

**Interfaces:**
- Consumes: Vite `@` alias → `./src`
- Produces: `pnpm --filter @ekum/web test` runs Vitest

- [ ] **Step 1: Add vitest config**

```ts
// apps/web/vitest.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

```ts
// apps/web/src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Add dependencies and script**

From repo root:

```bash
pnpm --filter @ekum/web add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

In `apps/web/package.json` scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Write a tiny failing-then-passing sanity test**

```ts
// apps/web/src/features/chats/threadMessageSearch.test.ts
import { describe, expect, it } from 'vitest';
import { messageMatchesSearch } from './threadMessageSearch';

describe('messageMatchesSearch', () => {
  it('returns false for empty query', () => {
    expect(
      messageMatchesSearch(
        {
          id: 'm1',
          threadId: 't1',
          senderCompanyId: 'c1',
          type: 'text',
          body: 'hello',
          reference: null,
          metadata: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          mine: true,
          replyTo: null,
        },
        '   ',
      ),
    ).toBe(false);
  });
});
```

- [ ] **Step 4: Run web tests**

```bash
pnpm --filter @ekum/web test
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit** (only if user asked)

```bash
git add apps/web/package.json apps/web/vitest.config.ts apps/web/src/test/setup.ts apps/web/src/features/chats/threadMessageSearch.test.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
test(web): add Vitest + Testing Library scaffold

EOF
)"
```

---

### Task 2: Message fixtures + thread search coverage (BM-06 helpers)

**Files:**
- Create: `apps/web/src/test/messageFixtures.ts`
- Modify: `apps/web/src/features/chats/threadMessageSearch.test.ts`

**Interfaces:**
- Produces: `textMessage(partial)`, `orderCardMessage(partial)` helpers returning `MessageView`

- [ ] **Step 1: Add fixtures**

```ts
// apps/web/src/test/messageFixtures.ts
import type { MessageReference, MessageView } from '@ekum/domain-types';

export function orderRef(
  overrides: Partial<MessageReference> & { id: string },
): MessageReference {
  return {
    kind: 'order',
    name: 'Order #ECNL',
    image: null,
    available: true,
    orderLabel: 'Order #ECNL',
    ...overrides,
  };
}

export function textMessage(overrides: Partial<MessageView> & { id: string }): MessageView {
  return {
    threadId: 'seed-thread-1',
    senderCompanyId: 'seed-company-meena',
    type: 'text',
    body: null,
    reference: null,
    metadata: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    mine: true,
    replyTo: null,
    ...overrides,
  };
}

export function orderCardMessage(
  overrides: Partial<MessageView> & { id: string },
): MessageView {
  return textMessage({
    type: 'order_card',
    body: null,
    reference: orderRef({ id: 'ord-1' }),
    ...overrides,
  });
}
```

- [ ] **Step 2: Expand search tests (fail if hit order wrong)**

```ts
import { highlightSearchText, messageMatchesSearch, searchHitIdsNewestFirst } from './threadMessageSearch';
import { textMessage } from '@/test/messageFixtures';

it('matches body case-insensitively', () => {
  expect(messageMatchesSearch(textMessage({ id: 'a', body: 'Banarasi silk' }), 'banarasi')).toBe(true);
});

it('returns hit ids newest-first', () => {
  const messages = [
    textMessage({ id: 'old', body: 'silk', createdAt: '2026-01-01T00:00:00.000Z' }),
    textMessage({ id: 'mid', body: 'cotton', createdAt: '2026-01-02T00:00:00.000Z' }),
    textMessage({ id: 'new', body: 'silk', createdAt: '2026-01-03T00:00:00.000Z' }),
  ];
  expect(searchHitIdsNewestFirst(messages, 'silk')).toEqual(['new', 'old']);
});

it('highlightSearchText wraps matches', () => {
  const node = highlightSearchText('Order #ECNL', 'ecnl');
  expect(node).not.toBe('Order #ECNL');
});
```

- [ ] **Step 3: Run**

```bash
pnpm --filter @ekum/web test src/features/chats/threadMessageSearch.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "test(web): cover thread message search helpers"
```

---

### Task 3: Order card copy + dedupe (BM-04 / BM-05)

**Files:**
- Create: `apps/web/src/features/chats/orderCardCopy.test.ts`
- Read: `apps/web/src/features/chats/orderCardCopy.ts`

**Interfaces:**
- Consumes: `isRichOrderChatMessage`, `dedupeOrderThreadMessages`, `buildOrderCardCopy`

- [ ] **Step 1: Write failing tests for platform rules**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildOrderCardCopy,
  dedupeOrderThreadMessages,
  isRichOrderChatMessage,
} from './orderCardCopy';
import { orderCardMessage, textMessage } from '@/test/messageFixtures';

import { OrderChatEvent } from '@ekum/domain-types';
import { orderRef } from '@/test/messageFixtures';

describe('dedupeOrderThreadMessages', () => {
  it('keeps only the newest card per order id', () => {
    const older = orderCardMessage({
      id: 'm-old',
      reference: orderRef({ id: 'ord-1', name: 'Order #A', orderLabel: 'Order #A' }),
      metadata: { event: OrderChatEvent.OrderRequested },
    });
    const newer = orderCardMessage({
      id: 'm-new',
      reference: orderRef({ id: 'ord-1', name: 'Order #A', orderLabel: 'Order #A' }),
      metadata: { event: OrderChatEvent.QuoteSent },
    });
    const other = textMessage({ id: 't1', body: 'hi' });
    const out = dedupeOrderThreadMessages([older, other, newer]);
    expect(out.map((m) => m.id)).toEqual(['t1', 'm-new']);
  });
});

describe('isRichOrderChatMessage', () => {
  it('treats rate as rich', () => {
    expect(isRichOrderChatMessage(orderCardMessage({ id: 'r1', type: 'rate' }))).toBe(true);
  });

  it('treats quote_accepted as compact', () => {
    const msg = orderCardMessage({
      id: 'c1',
      metadata: { event: OrderChatEvent.QuoteAccepted },
      reference: orderRef({ id: 'ord-1', event: OrderChatEvent.QuoteAccepted }),
    });
    expect(isRichOrderChatMessage(msg)).toBe(false);
  });
});

describe('buildOrderCardCopy', () => {
  it('uses You for mine, never Seller/Buyer in copy', () => {
    const msg = orderCardMessage({
      id: 'm1',
      mine: true,
      metadata: { event: OrderChatEvent.OrderRequested, actorLabel: 'You' },
      reference: orderRef({
        id: 'ord-1',
        event: OrderChatEvent.OrderRequested,
        actorLabel: 'You',
      }),
    });
    const copy = buildOrderCardCopy(msg, msg.reference);
    expect(copy.headline).toMatch(/^You\b/);
    expect(copy.headline).not.toMatch(/Seller|Buyer/);
    expect(copy.title).not.toMatch(/Seller|Buyer/);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
pnpm --filter @ekum/web test src/features/chats/orderCardCopy.test.ts
```

Expected: PASS (fix implementation only if a real bug is found; do not weaken assertions to greenwash).

- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "test(web): cover order card copy and living-message dedupe"
```

---

### Task 4: PhotoAlbum overflow BM-01

**Files:**
- Modify: `apps/web/src/features/chats/PhotoAlbum.tsx`
- Create: `apps/web/src/features/chats/PhotoAlbum.test.tsx`

**Interfaces:**
- Consumes: `PhotoAlbum({ urls, overflowCount })`
- Produces: overflow label with `data-testid="photo-album-overflow"` text `+N`

- [ ] **Step 1: Write failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PhotoAlbum } from './PhotoAlbum';

describe('PhotoAlbum overflow (BM-01)', () => {
  it('shows +1 on last cell for 2 thumbs when overflowCount is 1', () => {
    render(
      <PhotoAlbum
        urls={['https://example.com/a.jpg', 'https://example.com/b.jpg']}
        overflowCount={1}
      />,
    );
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+1');
  });

  it('shows +1 on single thumb when overflowCount is 1', () => {
    render(
      <PhotoAlbum urls={['https://example.com/a.jpg']} overflowCount={1} />,
    );
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+1');
  });

  it('combines urls beyond 4 with overflowCount', () => {
    const urls = [1, 2, 3, 4, 5].map((n) => `https://example.com/${n}.jpg`);
    render(<PhotoAlbum urls={urls} overflowCount={2} />);
    // 1 url beyond preview + overflowCount 2 => +3
    expect(screen.getByTestId('photo-album-overflow')).toHaveTextContent('+3');
  });

  it('hides overflow when none', () => {
    render(
      <PhotoAlbum urls={['https://example.com/a.jpg', 'https://example.com/b.jpg']} />,
    );
    expect(screen.queryByTestId('photo-album-overflow')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify fail if testid missing**

```bash
pnpm --filter @ekum/web test src/features/chats/PhotoAlbum.test.tsx
```

Expected: FAIL on missing `photo-album-overflow` (if not yet added).

- [ ] **Step 3: Add data-testid to every overflow overlay in PhotoAlbum**

On each overlay `<span>` that renders `moreLabel` / `overlay={moreLabel}`:

```tsx
<span
  data-testid="photo-album-overflow"
  className="absolute inset-0 flex items-center justify-center bg-ink/55 text-2xl font-semibold text-white"
>
  {moreLabel}
</span>
```

And for `Cell`, pass through:

```tsx
{overlay ? (
  <span
    data-testid="photo-album-overflow"
    className="absolute inset-0 flex items-center justify-center bg-ink/55 text-2xl font-semibold text-white"
  >
    {overlay}
  </span>
) : null}
```

- [ ] **Step 4: Re-run — PASS**

```bash
pnpm --filter @ekum/web test src/features/chats/PhotoAlbum.test.tsx
```

- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "test(web): lock PhotoAlbum +N overflow for 1–4 layouts"
```

---

### Task 5: Standing feature-gate Cursor rules

**Files:**
- Modify: `.cursor/rules/feature-tests-required.mdc`
- Create: `.cursor/rules/quality-feature-gate.mdc`

**Interfaces:**
- Produces: alwaysApply rules agents must follow

- [ ] **Step 1: Replace/extend `feature-tests-required.mdc` body** so it includes web + E2E:

```markdown
---
description: Features are done only when tests are written and passing
alwaysApply: true
---

# Feature tests required

A feature is **not done** until tests exist and pass.

## Required before claiming done

1. **Challenge** the ask (see `quality-feature-gate`) — better UX/architecture when it fights Ekum rules.
2. **Update** `docs/features/*.md` when behavior/rules change.
3. **Write a test matrix**: happy path, persona (Ravi/Meena/unconnected when trade), bug modes from the quality-gate catalog.
4. **Automate**:
   - API: colocated `*.spec.ts` (vitest)
   - Web logic/UI: `apps/web` `*.test.ts(x)` (vitest + Testing Library)
   - Journeys: `apps/e2e` Playwright with tags (`@smoke`, `@chat`, `@orders`, …)
5. **Run** the relevant tests and confirm PASS.
6. Pure copy/CSS with no behavior change may skip new tests — say so explicitly.

## Bug modes

When fixing a UI bug, add a regression test first (see BM-* in
`docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md`).
```

- [ ] **Step 2: Create `quality-feature-gate.mdc`**

```markdown
---
description: Senior architect/UX challenge + platform test bar for every feature
alwaysApply: true
---

# Quality feature gate

When the user explains or requests a feature:

1. Act as **senior architect + UI/UX**: propose a better shape if the ask fights platform rules (living order cards, You/business name, Requests vs order Accept, source masking, mobile/PWA stacking).
2. Lock flows/rules in `docs/features/*.md`.
3. Build a **test matrix** (happy + edge + BM-* bug modes) before calling done.
4. Prefer Wave coverage: chat/orders first, then collections/explore, then home/auth smoke.
5. Do not ship “typecheck-only” UI behavior changes.

Spec: `docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md`
```

- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "docs(rules): encode senior quality gate and web/e2e test bar"
```

---

### Task 6: Playwright package `@ekum/e2e`

**Files:**
- Create: `apps/e2e/package.json`
- Create: `apps/e2e/playwright.config.ts`
- Create: `apps/e2e/tsconfig.json`
- Create: `apps/e2e/helpers/auth.ts`
- Create: `apps/e2e/helpers/env.ts`

**Interfaces:**
- Consumes: API `POST /v1/auth/otp/request` + `verify` with `devCode`
- Produces: `loginAs(page, phone)` writing `ekum.tokens` into `localStorage`

- [ ] **Step 1: Scaffold package**

```json
// apps/e2e/package.json
{
  "name": "@ekum/e2e",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:smoke": "playwright test --grep @smoke",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "typescript": "^5.7.3"
  }
}
```

```ts
// apps/e2e/helpers/env.ts
export const WEB_URL = process.env.EKUM_WEB_URL ?? 'http://127.0.0.1:5173';
/** Matches API global prefix + web default `VITE_API_BASE_URL`. */
export const API_URL = process.env.EKUM_API_URL ?? 'http://127.0.0.1:3000/api/v1';

export const PHONES = {
  ravi: '+919800000001',
  meena: '+919800000002',
} as const;
```

```ts
// apps/e2e/helpers/auth.ts
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
  const session = await verified.json();
  await page.goto(WEB_URL);
  await page.evaluate((tokens) => {
    localStorage.setItem('ekum.tokens', JSON.stringify(tokens));
  }, session.tokens);
  await page.goto(WEB_URL);
}
```

```ts
// apps/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { WEB_URL } from './helpers/env';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    ...devices['Pixel 7'],
  },
  // Prefer starting servers outside CI locally; in CI set webServer or workflow services.
});
```

- [ ] **Step 2: Install**

```bash
pnpm install
pnpm --filter @ekum/e2e exec playwright install chromium
```

- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "test(e2e): scaffold Playwright package and seed login helper"
```

---

### Task 7: Smoke E2E — login + seeded chat (@smoke @chat)

**Files:**
- Create: `apps/e2e/tests/smoke.chat.spec.ts`

**Prerequisites (local):** API + web running, DB migrated + seeded, `OTP_EXPOSE_DEV_CODE=true`.

- [ ] **Step 1: Write smoke spec**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { PHONES } from '../helpers/env';

test.describe('seed chat @smoke @chat', () => {
  test('Meena opens seeded thread and can send text', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    await page.goto('/chats/seed-thread-1');
    // Add these testids in ThreadPage if missing: composer input + send.
    const composer = page.getByTestId('chat-composer');
    await composer.fill(`e2e-${Date.now()}`);
    const marker = await composer.inputValue();
    await page.getByTestId('chat-send').click();
    await expect(page.getByText(marker)).toBeVisible();
  });
});
```

In `ThreadPage.tsx`, add `data-testid="chat-composer"` on the text input and `data-testid="chat-send"` on the send control before running this spec.

- [ ] **Step 2: Run with servers up**

```bash
pnpm --filter @ekum/e2e test:smoke
```

Expected: PASS.

- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "test(e2e): smoke Meena seeded chat send"
```

---

### Task 8: E2E order card overflow (@orders @smoke)

**Files:**
- Create: `apps/e2e/tests/orders.card.spec.ts`
- Possibly modify: `ThreadPage.tsx` — ensure order card album uses overflow testid (already from Task 4)

**Approach:** Add seed product `seed-prod-no-image` (empty `images: []`) on Ravi’s catalog. Meena creates a 3-line order (`seed-prod-1`, `seed-prod-2`, `seed-prod-no-image`) via `POST /api/v1/orders`, opens `/chats/{threadId}`, asserts **3 designs** and **`+1`** on `photo-album-overflow`.

- [ ] **Step 1: Seed product without images**

In `apps/api/prisma/seed.ts`, upsert alongside other products:

```ts
{
  id: 'seed-prod-no-image',
  companyId: RAVI,
  // ...same required fields as other seed products...
  images: [],
  name: 'Sample swatch (no photo)',
}
```

Re-seed locally after change: `pnpm --filter @ekum/api db:seed`.

- [ ] **Step 2: Order helper**

```ts
// apps/e2e/helpers/orders.ts
import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './env';

export async function createOrder(
  request: APIRequestContext,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string; threadId: string }> {
  const res = await request.post(`${API_URL}/orders`, {
    headers: { authorization: `Bearer ${accessToken}` },
    data: body,
  });
  if (!res.ok()) {
    throw new Error(`create order failed: ${res.status()} ${await res.text()}`);
  }
  return res.json() as Promise<{ id: string; threadId: string }>;
}
```

- [ ] **Step 3: Spec**

```ts
import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { createOrder } from '../helpers/orders';
import { PHONES } from '../helpers/env';

test.describe('order card album @smoke @orders', () => {
  test('shows +N when designs exceed preview images', async ({ page }) => {
    await loginAs(page, PHONES.meena);
    const tokensRaw = await page.evaluate(() => localStorage.getItem('ekum.tokens'));
    if (!tokensRaw) throw new Error('missing tokens');
    const { accessToken } = JSON.parse(tokensRaw) as { accessToken: string };
    const order = await createOrder(page.request, accessToken, {
      sellerCompanyId: 'seed-company-ravi',
      intent: 'order',
      items: [
        { productId: 'seed-prod-1', quantity: 50 },
        { productId: 'seed-prod-2', quantity: 50 },
        { productId: 'seed-prod-no-image', quantity: 50 },
      ],
    });
    await page.goto(`/chats/${order.threadId}`);
    await expect(page.getByText(/3 designs/i)).toBeVisible();
    await expect(page.getByTestId('photo-album-overflow')).toHaveTextContent('+1');
  });
});
```

`intent: 'order'` matches `OrderIntent.Order` in domain-types.

- [ ] **Step 3: Run**

```bash
pnpm --filter @ekum/e2e test tests/orders.card.spec.ts
```

Expected: PASS.

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "test(e2e): assert order card +N when designs exceed thumbs"
```

---

### Task 9: CI wiring + docs

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/features/chat.md`
- Modify: `package.json` (optional root script)
- Modify: `docs/superpowers/specs/2026-08-11-quality-gate-and-test-system-design.md` status

- [ ] **Step 1: Ensure root `pnpm test` runs web units**

`pnpm -r test` already recurses; `@ekum/web` now has `test`. `@ekum/e2e` also has `test` — **exclude Playwright from default recursive test** so CI unit job stays fast:

In `apps/e2e/package.json`:

```json
"test": "playwright test",
"test:unit": "node -e \"process.exit(0)\""
```

Better: rename Playwright scripts to avoid `pnpm -r test` invoking e2e:

```json
"test": "node -e \"console.log('e2e: use test:e2e');\"",
"test:e2e": "playwright test",
"test:smoke": "playwright test --grep @smoke"
```

Or set in `apps/e2e/package.json`:

```json
"scripts": {
  "test": "echo \"skip e2e in pnpm -r test\" && exit 0",
  "test:e2e": "playwright test",
  "test:smoke": "playwright test --grep @smoke"
}
```

Prefer: **no `test` script** on `@ekum/e2e`; only `test:e2e` / `test:smoke`. Then `pnpm -r test` skips packages without `test`… actually pnpm runs only packages that define `test`. So omit `test` on e2e; keep `test:e2e`.

- [ ] **Step 2: Add CI e2e job (manual-friendly)**

Append to `.github/workflows/ci.yml` a job `e2e` that:
1. Starts Postgres service
2. Sets `DATABASE_URL`, `OTP_EXPOSE_DEV_CODE=true`
3. `pnpm --filter @ekum/api prisma migrate deploy` + `db:seed`
4. Starts API and web in background
5. `pnpm --filter @ekum/e2e test:smoke`

If Postgres service setup is not already documented, copy connection pattern from any existing docker-compose / `.env.example`. If CI e2e is too heavy for this wave, gate the job with:

```yaml
if: github.event_name == 'workflow_dispatch' || contains(github.event.head_commit.message, '[e2e]')
```

and document local smoke as required for chat/orders PRs until the job is always-on.

- [ ] **Step 3: Update chat feature doc**

Add under Seed walkthrough / verification:

```markdown
## Automated verification (Wave 1)

- Web: `pnpm --filter @ekum/web test` — PhotoAlbum BM-01, order card copy/dedupe, thread search
- E2E smoke: API+web up, `OTP_EXPOSE_DEV_CODE=true`, then `pnpm --filter @ekum/e2e test:smoke`
```

- [ ] **Step 4: Root convenience script**

```json
// package.json scripts
"test:e2e:smoke": "pnpm --filter @ekum/e2e test:smoke"
```

- [ ] **Step 5: Run full unit suite**

```bash
pnpm test
pnpm --filter @ekum/web typecheck
```

Expected: API + web units PASS.

- [ ] **Step 6: Commit** (if requested)

```bash
git commit -m "ci: include web unit tests; document e2e smoke for chat/orders"
```

---

### Task 10: Wave 1 verification gauntlet (human + agent)

**Files:** none required

- [ ] **Step 1: Run unit gauntlet**

```bash
pnpm --filter @ekum/web test
pnpm --filter @ekum/api test
```

- [ ] **Step 2: Run e2e smoke** (servers + seed)

```bash
pnpm --filter @ekum/e2e test:smoke
```

- [ ] **Step 3: Manual spot-check (5 min)**

1. As Meena, request 3 designs where one lacks an image → card shows two thumbs + `+1`.
2. Open thread search → Orders scope lists order refs; type order label → stepper works.
3. Confirm living order card does not stack duplicates after a status change.

- [ ] **Step 4: Mark Wave 1 done in the design spec** (status line update).

---

## Later waves (out of this plan)

- Wave 2: collection shortlist clear (BM-03), Explore/Orders portal menus (BM-02)
- Wave 3: home / auth / Requests smoke
- Always-on CI e2e without workflow_dispatch gate

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Feature gate / Cursor rule | Task 5 |
| Web Vitest pyramid layer | Tasks 1–4 |
| BM-01 PhotoAlbum | Task 4 |
| BM-04 / BM-05 order card | Task 3 |
| BM-06 search helpers | Task 2 |
| Playwright harness | Task 6 |
| Seed chat journey | Task 7 |
| Order card +N journey | Task 8 |
| CI + docs | Task 9 |
| Wave 1 verification | Task 10 |
| Waves 2–3 | Deferred (listed) |
