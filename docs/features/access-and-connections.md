# Access & connections

## Purpose

Trust between companies: **follow** (ask → allow), **access request** (named Connect gate), **connection** (trade-ready, **mutual**), plus silent **block**. Relationship management lives under **You → Network** (companies, not individual people). Hub is one PageHeader (**Back · Network**) plus list rows (hints on each row) — no shell title and no sentence under the title. Hub order: **I see theirs** · **They see mine** · **Buyer groups** (if you publish) · **Connections** · **Invites**. Chat noise is **Mute**.

## Who uses it

Any company can request / follow; the other Approves. Both use **Network → Connections**.

## User flows

### Follow

1. On company / Explore → **See new packs** asks (same Follow API; sell-only shops still show it). Shop button: See new packs · **Asked to see packs** · **Seeing packs**. Cancel cancels a pending ask or ends an allowed follow — Followers-audience shop packs and feed go away immediately. Connection / Selected / Granted on request / chat share stay as their own doors. Legacy Everyone (not on Publish) stays public.
2. Shop **You → Network → They see mine**: one list. **Find** filters name/city. Pending asks sit **on top, newest first**, with why-line **Wants to see your new packs** then Allow / Decline — not a tap-through screen. When asks exist, chips **All** | **Asked · N** (All = asks + who already sees you / Stopped). Home Needs `/network/followers?tab=asked` selects the Asked chip. Each allowed card has **See** / **Share** and quiet **Stop**. Stop keeps the card as **Stopped**. Tick See or Share to let them in again. **Decline** still clears the ask. The other shop never sees look vs pack. Chats **Requests** still has the same why-line + Allow / Decline for a new ask. If they ask again while Stopped, they return to the top as Asked.
3. **You → Network → I see theirs**: allowed follows only — no grant type. Row action **Stop seeing**.
4. Allowed follows see Followers-audience posts on Home Followed and Explore. Pending does not.
5. **Request access** (invite / Find on Ekum) is Connect — not Follow. Approve lives on **Chats → Requests**, not a Network list.

### Request access (Connect)

1. On company profile or **Find on Ekum** → Request access. Note is prefilled…  
2. Sending it opens a pending chat. The other business Approves or Ignores on **Chats → Requests** (or Home Needs → that chat) → **one mutual Connection**. There is no Network Requests desk.

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
3. **Either** side may **Block** while Connected. **Only the company that Blocked** may Unblock. No Pause — Mute the chat if you still trade. Old paused rows still show **Resume**.
4. Legacy `/buyers` and `/network/requests` redirect to **Chats → Requests** (`/chats?inbox=requests`).

### Invites

**Network → Invites** or **Chats ⋯ → Invite to connect** — see [referrals](./referrals.md).

## Business rules

| Rule | Detail |
|------|--------|
| Follow ≠ Access | Follow is an ask; Allow does not create a Connection. Restricted (connections/selected) posts stay on those audiences. |
| Follow pending | Same unique pair; `pending` is not a follower for audience / stories / shop Followers-audience. |
| Follow access | Shop-facing **They can see** (see Followers posts) vs **They can share** (put in their pack if Trading + `allowForward`). Look-only and not Connected cannot curate that seller. |
| Home Needs | Incoming follow asks → **They see mine** Asked chip (`/network/followers?tab=asked`). Incoming Connect / first chat → **Chats → Requests** (pending thread). |
| Catalog visibility | Post **audience** (+ block rules). Connection is **mutual** membership for `connections` / related gates — not required for Everyone. Selected stays Selected. |
| Open order | Discoverable catalog lines can be ordered without Connection; does **not** auto-create a Network connection |
| Connection states | `active` · `paused` (legacy only) · `blocked` |
| Silent block | Other party is not notified and **does not see** the connection row; they lose Connection catalog access. Shop 404. |
| Approve vs block | Approving **never** reactivates a block — the **blocker** must Unblock first |
| List masking | `active`: both see the card. `blocked` (and leftover `paused`): only the actor who set status sees the card |
| Actor | Block records who acted; only that company can Unblock |
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

1. Seed: Meena **allowed follow** of Ravi (look); Ravi **allowed follow** of Kavita; **active** connections Ravi↔Meena and Ravi↔Kavita. Seeded shop catalogs are **Followers** (not Everyone) so Seeing packs off hides those packs.
2. As **Ravi**: Network → Connections — one Meena card (Connected).
3. As **Meena**: Network → Connections — one Surat Silk House card (Connected).
4. (Optional QA) Block as either side → other loses the shop (404); **only the blocker** can Unblock.

## Where it lives

- Web: `apps/web/src/features/network/` (Network, I see theirs, They see mine, Connections); `/network/requests` and `/buyers` → Chats Requests
- API: `apps/api/src/access/`, `apps/api/src/discovery/follow.controller.ts`
- Contracts: `packages/domain-types/src/access.ts`
- Spec: `docs/superpowers/specs/2026-09-12-mutual-connection-design.md`
