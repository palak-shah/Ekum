# Feature Completeness Review — Bilateral CompanyBlock

**Date:** 2026-11-17  
**Module / ask:** Redesign Block from single-actor `Connection.status=blocked` + `statusSetByCompanyId` to directed bilateral `CompanyBlock` edges.  
**Anchors:** `docs/features/access-and-connections.md`, `docs/features/00-concepts.md`, architecture plan bilateral Block, prior Completeness `2026-11-17-block-send-followers-explore-completeness.md`  
**Disposition:** Proceed (Redesign of D1 actor-steal — product rule change)

> Completeness keeps Ekum **coherent**. Conflicts with philosophy → Reject/Redesign. This **is** an intentional Redesign of Block ownership.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Either side may Block anytime (including when already blocked by the other). Each clears only own block. Either edge keeps shop/Explore/messaging restricted. Both clear → Connection only — not Follow/look/pack. Silent: never reveal “they blocked you.” |
| UX Designer | Shop/Connections/Blocked page: Block XOR Unblock = **my** edge. Thread ⋯ Block inserts own edge even if they already blocked. Unblock toast: Connection restored only when both clear; else quiet “Your block removed” / keep cleared-access toast when Connection returns. |
| Solution Architect | Directed `CompanyBlock` (Follow-shaped). Stop writing `Connection.status=blocked`. Keep `statusSetByCompanyId` for Pause only. `isBlocked` = either edge (dual-read during migrate). First block 0→1 → Follow wipe + DL keep/gray. |

---

## Platform consistency (required)

1. **Existing patterns?** Directed edge like Follow; silent Block; `applyBlockSideEffects` Follow wipe; chats stay in All.  
2. **Duplicates another feature?** No — replaces single-actor Block.  
3. **Should reuse an existing workflow?** Same entry points (shop ⋯, chat, Connections, Blocked page).  
4. **Naming matches the app?** Block / Unblock — plain.  
5. **Units?** N/A.

**Philosophy conflict?** No — clearer trust model than first-blocker owns Unblock.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Bilateral edges + gates |
| Business rules | OK | Locked product rule |
| Workflows | OK | Same doors |
| Edge cases | OK | Second Block; partial Unblock; pre-connect Block; Pause legacy |
| Permissions | OK | Own edge only for Unblock |
| User states | OK | |
| Notifications | OK | Still silent |
| Error handling | OK | `CANNOT_MESSAGE` / 404 |
| Scalability | OK | Indexed unique pair |
| Mobile interactions | OK | No new chrome |
| First glance (BM-11) | OK | Same menus |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Actor steal on company-block

| Field | Content |
|-------|---------|
| Gap | `blockCounterpart` overwrites `statusSetByCompanyId`. |
| Why it matters | Blocked party can steal Unblock. |
| Recommendation | Directed edges; second Block adds second edge. |
| Priority | Required before implementation |

### G-002 — Single status cannot hold two blockers

| Field | Content |
|-------|---------|
| Gap | `Connection.status=blocked` + one actor field. |
| Recommendation | `CompanyBlock` table; stop writing blocked status. |
| Priority | Required before implementation |

### G-003 — Partial Unblock UX

| Field | Content |
|-------|---------|
| Gap | Clearing my edge while theirs remains must keep restrictions. |
| Recommendation | `isBlocked` either edge; toast only full restore when both clear. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Schema `CompanyBlock` + migration from existing Blocked rows.  
- Dual-read then stop writing `Connection.status=blocked`.  
- `isBlocked` / Explore filter / shop / send / startDirect / Approve gates on either edge.  
- Block = upsert own edge; first edge → side effects; Unblock = delete own.  
- `canBlock` / `canUnblock` = my edge; list Blocked = my edges.  
- Docs + API units + update gap matrix. DL keep/gray wording (not hard delete).

## Explicitly deferred / rejected

- Hard-delete Direct Link rows on Block.  
- Auto-Archive chats.  
- Explore Network Block control.  
- Restoring Follow / look / pack on Unblock.  
- Unrelated profile / Home / serializer worktree.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (API units Required this slice; e2e journey Recommended if time)
