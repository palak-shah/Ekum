# Broadcast & Buyer groups

## Purpose

**Buyer groups** (saved `BroadcastList` rows) are reusable recipient sets for private publish audience, share, and broadcast. Sellers also **compose once and send now** a text or published design/collection card to many buyers.

## Who uses it

Companies with **selling** on and **`canPublish`** (unlocked after first publish consent). Entry: **＋ → Broadcast to buyers**, You → Broadcast / Buyer groups, or **Network → Requests → Buyer groups**.

## User flows

1. Open `/broadcast` — manage **Buyer groups** (name, members; publish defaults **Same as my usual** or **Different for this group**); compose entry.
2. **New** (`/broadcast/new`) — compose text and/or attach a **published** product or collection card.
3. Pick recipients and/or a saved group → send immediately.
4. On collection / design **Publish** with Selected audience: pick a Buyer group → fills members + resolved rates/forward. **Create group** / **Add group** on that sheet invents a group without leaving Publish (no “save current pick as group”).
5. Recipients get a notification / chat delivery per product rules.

## Business rules

| Rule | Detail |
|------|--------|
| Capability | Requires `canPublish` (and selling presence in the ＋ sheet) for compose |
| Groups | CRUD: members (active connections). `defaultRateVisibility` / `allowForward` **nullable** = inherit company usual |
| Company usual | Quiet: last publish choices in `tradeDefaults.publishDefaults` (not a heavy settings page) |
| Refs | Cards only for **published** catalog objects |
| Recipients | Must be visible / not blocked |
| Scheduling | Broadcast send is immediate; collection live window is separate (`startsAt`/`endsAt`) |
| No-forward | Owner may still broadcast a locked card; buyers cannot re-forward (see [chat](./chat.md)) |

## Edge cases / empty states

- No `canPublish` → Broadcast hidden from ＋.
- Empty groups → create a group before bulk send / private Selected publish.
- Unpublished design selected → rejected server-side.

## Seed walkthrough

1. As **Ravi** (already `canPublish`): open Buyer groups → create a group with Jaipur Emporium → use it on Wedding Edit publish Selected, or Broadcast a card.
2. As **Meena**: confirm notification / inbox signal for the broadcast.

## Where it lives

- Web: `apps/web/src/features/broadcast/`
- API: `apps/api/src/broadcast/`
- Contracts: `packages/domain-types/src/broadcast.ts`
