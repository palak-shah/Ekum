# Shared concepts

## Purpose

Vocabulary and trust rules that every feature assumes. Read this before catalog, Explore, access, or chat docs.

## Who uses it

Everyone on the platform — buyers, sellers, and dual-role companies.

## Core model

| Concept | Meaning |
|---------|---------|
| **Company account** | The trading entity. Product pitch is one company, no “are you a buyer or seller?” role enum. |
| **Contact person** | The logged-in user’s display name (e.g. Ravi) — distinct from the **business name** (e.g. Surat Silk House). |
| **Capabilities** | Stored flags: `publish`, `relist`, `refer`. Unlock progressively; never a role picker. |
| **Trade presence** | `buyingEnabled` / `sellingEnabled` toggles what ＋ and Home emphasize. Creating catalog content turns selling back on. |

Membership roles (`owner` / `staff`) and permissions exist in the domain for future team use; Phase 1 UX treats the signed-in company as the actor.

## Trust ladder

```mermaid
flowchart LR
  follow[Follow permissionless]
  access[Access request]
  connection[Connection active]
  trade[Chat rates orders]
  follow --> access
  access -->|approve| connection
  connection --> trade
```

| Mechanism | What it is |
|-----------|------------|
| **Follow** | Permissionless. See followed posts on Home / Explore “following”. Does **not** unlock full catalog or trade. |
| **Access request** | Named gate: note + optional referral. Approve / decline. |
| **Connection** | After approve: `active` → catalog visibility & trade. Owner can **pause** or **block** (silent to the other party). |
| **Block / pause** | Viewer is not told. API returns **404** (not 403). Approve never reactivates a block — must **unblock** first. |

## Catalog lifecycle

| Status | Designs | Collections |
|--------|---------|-------------|
| **Draft** | Private library work-in-progress | Album work-in-progress |
| **Ready** | — | Company-only review queue (not buyer-visible) |
| **Published** | On the company shop | Live for buyers only inside `startsAt`/`endsAt` window |
| **Archived** | Ended / out of season | Ended / out of season |

### Collection live window & badges

| Field | Meaning |
|-------|---------|
| `startsAt` null | Live as soon as published |
| `endsAt` null | **Evergreen** (no scheduled hide) |
| Past `endsAt` | Same as Hide → **draft** (job + read guards; not auto-archive) |

Seller My Catalog badges: **Draft** · **Ready** · **Starts…** · **Live** (+ **Evergreen** or **Ends…**) · **Archived**.

### Publish = Explore

| Action | Effect |
|--------|--------|
| **Publish** | Design or collection goes live for the chosen **audience** on Explore (and shop). Designs set `postedToMarketAt`. First-ever publish requires **consent to sell** → sets `canPublish`. |
| **Visibility** | Same sheet as publish — change who can see it / rates / forward without a separate “post” step. |
| **Hide / unpublish** | Returns to draft; design Explore post is cleared (`postedToMarketAt` null). Collection hide clears `exploreActivityAt`. |

### Audience, rates & forward

When publishing (or updating visibility), the sheet sets:

| Field | Values | Default practice |
|-------|--------|------------------|
| **Audience** | `everyone` · `connections` · `followers` · `selected` (+ company IDs and optional **Buyer group(s)**) | Connections |
| **Rate visibility** | `visible` · `on_request` | On request (or company usual) |
| **Buyers can forward** | checkbox (on by default) | Uncheck = lock this pack/design |

| Audience | Who sees on Explore |
|----------|---------------------|
| Everyone | Any signed-in company (existing block/trust rules) |
| Connections | Active connections with the seller |
| Followers | Companies that follow the seller (not necessarily connected) |
| Selected | Listed companies / buyer groups |

**Layers (simple):** company usual (last publish remembered in `tradeDefaults.publishDefaults`) → selected buyer-group override(s), **strictest wins** if several → this item’s Publish sheet. Snapshot on `Product.allowForward` / `Collection.allowForward`. `audienceGroupIds` restores which groups were chosen on **Visibility** (expand who later without a second pack). One collection may include many groups (member union); not per-group policies on one card.

**Staff audit:** Product, Collection, and Order store `createdByUserId` / `updatedByUserId` (names on list/detail). Full AuditLog history UI is later.

**Trust:** When locked (`allowForward === false`), only the **supplier** may share into chat / Explore / broadcast. Non-owners get `FORWARD_NOT_ALLOWED` from the API; Forward is hidden in the UI. Never claim “exclusive” without this gate.

## Designs vs collections

| | Designs | Collections |
|--|---------|-------------|
| Role | First-class library items | Named albums that **group** designs |
| Standalone | Yes — sell or Explore alone | Always made of designs |
| Many-to-many | A design can sit in many collections | — |

See [Catalog](./catalog.md) and [Collections](./collections.md).

## Where it lives

- Contracts: `packages/domain-types/src/enums.ts`, `access.ts`, `company.ts`, `catalog.ts`
- Visibility: `apps/api/src/access/visibility.service.ts`
- Publish consent: `apps/api/src/catalog/publish-capability.ts`
- Trade presence: `apps/api/src/identity/trade-presence.ts`
