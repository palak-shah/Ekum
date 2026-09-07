# Order update voice notes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optional Note + mic on every order update sheet; clips play on Timeline (and on Return / Payment blocks when those own the text).

**Architecture:** Extend DTOs with optional `note` / `noteVoiceMediaId` / `noteVoiceDurationMs` (or `reason` + `reasonVoice*` for returns). Reuse `OrderService` / payment / return `noteVoiceMetadata` helpers. Always append matching fields on `OrderTrailEvent`. Add entity columns only on `Return` and `PaymentRequest`.

**Tech Stack:** Prisma, NestJS orders module, `@ekum/domain-types`, `NoteVoiceField` / `VoicePlayer`, OrderDetailPage sheets.

**Spec:** `docs/superpowers/specs/2026-09-06-order-update-voice-notes-design.md`  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-06-order-update-voice-notes-completeness.md` (Proceed)

## Global Constraints

- Text only, voice only, or both — all valid; never required  
- Do **not** post order-update clips as chat `MessageType.Voice`  
- Trail is the history home; Return/Payment also store voice beside their text  
- Same caps / upload path as Wave 1 (~2 min)  
- BM-07: sheet content clear above sticky footer when preview open  
- Copy: **Note** + mic — no jargon  

## File map

| File | Responsibility |
|------|----------------|
| `packages/domain-types/src/orders.ts` | DTO voice fields; ReturnView / PaymentRequestView voice |
| `packages/domain-types/src/order-trail.ts` | Trail types/labels for return + payment steps |
| `apps/api/prisma/schema.prisma` + migration | `Return.reasonVoice*`, `PaymentRequest.noteVoice*` |
| `apps/api/src/orders/order.service.ts` | Dispatch/amend/decide/cancel/decline accept note+voice → trail |
| `apps/api/src/orders/return.service.ts` | Create/approve/decline/resolve voice + trail on parent order |
| `apps/api/src/orders/payment.service.ts` | Ask payment voice + trail |
| `apps/api/src/orders/order.serializer.ts` | Expose return/payment voice on views |
| `apps/web/src/features/orders/OrderDetailPage.tsx` | NoteVoiceField on all listed sheets; players on return/payment |
| `docs/features/orders.md`, gap matrix, Wave 1 spec Wave 2 note | Docs |

---

### Task 1: Domain DTOs + trail types

**Files:**
- Modify: `packages/domain-types/src/orders.ts`
- Modify: `packages/domain-types/src/order-trail.ts`
- Modify: `packages/domain-types/src/orders.ts` (`ReturnView`, `PaymentRequestView`)

**Interfaces:**
- Produces: shared optional voice fields on dispatch, decideLines, amend (already has note), cancel, decline, createReturn (`reasonVoice*`), createPaymentRequest, approveReturn (add optional note+voice), escalate if in scope (defer escalate unless sheet exists)
- Produces: `OrderTrailType.ReturnRaised`, `ReturnDecided`, `PaymentAsked` (+ labels)

- [ ] **Step 1:** Add reusable shape (inline or helper) matching settle/quote:

```ts
note: z.string().trim().max(1000).optional(),
noteVoiceMediaId: z.string().min(1).optional(),
noteVoiceDurationMs: z.number().int().positive().max(120_000).optional(),
```

Apply to `dispatchSchema`, `decideOrderLinesSchema` (note already — add voice), `amendOrderSchema` (add voice), new `cancelOrderSchema` / `declineOrderSchema` (or document empty `{}` still valid via `.default({})`), `createPaymentRequestSchema`, `approveReturnSchema` (optional note+voice).

For returns:

```ts
// createReturnSchema
reason: z.string().trim().max(1000).optional(),
reasonVoiceMediaId: z.string().min(1).optional(),
reasonVoiceDurationMs: z.number().int().positive().max(120_000).optional(),
```

Add matching fields on `ReturnView` / `PaymentRequestView`.

- [ ] **Step 2:** Extend `OrderTrailType` + `ORDER_TRAIL_LABELS` for `return_raised`, `return_decided`, `payment_asked`.

- [ ] **Step 3:** Build domain-types: `pnpm --filter @ekum/domain-types build`  
  Expected: success

- [ ] **Step 4:** Commit only if the user asks (do not commit by default in this repo).

---

### Task 2: Prisma Return + PaymentRequest voice columns

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`Return`, `PaymentRequest`)
- Create: `apps/api/prisma/migrations/20260906200000_order_update_voice_notes/migration.sql`

**Interfaces:**
- Produces: `reasonVoiceMediaId`, `reasonVoiceUrl`, `reasonVoiceDurationMs` on Return; `noteVoiceMediaId`, `noteVoiceUrl`, `noteVoiceDurationMs` on PaymentRequest

- [ ] **Step 1:** Add nullable columns on both models (no FK required if Order.noteVoice pattern is URL denormalized — match Order.noteVoice* style).

- [ ] **Step 2:** Migration SQL with `IF NOT EXISTS` / safe DO blocks consistent with recent migrations.

- [ ] **Step 3:** `pnpm --filter @ekum/api exec prisma generate` then `prisma migrate deploy`  
  Expected: client has new fields; migration applied  
  (Stop Nest watchers first on Windows if DLL lock.)

---

### Task 3: API — order mutations write note+voice to trail

**Files:**
- Modify: `apps/api/src/orders/order.service.ts` (`dispatch`, `amend`, `decideLines`, `cancel`, `decline`)
- Modify: `apps/api/src/orders/order.controller.ts` (cancel/decline body pipes if needed)
- Test: `apps/api/src/orders/order.service.spec.ts`

**Interfaces:**
- Consumes: Task 1 DTOs; existing `noteVoiceMetadata(companyId, dto)`
- Produces: trail rows include note/voice for those actions

- [ ] **Step 1:** Write failing tests — e.g. dispatch with `note` + mocked voice fields calls trail.append with those fields; cancel with note includes trail note.

- [ ] **Step 2:** Run: `pnpm --filter @ekum/api exec vitest run src/orders/order.service.spec.ts`  
  Expected: FAIL until wired

- [ ] **Step 3:** Implement: resolve voice once per mutation; pass into `trail.append`; for cancel/decline accept optional dto default `{}`; include typed note in living-card body when short (no voice URL in body).

- [ ] **Step 4:** Re-run specs — Expected: PASS

---

### Task 4: API — return + payment voice + trail on parent order

**Files:**
- Modify: `apps/api/src/orders/return.service.ts`, `order.serializer.ts` (return view)
- Modify: `apps/api/src/orders/payment.service.ts` (+ serializer payment shape in order get)
- Inject / use `OrderTrailService` from returns/payments (export from OrdersModule if needed)
- Test: `return.service.spec.ts`, payment specs if present

**Interfaces:**
- Consumes: Task 2 columns; Task 1 DTOs
- Produces: Return create stores reasonVoice*; trail `return_raised` on `orderId`; approve/decline append `return_decided` with note/voice; payment ask stores noteVoice* + trail `payment_asked`

- [ ] **Step 1:** Failing test: create return with `reasonVoiceMediaId` persists fields (mock media resolve like order service).

- [ ] **Step 2:** Implement create/approve/decline (+ resolve if it has a reason UI). Reuse media ownership check (extract shared helper from OrderService if duplication is painful — optional small `NoteVoiceResolver` in same module).

- [ ] **Step 3:** Serializer maps reasonVoice* / payment noteVoice* onto views.

- [ ] **Step 4:** Run return (+ payment) unit specs — Expected: PASS

---

### Task 5: Web — sheets + display

**Files:**
- Modify: `apps/web/src/features/orders/OrderDetailPage.tsx`
- Modify: payment sheet + return sheets in same page (or return-specific components if split)
- Modify: amend sheet NoteVoiceField if missing
- Test: light unit if extractable; otherwise rely on API + manual/smoke

**Interfaces:**
- Consumes: updated DTOs / OrderView.trail / ReturnView voice fields
- Produces: UI NoteVoiceField on every listed sheet; VoicePlayer under return reason and payment note

- [ ] **Step 1:** Raise return: replace TextArea reason with `NoteVoiceField` (`label="Note"`, maps to `reason` + `reasonVoice*`).

- [ ] **Step 2:** Dispatch / lines / cancel / decline / payment / amend: add NoteVoiceField state + POST fields. For cancel/decline that currently use `act.mutate('cancel')`, open a small confirm sheet with optional Note + mic (or extend existing confirm) — do not silent-add body without UI.

- [ ] **Step 3:** Return list on order detail: show VoicePlayer when `reasonVoiceUrl` set. Payment rows: same for note voice.

- [ ] **Step 4:** Timeline already plays `step.noteVoiceUrl` — verify return_raised / payment_asked rows appear after API work.

- [ ] **Step 5:** BM-07 check on Raise return + Dispatch with voice preview open (mobile width).

---

### Task 6: Docs + gap matrix

**Files:**
- Modify: `docs/features/orders.md`
- Modify: `docs/superpowers/specs/2026-09-05-voice-chat-and-order-notes-design.md` (Wave 2 shipped)
- Modify: `docs/superpowers/reviews/feature-gap-matrix.md`

- [ ] **Step 1:** Document Note + voice on update sheets; Timeline playback; Return reason voice columns.
- [ ] **Step 2:** Gap matrix row for order-update voice Wave 2.

---

## Spec coverage check

| Spec § | Task |
|--------|------|
| §1 all sheets | 5 (+ 3/4 API) |
| §2 trail + entity | 2, 3, 4 |
| §3 display | 5 |
| §4 out of scope | respected |
| §6 tests | 3, 4, 5 |

## Open points resolved

1. Return columns: **`reason` + `reasonVoice*`** (keep reason name).  
2. Cancel/decline living card: include typed note in body when present; never voice URL.
