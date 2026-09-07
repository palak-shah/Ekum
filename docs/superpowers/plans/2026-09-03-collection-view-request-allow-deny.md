# Collection View Request Allow/Deny Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Meena can Ask to see one collection; Kavita Allow/Deny in chat; Allow grants pack-only view (not Connection); Deny silent to Meena; Allow → chat + notification + one Home aggregate; owner lists/revokes Granted on request.

**Architecture:** `CollectionViewRequest` + `CollectionViewGrant` tables. View gate ORs grant. Chat system/card messages with Allow/Deny. Collection Ask stops using AccessRequest. Home Needs kind `collection_view_granted` aggregates.

**Tech Stack:** Prisma, Nest catalog/access/conversation, React CollectionViewer/ThreadPage/Home, Vitest

## Global Constraints

- Allow never creates Connection or AccessRequest.
- Deny never notifies or messages the requester with rejection copy.
- Grant bucket separate from `audienceCompanyIds` / buyer groups.
- No commits unless user asks.

---

### Task 1: Schema + domain types

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: migration `20260903170000_collection_view_grant`
- Modify: `packages/domain-types` (enums status, DTOs, views)

- [ ] Add models `CollectionViewGrant` (unique collectionId+companyId) and `CollectionViewRequest` (pending|allowed|denied, collectionId, requester, target owner, threadId, messageId nullable)
- [ ] Export types/DTOs; rebuild domain-types

### Task 2: View gate + explore wiring

**Files:**
- Modify: `apps/api/src/catalog/audience-visibility.ts` (+ spec)
- Modify: `apps/api/src/discovery/explore.service.ts` — load grant when resolving collectionDetail / product in collection
- Modify: `apps/api/src/conversation/reference-resolver.ts` — imagesLocked considers grant

- [ ] `canViewCollectionProducts(..., hasViewGrant?: boolean)` early true if grant
- [ ] Specs for grant unlock without follow/connection

### Task 3: Collection view request service + API

**Files:**
- Create: `apps/api/src/catalog/collection-view-request.service.ts` (+ spec)
- Wire controller routes under collections or `/collection-view-requests`
- Events: `CollectionViewGranted` for notifications

- [ ] `create(requester, collectionId)` — idempotent pending; open/reuse direct thread; post chat card; **no** AccessRequest
- [ ] `allow(owner, requestId)` — grant row; status allowed; chat update for requester; emit event; **no** Connection
- [ ] `deny(owner, requestId)` — status denied; remove/hide requester-visible pending ask; no deny body to requester
- [ ] `listGrants(owner, collectionId)` / `revoke(owner, collectionId, companyId)`
- [ ] `listMyGrants(viewer)` for Home

### Task 4: Chat UI Allow/Deny + success line

**Files:**
- ThreadPage / trade card or dedicated renderer for view-request messages
- Reference resolver or message metadata

- [ ] Owner: Allow / Deny buttons
- [ ] After Allow: Meena sees “You can view {name}”
- [ ] After Deny: Meena does not see deny copy

### Task 5: CollectionViewer Ask

**Files:**
- Modify: `CollectionViewerPage.tsx`

- [ ] Replace AccessRequest gate with Ask to see this collection → new API
- [ ] Pending state from view-request outgoing
- [ ] Copy: Ask to see this collection (not Request access / connect)

### Task 6: Home + notifications + owner Who can see

**Files:**
- `homeAttention.ts` — kind `collection_view_granted`
- notification listener on grant
- Owner UI on collection (viewer owner chrome or editor) — Granted on request list + remove

### Task 7: Docs + verify

- Update concepts, collections, access-and-connections, chat, home, feature-gap-matrix
- Run unit specs

## Spec coverage

| Spec | Task |
|------|------|
| Pack-only Allow | 3 |
| No Connection | 3 |
| Silent Deny | 3, 4 |
| Chat Allow/Deny | 4 |
| Grant bucket | 1, 6 |
| Home aggregate | 6 |
| View gate | 2 |
| Connect unchanged | 5 (stop using access for pack Ask) |
