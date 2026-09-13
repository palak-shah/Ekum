# Mutual connection — design

**Date:** 2026-09-12  
**Status:** Approved — Completeness Proceed (`2026-09-12-mutual-connection-completeness.md`)  
**Disposition:** Redesign (trust ladder Connection becomes one mutual pair)  

**Anchors:** `docs/features/00-concepts.md` (trust ladder), `docs/features/access-and-connections.md`, Network → Connections UI  

## Job

After **Request access → Approve**, traders see **one** Connected business — not two directional rows (“You buy from them” / “They buy from you”). Both can see each other’s published shop content that Connection unlocks. Either side can Pause or Block; **only the company that set Pause/Block can clear it**.

## Decisions locked

| Decision | Choice |
|----------|--------|
| List | One row per other company |
| Catalog after Approve | **Mutual** — each sees the other’s published designs/collections that Connection unlocks (Connections-audience included). **Everyone** was already visible without Connect. **Selected** stays Selected (not opened by Connect). |
| Who may Pause / Block | **Either** side (from `active`) |
| Who may Resume / Unblock | **Only the company that Paused / Blocked** (`statusSetByCompanyId`) |
| Silent Pause/Block | Other party is **not notified** and **does not see** the connection row; they lose Connection visibility (404 / hidden) |
| Approve vs Block | Approving never clears a Block — the blocker must Unblock first |
| Second Approve | Not required — one Approve creates the mutual pair |
| Follow | Unchanged (permissionless feed) |

## User flows

### Connect

1. Company A → Request access on B (profile / Find on Ekum / invite redeem).  
2. B Approves (Network → Requests / Home Needs) or Declines.  
3. On Approve → **one** Connection between A and B, status `active`.  
4. Both lists show the other once: name · Connected · Pause / Block.

### Pause / Resume / Block / Unblock

1. Either company (while `active`) opens Network → Connections → that card.  
2. **Pause** → status `paused`, record **who** paused. Silent to the other (they no longer see the row / lose Connection catalog access). **Only the pauser** sees Resume.  
3. **Block** → status `blocked`, record **who** blocked. Silent to the other. **Only the blocker** sees Unblock.  
4. Approve of a new access request never clears Block — blocker must Unblock first.

### Decline / already connected

- Decline: no connection (same as today).  
- Request when already Connected (active): no second row; plain “Already connected” (or equivalent).  
- Pending request still one-sided until Approve.

## Product rules

| Rule | Detail |
|------|--------|
| Shape | One undirected pair `{companyLo, companyHi}` (or equivalent), not owner/viewer edges |
| Visibility | Mutual membership for `connections` audience when status is `active` |
| Chat | Approve still activates direct participants (as today) |
| Open order | Still does **not** auto-create Connection |
| Labels | Drop “They buy from you” / “You buy from them”. Use **Connected** |
| List masking | `active`: both see the card. `paused`/`blocked`: **only** `statusSetByCompanyId` sees the card (to Resume/Unblock). The other side does not see the row (silent). |
| Actor | Store `statusSetByCompanyId` (nullable when `active`) |

## Data / API (intent)

- Replace directed `ownerCompanyId` + `viewerCompanyId` uniqueness with a **single pair** unique constraint.  
- Add `statusSetByCompanyId` (nullable; set on Pause/Block; cleared on Resume/Unblock to `active`).  
- `ConnectionView`: drop `role`; expose counterpart + `status` + which actions the **current** company may take (`canPause`, `canResume`, `canBlock`, `canUnblock` or equivalent).  
- Audience / discovery / trade “connected?” helpers: mutual **active** only.  
- **Migrate:** for each unordered pair with 1–2 directed rows, collapse to one; status priority **Blocked > Paused > Active**. Prefer earliest `createdAt`. If migrated status is paused/blocked and actor unknown, set `statusSetByCompanyId` to former **owner** of that directed edge (best-effort).

## UI

- **Connections:** one card when visible.  
  - `active`: Pause + Block.  
  - `paused` (I paused): Resume.  
  - `blocked` (I blocked): Unblock.  
- **Requests:** unchanged entry (incoming Approve/Decline).  
- No buy/sell direction chrome on the connection card.

## Out of scope

- Redefining Follow as “chat unlock”  
- Changing Ask to see pack / Ask to put in my pack  
- Auto-connect from first message or order  
- Group chat membership rules beyond existing activate-on-approve  

## Success

- Seed Ravi↔Meena (or any dual edge) shows **one** Jaipur/Surat card each side.  
- One Approve → both see published Connections-audience content from the other.  
- Either Pause/Block → other loses that visibility silently; only the actor can clear it.  
- No second Request/Approve needed for “the other direction.”

## Next

1. Completeness Review — done (`2026-09-12-mutual-connection-completeness.md`); amend actor rule.  
2. Feature docs — keep in sync.  
3. Implementation plan — `docs/superpowers/plans/2026-09-12-mutual-connection.md`.
