# WhatsApp Chat Open + Locked Card Previews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Threads open like WhatsApp (first unread + divider, else newest), and gated catalog chat cards show small blurred thumbs that cannot open full-screen.

**Architecture:** Pure helpers for first-unread; ThreadPage snapshots `lastReadAt`/`unreadCount` before mark-read. Catalog refs keep preview images and set `imagesLocked`; PhotoAlbum blurs and disables PhotoViewer. Collection detail still clears clear images when products are gated.

**Tech Stack:** React (ThreadPage), Vitest, Nest ReferenceResolver, `@ekum/domain-types`

## Global Constraints

- Unread = messages where `senderCompanyId !== viewerCompanyId` and `createdAt > lastReadAt` (or all other-party if `lastReadAt` null).
- Deep link `?message=` wins over unread/bottom.
- Chat blur ≠ collection full reveal.
- Do not invent a new history API; if first unread not in loaded pages → bottom.
- No commits unless the user asks.

---

### Task 1: First-unread helpers (web units)

**Files:**
- Create: `apps/web/src/features/chats/threadOpenScroll.ts`
- Create: `apps/web/src/features/chats/threadOpenScroll.spec.ts`

**Interfaces:**
- Produces:
  - `firstUnreadMessageId(messages: { id: string; createdAt: string; senderCompanyId: string }[], opts: { lastReadAt: string | null; viewerCompanyId: string }): string | null`
  - `unreadDividerLabel(count: number): string` → `"1 unread message"` / `"N unread messages"`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { firstUnreadMessageId, unreadDividerLabel } from './threadOpenScroll';

describe('firstUnreadMessageId', () => {
  const msgs = [
    { id: 'a', createdAt: '2026-01-01T10:00:00.000Z', senderCompanyId: 'them' },
    { id: 'b', createdAt: '2026-01-01T11:00:00.000Z', senderCompanyId: 'me' },
    { id: 'c', createdAt: '2026-01-01T12:00:00.000Z', senderCompanyId: 'them' },
  ];
  it('returns first other-party after lastReadAt', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T10:30:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBe('c');
  });
  it('skips own messages', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T09:00:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBe('a');
  });
  it('returns null when none', () => {
    expect(
      firstUnreadMessageId(msgs, {
        lastReadAt: '2026-01-01T13:00:00.000Z',
        viewerCompanyId: 'me',
      }),
    ).toBeNull();
  });
});

describe('unreadDividerLabel', () => {
  it('singular and plural', () => {
    expect(unreadDividerLabel(1)).toBe('1 unread message');
    expect(unreadDividerLabel(3)).toBe('3 unread messages');
  });
});
```

- [ ] **Step 2: Implement helpers and pass tests**

Run: `pnpm --filter @ekum/web exec vitest run src/features/chats/threadOpenScroll.spec.ts`

---

### Task 2: `imagesLocked` on MessageReference + resolver

**Files:**
- Modify: `packages/domain-types/src/conversation.ts` — add `imagesLocked?: boolean`
- Modify: `apps/api/src/conversation/reference-resolver.ts` — keep images; set `imagesLocked` when gated
- Modify: `apps/api/src/conversation/reference-resolver.spec.ts` — expect images present + `imagesLocked: true` for non-follower Followers pack

**Interfaces:**
- Consumes: `canViewCollectionProducts`, visibility context (already in resolver)
- Produces: `imagesLocked: true | false` on product/collection refs

- [ ] **Step 1: Add field to domain-types**
- [ ] **Step 2: Change resolver** — always build images when available; `imagesLocked = !canShowCatalogImages(...)` for non-owner with viewer; owner → `imagesLocked: false`
- [ ] **Step 3: Update specs** — Meena case: `images` equal thumbs, `imagesLocked === true`; follower: `imagesLocked` falsy
- [ ] **Step 4: Run** `pnpm --filter @ekum/api exec vitest run src/conversation/reference-resolver.spec.ts`

---

### Task 3: PhotoAlbum locked + trade card wiring

**Files:**
- Modify: `apps/web/src/features/chats/PhotoAlbum.tsx` — `locked?: boolean`
- Modify: `apps/web/src/features/chats/PhotoAlbum.test.tsx`
- Modify: `apps/web/src/features/chats/chatTradeCard.ts` — `imagesLocked` on model
- Modify: `apps/web/src/features/chats/ChatTradeCardView.tsx` — pass `locked` to PhotoAlbum

- [ ] **Step 1: Failing test** — locked album renders blur class / does not open viewer on click
- [ ] **Step 2: Implement** — `locked`: `blur-sm` (or `blur-[2px]`) on img; Cell `onClick` no-op / `pointer-events-none` on buttons; no PhotoViewer mount when locked
- [ ] **Step 3: Pass `ref.imagesLocked` through `ChatTradeCardModel` → PhotoAlbum
- [ ] **Step 4: Run PhotoAlbum + chatTradeCard specs

---

### Task 4: ThreadPage open scroll + divider

**Files:**
- Modify: `apps/web/src/features/chats/ThreadPage.tsx`

- [ ] **Step 1:** Ref `openVisitRef` with `{ lastReadAt, unreadCount, scrolled: boolean }` set once when `thread.data` arrives for this `id`, **before** mark-read effect (or capture from first `thread.data` in same effect before POST).
- [ ] **Step 2:** Compute `firstUnreadId` from snapshot + `ordered` + `companyId`.
- [ ] **Step 3:** In message list render, before the message with `id === firstUnreadId`, render divider with `unreadDividerLabel(snapshot.unreadCount)` (use max(snapshot.unreadCount, 1) only if id found; if count 0 skip divider).
- [ ] **Step 4:** Initial scroll effect:
  - if `refMessageId` → existing jump
  - else if `firstUnreadId` and element present → `scrollIntoView({ block: 'start' })` once; set `stickToBottom` false; mark scrolled
  - else if unread snapshot but id missing → bottom fallback once
  - else → bottom (current stick)
- [ ] **Step 5:** Reset snapshot on `id` change

---

### Task 5: Docs

**Files:**
- Modify: `docs/features/chat.md` — open behaviour + locked blurred thumbs
- Modify: `docs/superpowers/reviews/completeness/2026-09-03-forward-free-view-on-open-completeness.md` addendum if needed (blur not strip)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md` if row exists for chat open

- [ ] Update copy; keep collection-open mask documented

---

### Task 6: Verify

- [ ] `pnpm --filter @ekum/web exec vitest run src/features/chats/threadOpenScroll.spec.ts src/features/chats/PhotoAlbum.test.tsx`
- [ ] `pnpm --filter @ekum/api exec vitest run src/conversation/reference-resolver.spec.ts`
- [ ] Manual note: Meena blurred card; unread open divider

## Spec coverage

| Spec item | Task |
|-----------|------|
| First unread scroll | 1, 4 |
| Divider | 1, 4 |
| No unread → bottom | 4 |
| Deep link wins | 4 |
| Mark-read + snapshot | 4 |
| imagesLocked + restore images | 2 |
| Blur no viewer | 3 |
| Collection open still masked | already shipped; docs Task 5 |
| Fallback bottom | 4 |
