# Access & connections

## Purpose

Trust between companies: **Follow** (ask → allow — whose collections/updates you see), **access request** (Connect gate — ask to communicate), **Connection** (mutual trade/chat relationship), plus silent **block**. Management lives under **Network** (companies, not people). Hub is one PageHeader (**Back · Network**) plus list rows — no shell title sentence under the title.

**Locked hub order:** **Following** · **Followers** · **Buyer groups** (if you publish) · **Connections** · **Direct links** (when trading) · **Invites**. Chat noise is **Mute**.

Routes remain `/network/following` and `/network/followers`. Completeness: `2026-11-17-business-network-experience-audit`. TG-01–04 UI labels shipped in Iteration 4B.

## Who uses it

Any company can **Follow** or **Ask to connect**; the other Approves. Both use **Network → Connections** for the communicate list.

### Naming (required)

- **Follow** = the **action** (and the relationship kind). Shop/Explore idle CTA: **Follow**. Do **not** rename this action to “Request access.”
- **Following** = the **resulting state** on the shop (filled CTA) **and** the Network destination (outbound list). Same word, two surfaces — not a synonym for the Follow action.
- **Followers** = Network destination (inbound list) / audience chip — not the Follow button.
- **Request to access** = gated / forwarded **pack view** ask only (`POST /collection-view-requests`). Not Follow, not Ask to connect.
- Pending Follow CTA stays **Requested**.

## Terminology glossary

| Label | Role | Means | API |
|-------|------|-------|-----|
| **Follow** | Action | Ask to see their collections/updates | `POST /follows` |
| **Following** | State + Network destination | Allowed outbound; shop filled CTA; hub list “Businesses you see updates from.” | `GET /follows/following` |
| **Followers** | Network destination | Inbound allowed + asks; “Businesses who can see your updates.” | `GET /follows/followers`, asks |
| **Connections** | Network destination | Businesses you can communicate with | `GET /connections` |
| **Ask to connect** | Action (Connect) | Ask for a **Connection** (Find / message-to-connect) | `POST /access-requests` |
| **Ask to repost** | Action (Follow upgrade) | Pack/Repost access on Follow path | `POST /follows/share-ask` |
| **Request to access** | Action (pack view) | Ask to open one gated/forwarded pack | `POST /collection-view-requests` |
| **Unfollow** | Action | Remove the Follow relationship (shop ⋯ + Following list) | `DELETE /follows/:id` |
| **Block** | Action | Silent directed Network block (own edge). **Only** shipped way to end communicate (phones / Place prefer / Direct send). | `CompanyBlock` + `POST …/block` |
| **Unblock** | Action | Clear **own** directed block only | `DELETE` own `CompanyBlock` via `…/unblock` |

There is **no** Remove-connection action. Shop ⋯ **Unfollow** only deletes Follow (`DELETE /follows`); Connection stays if present. Ending communicate is **Block** (wipes Follows on first edge).

### Destination page subtitles (not on hub or Business Profile)

- **Following** — Businesses you see updates from.  
- **Followers** — Businesses who can see your updates.  
- **Connections** — Businesses you can communicate with.

## Locked relationship model (do not merge)

| Concept | Job |
|---------|-----|
| **Follow** | Whose collections/updates a company can see (`look` / `pack`). |
| **Connection** | Communicate (chat / opted-in phones / Place prefer). |

**Asymmetry:**

1. Follow approval → Follow **+** Connection.  
2. Connect approval → Connection **only** (no Follow).  
3. Message acceptance → Connection **only** (no Follow).  
4. Unfollow → removes Follow; **does not** remove Connection.  
5. Connection alone → **no** collections / private-profile unlock.  
6. Block → directed `CompanyBlock` edges (bilateral). Either edge restricts shop / Explore / messaging. First edge wipes Follows both ways; DL rows stay (gray until Pack). Each side Unblocks only its edge; **both** clear → Connection communicate again — not look/pack.

## User flows

### Follow

