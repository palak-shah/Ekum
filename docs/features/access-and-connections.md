# Access & connections

## Purpose

Trust between companies: **follow** (light), **access request** (named gate), **connection** (trade-ready), plus silent **pause** / **block**. Relationship management lives under **You → Network** (companies, not individual people).

## Who uses it

Buyers request / follow; sellers approve and manage connections. Both roles use **Network → Connections**.

## User flows

### Follow

1. On company / Explore → **Follow** / Unfollow.
2. Manage lists: **You → Network → Following** / **Followers**.
3. Followed posts appear on Home Followed and Explore network shelves.

### Request access

1. On company profile, collection, or **Find on Ekum** (most connection pickers: name, mobile, or GST field; **Chats ＋** uses a Find on Ekum **link** after the business search — see [chat](./chat.md)) → Request access. Note is prefilled with a default (“Hi, we would like to see rates…”). Tap the field to clear and write your own; send with empty field still uses the default. Profile still lets you edit the note; picker send uses the default.
2. Seller sees incoming on **Network → Requests** and Home Needs → Approve or Decline.
3. Outgoing pending: same Requests page.

### Connections (both roles)

1. **You → Network → Connections** — `GET /connections` for owner and viewer edges.
2. Labels: “They buy from you” (owner) / “You buy from them” (viewer).
3. Owner-only: Pause / resume / block / unblock.
4. Legacy `/buyers` redirects to **Network → Requests**.

### Invites

**Network → Invites** or **＋ → Invite to connect** — see [referrals](./referrals.md).

## Business rules

| Rule | Detail |
|------|--------|
| Follow ≠ Access | Follow is permissionless; does not by itself unlock restricted (connections/selected) posts |
| Catalog visibility | Post **audience** (+ block rules). Connection is membership for `connections` / related gates — not required for Everyone |
| Open order | Discoverable catalog lines can be ordered without Connection; does **not** auto-create a Network connection |
| Connection states | `active` · `paused` · `blocked` |
| Silent pause/block | Other party is not notified; they get **404** / hidden rows |
| Approve vs block | Approving **never** reactivates a block — must Unblock first |
| List masking | Owner still sees blocked/paused peers; viewer does not see those edges |
| Directional | Connection has catalog **owner** and **viewer** — not a mutual social edge |

See [concepts](./00-concepts.md) for the trust ladder diagram.

## Edge cases / empty states

- No connections → empty Connections list + **Find on Ekum** (name / mobile / GST) + Explore.
- Find on Ekum: match → Request access / Message (or Select/Add if already connected). Phone-like query with no match → **Send invite link**. Name miss → no match, not invite.
- Declined request → can request again per product rules (do not invent auto-retry UX).
- Self-follow / self-access → rejected.

## Seed walkthrough

1. Seed: Meena **follows** Ravi; connection **active** Ravi↔Meena.
2. As **Ravi**: Network → Requests / Connections — see Meena.
3. As **Meena**: Network → Connections — see Surat Silk House (“You buy from them”).
4. (Optional QA) Pause as Ravi → Meena loses silent visibility; resume to restore.

## Where it lives

- Web: `apps/web/src/features/network/` (Network, Following, Followers, Connections, Requests); `/buyers` redirect
- API: `apps/api/src/access/`, `discovery/follow.controller.ts`
- Contracts: `packages/domain-types/src/access.ts`
