# Access & connections

## Purpose

Trust between companies: **follow** (light), **access request** (named gate), **connection** (trade-ready, **mutual**), plus silent **pause** / **block**. Relationship management lives under **You → Network** (companies, not individual people).

## Who uses it

Any company can request / follow; the other Approves. Both use **Network → Connections**.

## User flows

### Follow

1. On company / Explore → **Follow** / Unfollow.
2. Manage lists: **You → Network → Following** / **Followers**.
3. Followed posts appear on Home Followed and Explore network shelves.

### Request access (Connect)

1. On company profile or **Find on Ekum** → Request access. Note is prefilled…  
2. Other business sees incoming on **Network → Requests** and Home Needs → Approve or Decline → **one mutual Connection** (no second approve).

### Ask to see a pack (not Connect, not put in pack)

1. On a gated pack → **Ask to see this pack** (not Request access, not Ask to put in my pack).  
2. Owner chat: same-size pack card as other shares, ask line in meta, compact WhatsApp-style **Deny | Allow** footer.  
3. **Allow** → **Granted on request** for that pack only (chat + notification + one Home aggregate for the asker) — look through designs; does **not** unlock Curate/relist.  
4. **Deny** → silent to the asker (no deny message).  
5. Owner can list/remove **Granted on request** on the pack.

### Ask to put in my pack

When a design/album is locked for Curate, **Ask to put in my pack** → chat Allow/Deny → per-company product relist grant. Non-blocking for the asker; Allow unlocks that Selection row.

**Desk chain:** If they only saw the design in **your** pack, Ask goes to **you** and follows **your** publish allow / Don’t-allow-to-relist. If they open the **mill’s own** listing, Ask goes to the mill — you are not handling that hop. Mill Allow to you does not auto-free your buyers. Agent role for mixed discovery — later. Distinct from view Ask (see [relist-ask Slice B](../superpowers/specs/2026-09-08-relist-ask-slice-b-design.md) + [desk chain](../superpowers/specs/2026-09-09-relist-desk-chain-design.md)).

### Connections (both roles)

1. **You → Network → Connections** — `GET /connections` lists **one card per Connected company**.
2. Label: **Connected** (no “They buy from you” / “You buy from them”).
3. **Either** side may Pause or Block while Connected. **Only the company that Paused/Blocked** may Resume/Unblock.
4. Legacy `/buyers` redirects to **Network → Requests**.

### Invites

**Network → Invites** or **＋ → Invite to connect** — see [referrals](./referrals.md).

## Business rules

| Rule | Detail |
|------|--------|
| Follow ≠ Access | Follow is permissionless; does not by itself unlock restricted (connections/selected) posts |
| Catalog visibility | Post **audience** (+ block rules). Connection is **mutual** membership for `connections` / related gates — not required for Everyone. Selected stays Selected. |
| Open order | Discoverable catalog lines can be ordered without Connection; does **not** auto-create a Network connection |
| Connection states | `active` · `paused` · `blocked` |
| Silent pause/block | Other party is not notified and **does not see** the connection row; they lose Connection catalog access |
| Approve vs block | Approving **never** reactivates a block — the **blocker** must Unblock first |
| List masking | `active`: both see the card. `paused`/`blocked`: only the actor who set status sees the card (Resume/Unblock) |
| Actor | Pause/Block record who acted; only that company can clear |
| Mutual | One unordered pair after Approve — not two directional owner/viewer edges |
| Design | [Mutual connection](../superpowers/specs/2026-09-12-mutual-connection-design.md) |

See [concepts](./00-concepts.md) for the trust ladder diagram.

## Edge cases / empty states

- No connections → empty Connections list + **Find on Ekum** (name / mobile / GST) + Explore.
- Find on Ekum: match → Request access / Message (or Select/Add if already connected). Phone-like query with no match → **Send invite link**. Name miss → no match, not invite.
- Declined request → can request again per product rules (do not invent auto-retry UX).
- Self-follow / self-access → rejected.
- Already Connected → no second row / no second Approve needed.

## Seed walkthrough

1. Seed: Meena **follows** Ravi; **one** connection **active** Ravi↔Meena.
2. As **Ravi**: Network → Connections — one Meena card (Connected).
3. As **Meena**: Network → Connections — one Surat Silk House card (Connected).
4. (Optional QA) Pause as either side → other loses silent visibility; **only the pauser** can Resume.

## Where it lives

- Web: `apps/web/src/features/network/` (Network, Following, Followers, Connections, Requests); `/buyers` redirect
- API: `apps/api/src/access/`, `discovery/follow.controller.ts`
- Contracts: `packages/domain-types/src/access.ts`
- Spec: `docs/superpowers/specs/2026-09-12-mutual-connection-design.md`