1. On company / Explore → **Follow** (Follow API; sell-only shops still show it). Locked shop primary: lock + **Follow** · pending outline · unlock + **Following**. Cancel cancels a pending ask or ends an allowed Follow — Followers-audience shop packs and feed go away immediately. Connection / Selected / Granted on request / chat share stay as their own doors. Legacy Everyone / Connections catalog rows are treated as **Followers** (not open to the whole platform).
2. **Network → Followers**: one list. Page subtitle: *Businesses who can see your updates.* **Find** filters name/city. Pending asks sit **on top, newest first**, with why-line **Wants to follow you and see your collections.**, checkbox **Allow Repost** (off), **Accept** / **Reject**. **Accept** → approver toast **Accepted**; follower gets notify `{shop} accepted your follow` (or `{shop} allowed you to repost their collections` for Pack). Completeness: `2026-11-24-repost-audit-24-40-copy`. **Reject** stays silent. When asks exist, chips **All** | **Asked · N**. Home Needs `/network/followers?tab=asked` selects Asked. Each allowed card has **See** / **Repost** and quiet **Stop**. Stop keeps the card as **Stopped**. Tick See or Repost to let them in again. Chats **Requests** uses the same ask controls. If they ask again while Stopped, they return to the top as Asked.
3. **Network → Following**: allowed outbound Follows only — no grant type. Page subtitle: *Businesses you see updates from.* Row action **Unfollow**.
4. Allowed Follows see Followers-audience posts on Explore. Pending does not. Allowed Follow also unlocks a **Private** Business Profile (full cover/showcase); strangers see a stub — see [company](./company.md). Profile Public/Private is **not** collection audience.
5. **Ask to connect** (invite / Find on Ekum / message-to-connect) is Connect — not Follow. Approve lives on **Chats → Requests**, not a Network list.
6. **Ask to repost** is a Follow pack-upgrade ask (`share-ask`), not a separate trust ladder — still Follow with Repost access after Accept.

### Ask to connect (Connect)

1. **Find on Ekum** (or other Connect doors) → **Ask to connect** (Connect API). Note is prefilled…  
2. Sending opens a pending chat. The other business Approves or Ignores on **Chats → Requests** → **one mutual Connection** (no Follow). **Approve** → approver toast **Connected** + existing requester notify. **Ignore** = hide/archive that chat only (silent); it does **not** decline the AccessRequest — the ask may stay pending for a later Approve or re-Ask. There is no Network Requests desk.

### Ask to see a pack (not Connect, not put in pack)

1. On a gated pack → **Request to access** (pack view grant only — not Follow, not Ask to connect, not Ask to put in my pack). Quiet link to the shop Follow door: **Follow on their shop**.  
2. Owner chat: same-size pack card as other shares, ask line in meta, compact WhatsApp-style **Deny | Allow** footer.  
3. **Allow** → **Granted on request** for that pack only (chat + notification + one Home aggregate for the asker) — look through designs; does **not** unlock Curate/relist.  
4. **Deny** → silent to the asker (no deny message).  
5. Owner can list/remove **Granted on request** on the pack.

### Ask to put in my pack

When a design/album is locked for Curate, **Ask to put in my pack** → chat Allow/Deny → per-company product relist grant. Non-blocking for the asker; Allow unlocks that Selection row.

**Desk chain:** If they only saw the design in **your** pack, Ask goes to **you** and follows **your** publish allow / Don’t-allow-to-relist. If they open the **mill’s own** listing, Ask goes to the mill — you are not handling that hop. Mill Allow to you does not auto-free your buyers. Agent role for mixed discovery — later. Distinct from view Ask (see [relist-ask Slice B](../superpowers/specs/2026-09-08-relist-ask-slice-b-design.md) + [desk chain](../superpowers/specs/2026-09-09-relist-desk-chain-design.md)).

### Connections (both roles)

1. **Network → Connections** — `GET /connections` lists **one card per Connected company**. Page subtitle: *Businesses you can communicate with.*
2. Label: **Connected** (no “They buy from you” / “You buy from them”).
3. **Either** side may **Block** at any time (including when already blocked by the other) from chat, shop ⋯, or Connections. Each company clears **only its own** block. While **either** directed edge exists: shop/Explore inaccessible, Direct **send** → `CANNOT_MESSAGE`, new first-reach stays silent; chats stay in All (no auto-Archive). First Block for the pair deletes both Follow rows; Direct Link **rows stay** (gray until mill Pack). Toast **Blocked**. Unblock own edge: if the other edge remains → toast **Your block removed** (still restricted); when **both** clear → Connection communicate again (not look/pack) + cleared-access toast. Unblock from **Chats ⋯ → Blocked**, **Connections**, or shop ⋯. No Pause — Mute if you still trade. Completeness: `2026-11-17-bilateral-company-block-completeness`.
4. Legacy `/buyers` and `/network/requests` redirect to **Chats → Requests** (`/chats?inbox=requests`).

### Invites

**Network → Invites** or **Chats ⋯ → Invite to connect** — see [referrals](./referrals.md).

## Business rules

