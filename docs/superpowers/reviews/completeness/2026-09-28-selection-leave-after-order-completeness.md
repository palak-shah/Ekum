# Feature Completeness Review — Leave Your selection after Place

**Date:** 2026-09-28  
**Module / ask:** After Place from **Your selection**, the pile is empty so the screen says **Nothing selected** while a bottom toast says **1 order placed · Open chat**. Traders read the empty state, miss the toast.  
**Anchors:** `docs/features/saved.md`, `docs/features/explore.md`, `docs/features/orders.md`, ui-quality-bar (one job per screen)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Place finished. Next job is the trade chat (or Orders if several). Empty Selection is not a success screen. |
| UX Designer | Bookmark already leaves to Saved so empty + toast never fight. Shop Order already opens the thread. Selection Place should match — not invent a Done sheet. |
| Solution Architect | Same `useShortlistOrderFlow` after batch/from-pack. Full single success → `navigateToOrderChat` (replace). Several / partial → `/orders`. Failures-only stay. Toast copy stays; drop Open chat when we already left. |

---

## Platform consistency (required)

1. **Existing patterns?** Bookmark → Saved; Ask rates → chat; shop dock Place → chat. Toast, no Done sheet.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `navigateToOrderChat` + existing batch toast title.  
4. **Naming matches the app?** **1 order placed** stays. No new empty-state copy.

**Philosophy conflict?** No. One job: after Place, leave the pile.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Leave on success |
| Business rules | OK | Selection still clears |
| Workflows | OK | Align Bookmark / shop |
| Edge cases | OK | N shops → Orders list; partial → list; 0 placed → stay |
| Permissions | N/A | |
| User states | OK | replace so Back is not empty Selection |
| Notifications | N/A | |
| Error handling | OK | Failures stay + toast |
| Scalability | N/A | |
| Mobile interactions | OK | Toast on destination, not over empty |
| Accessibility | OK | Heading is chat / Orders, not Nothing selected |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Empty Selection fights Place toast

| Field | Content |
|-------|---------|
| Gap | Place clears the pile then stays on `/selection` |
| Why it matters | Centre copy says the opposite of the toast |
| Impact if ignored | Traders think the order did not happen |
| Recommendation | Leave like Bookmark / shop Place |
| Priority | Required before implementation |

---

## Approved scope for this slice

- After successful Place / Ask rates from traveling Selection: leave `/selection` (replace). One order → that chat (or order page). Several or partial → `/orders`.
- Keep auto-dismiss toast. No Open chat action when already on the destination.
- Stay on Selection only when nothing was placed.

## Explicitly deferred / rejected

- Done / success sheet on Selection (already rejected: toast, no Done sheet).
- Changing empty-state copy for idle Clear (Clear still shows Nothing selected).
- Share / Curate empty-screen after success (same pattern later if needed).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
