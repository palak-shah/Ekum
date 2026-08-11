# Broadcast

## Purpose

Sellers message many buyers at once (text or a published design/collection card), optionally using saved recipient lists. Phase 1 is **send now** only.

## Who uses it

Companies with **selling** on and **`canPublish`** (unlocked after first publish consent). Entry: **＋ → Broadcast to buyers** or You paths to `/broadcast`.

## User flows

1. Open `/broadcast` — manage lists; history of sent broadcasts as shown.
2. **New** (`/broadcast/new`) — compose text and/or attach a **published** product or collection card.
3. Pick recipients and/or a saved list → send immediately.
4. Recipients get a notification / chat delivery per product rules.

## Business rules

| Rule | Detail |
|------|--------|
| Capability | Requires `canPublish` (and selling presence in the ＋ sheet) |
| Refs | Cards only for **published** catalog objects |
| Recipients | Must be visible / not blocked |
| Scheduling | Not in Phase 1 — status enum is effectively `sent` |
| Lists | CRUD for reusable buyer groups |

## Edge cases / empty states

- No `canPublish` → Broadcast hidden from ＋.
- Empty lists → create a list before bulk send.
- Unpublished design selected → rejected server-side.

## Seed walkthrough

1. As **Ravi** (already `canPublish`): open Broadcast → send a short text or Wedding Edit card to Meena / a list containing Jaipur Emporium.
2. As **Meena**: confirm notification / inbox signal for the broadcast.

## Where it lives

- Web: `apps/web/src/features/broadcast/`
- API: `apps/api/src/broadcast/`
- Contracts: `packages/domain-types/src/broadcast.ts`