| Rule | Detail |
|------|--------|
| Follow Accept ⇒ Connection | Follow is an ask; **Accept** upserts a mutual **Active Connection** and opens/restores a Pending or Ignored Direct. Connect ⇏ Follow. Older Allowed rows are backfilled the same way. If **I** blocked them, Accept confirms then clears **my** Block edge before Allow (their Block edge still restricts). |
| Message / Connect Accept | Creates **Connection only** — no Follow / Followers feed. |
| Unfollow | Deletes Follow (or cancels pending). **Does not** remove Connection. |
| Connection alone | Chat / phones / Place prefer — **not** Private profile unlock, **not** Followers packs, **not** Repost. |
| Accept / Reject grants | Accept without **Allow Repost** → look; with tick → pack. Reject pending Follow → no look/pack (row deleted). Reject **Ask to repost** (share-ask) → Repost denied; **Look stays**; `packAskPending` cleared only (not Stopped). |
| Block clears Follows | First directed Block deletes both Follow directions (not Stopped). Second edge is no-op on Follows. Unblock never restores look/pack. End communicate = Block only (no Remove connection). |
| Bilateral Block | `CompanyBlock` per direction. Either edge restricts. Unblock one side never clears the other. |
| Follow pending | Same unique pair; `pending` is not a follower for audience / stories / shop Followers-audience. |
| Follow access | Shop-facing **They can see** (see Followers posts) vs **They can repost** (put in their pack if Trading + `allowForward`). Look-only without Repost cannot curate that seller’s Followers/Selected lines — **even if Connected**. Exception: audience **Everyone** + `allowForward` stays Repostable without Pack. Mill Pack→Look posts one grey centered system line in the **exact** mill↔trader Direct only (trader: **{Mill} turned off Repost for you · Request**; mill: **You turned off Repost for {Trader}**). Buyer never notified; unfollow/Stop silent; Forward/Share ungated. Completeness: `2026-11-14-look-only-blocks-repost-completeness`, `2026-11-17-repost-off-chat-line-completeness`. |
| Home Needs | Incoming follow asks → **Followers** Asked chip (`/network/followers?tab=asked`). Incoming Connect / first chat → **Chats → Requests** (pending thread). |
| Catalog visibility | Post **audience** (+ block rules). Legacy Everyone/Connections enforce as Followers. Selected stays Selected. Connection unlocks trade / other doors. |
| Profile visibility | Company **Public / Private**. Full Private profile = owner or approved Follower. Showcase follows profile access, not pack audience. Explore/Find omit Private for strangers. |
| Contact phones | Company + team opt-in phones on Business Profile only for **Connections**. Follow alone is not enough. Login OTP phone never shown. |
| Open order | Place **prefers** Active Connection (from Allow or Connect). Discoverable / openable pack lines may Place without inventing a second Connect gate; Allow ⇒ Connection so followers are not stuck on **Connect with this business**. Direct mill tickets still need mill Pack + buyer Allowed→trader on Place paths. |
| Connection states | `active` · `paused` (legacy Resume). Display `blocked` = **I** have a `CompanyBlock` edge. |
| Silent block | Other party is not notified and **does not see** my block on Connections; they lose access via either-edge gates. Shop 404. |
| Approve vs block | Approving **never** clears `CompanyBlock` — each side must Unblock its own edge |
| List masking | Clear Active (no edges): both see. My Block: I see Blocked + Unblock. Their-only Block: hidden from me. Pause: pauser only. |
| Mutual Connection | One unordered pair after Approve — Block is separate directed edges |
| Design | [Mutual connection](../superpowers/specs/2026-09-12-mutual-connection-design.md) |
| Network audit | Completeness `2026-11-17-business-network-experience-audit` |

See [concepts](./00-concepts.md) for the trust ladder diagram.

## Edge cases / empty states

- No connections → empty Connections list + **Find on Ekum** (name / mobile / GST) + Explore.
- Find on Ekum: match → **Ask to connect** / Message (or Select/Add if already connected). Phone-like query with no match → **Send invite link**. Name miss → no match, not invite.
- Declined request → can request again per product rules (do not invent auto-retry UX).
- Self-follow / self-access → rejected.
- Already Connected → no second row / no second Approve needed.
- After Unfollow: may still Chat / see phones if Connection remains; no Followers packs / no Private unlock from that Follow.

## Seed walkthrough

1. Seed: Meena **allowed follow** of Ravi (look); Ravi **allowed follow** of Kavita; Meena **allowed follow** of Kavita — seed backfill ensures **Active** connections for every Allowed pair (Ravi↔Meena, Ravi↔Kavita, Meena↔Kavita). Seeded shop catalogs are **Followers** (not Everyone) so Following off hides those packs.
2. As **Ravi**: Network → Connections — Meena (and Kavita) Connected.
3. As **Meena**: Network → Connections — Surat Silk House and Ahmedabad Loom Co Connected (from Allow); Network → Following shows shops she can see.
4. (Optional QA) A Blocks B → B loses shop (404) / cannot message; B can still Block A (second edge). A Unblock alone leaves B’s edge → still restricted. Both Unblock → Connection only.

## Where it lives

- Web: `apps/web/src/features/network/` (Network hub, Following, Followers, Connections); `/network/requests` and `/buyers` → Chats Requests. Entry: Home **Network** pill, account menu, or You shortcuts.
- API: `apps/api/src/access/`, `apps/api/src/discovery/follow.controller.ts`
- Contracts: `packages/domain-types/src/access.ts`
- Spec: `docs/superpowers/specs/2026-09-12-mutual-connection-design.md`
