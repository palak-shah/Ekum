# Access & connections

## Purpose

Trust between companies: **follow** (light), **access request** (named gate), **connection** (trade-ready), plus silent **pause** / **block**. Sellers manage buyers from **You → Buyers**.

## Who uses it

Buyers request / follow; sellers approve and manage connections. Both see outcomes on Home Needs and company profiles.

## User flows

### Follow

1. On company / Explore → **Follow** / Unfollow.
2. Followed posts appear in Explore following filter and Home followed sections.

### Request access

1. On company profile → Request access (optional note; referral token may pre-fill `referredBy`).
2. Seller sees incoming on **Buyers** and Home Needs → Approve or Decline.

### Manage connection (seller / owner)

1. Open **Buyers** (`/buyers`).
2. Pause / resume an active connection; Block / unblock.
3. Outgoing requests: track pending / declined.

## Business rules

| Rule | Detail |
|------|--------|
| Follow ≠ Access | Follow is permissionless; does not unlock full catalog trade |
| Catalog visibility | Requires connection **active** (plus audience rules on posts) |
| Connection states | `active` · `paused` · `blocked` |
| Silent pause/block | Other party is not notified; they get **404** / hidden rows |
| Approve vs block | Approving **never** reactivates a block — must Unblock first |
| List masking | Owner still sees blocked/paused peers; viewer does not see those edges |

See [concepts](./00-concepts.md) for the trust ladder diagram.

## Edge cases / empty states

- No buyers yet → empty Buyers list + prompt to share profile / wait for requests.
- Declined request → can request again per product rules (do not invent auto-retry UX).
- Self-follow / self-access → rejected.

## Seed walkthrough

1. Seed: Meena **follows** Ravi; connection **active** Ravi↔Meena.
2. As **Ravi**: open Buyers — see Meena / Jaipur Emporium.
3. As **Meena**: confirm access to published catalog details that require connection.
4. (Optional QA) Pause as Ravi → Meena loses silent visibility; resume to restore.

## Where it lives

- Web: `apps/web/src/features/buyers/MyBuyersPage.tsx`; actions on company / Explore
- API: `apps/api/src/access/` (`AccessService`, `ConnectionService`, `VisibilityService`), `discovery/follow.controller.ts`
- Contracts: `packages/domain-types/src/access.ts`
