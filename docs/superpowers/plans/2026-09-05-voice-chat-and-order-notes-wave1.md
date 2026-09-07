# Voice chat + order notes (Wave 1) — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** WhatsApp-style chat voice + shared note mic on order create and Send quote (text and/or voice).

**Architecture:** Extend media for `Audio`; shared web record/play kit; chat `MessageType.Voice`; Order.`noteVoiceMediaId` for create; quote voice in Rate message metadata.

**Tech Stack:** Nest/Prisma API, domain-types Zod, React web, MediaRecorder, Vitest.

## Global Constraints

- Chat: hold-to-record, release to send; slide cancel; ~2 min cap.
- Order notes: tap record; text and/or voice.
- No transcription; no payment/return notes in wave 1.
- Plain trader copy.

---

### Task 1: Media audio + domain voice/order DTOs

**Files:** `packages/domain-types/src/{enums,media,conversation,orders}.ts`, `apps/api/src/media/*`, prisma migration for `Order.noteVoiceMediaId`

### Task 2: Web kit + uploadAudio

**Files:** `apps/web/src/lib/mediaUpload.ts`, `apps/web/src/ui/voice/*` (recorder, player, caps helpers)

### Task 3: Chat composer + bubble

**Files:** `ThreadPage.tsx`, `chatMessageActions.ts`, `messagePreview.ts`, API reply preview if needed

### Task 4: Order builder + quote note voice

**Files:** Order schema/service/serializer, OrderBuilderPage, OrderDetailPage quote sheet, ChatTradeCardView for quote voice

### Task 5: Docs + tests

Update `chat.md` / `orders.md`; unit + smoke where feasible.
