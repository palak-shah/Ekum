# Broadcast & Buyer groups

## Purpose

**Buyer groups** (saved `BroadcastList` rows) are one reusable recipient set used everywhere: **broadcast send**, **Publish → Selected audience**, and **Visibility** on published packs. Sellers also **compose once and send now** a text or published collection card to many buyers.

## Who uses it

Companies with **selling** on and **`canPublish`** (unlocked after first publish consent).

**Entry points:**
- ~~**＋ → Broadcast to buyers**~~ — compose **hidden** for now (backup; route `/broadcast/new` kept)
- Collection / Selection / album **Share** posts into **chat(s)** via `CatalogShareSheet` (pick 1 or many companies + Find on Ekum) — it does **not** open Broadcast compose or send via buyer groups. Groups remain on Publish Selected and Network → Buyer groups.
- **Network → Buyer groups** — manage groups (edit members, rate/forward defaults)
- **Publish → Selected** — pick or create groups without leaving Publish (same lists)

## Where the same groups are used

| Job | Where |
|-----|--------|
| Send card/text now | **＋ → Compose** → buyer group chips + `listIds` on send |
| Private publish audience | **Publish → Selected** on design / collection / batch |
| Expand audience later | **Visibility** on published pack (`audienceGroupIds` restore) |
| Edit / delete groups | **Network → Buyer groups** (`/broadcast`) |

One group (e.g. “Jaipur retailers”) is the same list in all four places.

## User flows

1. **Compose** (`/broadcast/new`) — pick **Buyer groups** and/or individual companies → send text or published collection card. **Create group** / **Add group** opens inline sheet (draft preserved).
2. **Manage** (`/broadcast`) — list groups; edit members; optional rate/forward defaults; link to **Compose**.
3. **Publish Selected** — pick buyer groups; **Create group** / **Add group** on Publish sheet (unchanged).
4. Recipients get notification / chat delivery per product rules.

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

- No `canPublish` → Broadcast hidden from ＋; no Buyer groups row on Network.
- Empty groups on compose → **Create group** prompt; same on Publish Selected.
- Unpublished design selected → rejected server-side.

## Seed walkthrough

1. As **Ravi** (already `canPublish`): **Network → Buyer groups** → create a group with Jaipur Emporium — or **＋ → Broadcast** → **Create group** on compose. Use the group on Wedding Edit publish Selected, or send a broadcast card.
2. As **Meena**: confirm notification / inbox signal for the broadcast.

## Where it lives

- Web: `apps/web/src/features/broadcast/`
- API: `apps/api/src/broadcast/`
- Contracts: `packages/domain-types/src/broadcast.ts`
