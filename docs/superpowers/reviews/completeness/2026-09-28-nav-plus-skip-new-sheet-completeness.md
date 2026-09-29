# Feature Completeness Review — Nav ＋ skips the New sheet

**Date:** 2026-09-28  
**Module / ask:** ＋ opens a **New** sheet with one **New collection** button. One extra tap. Go straight to create.  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/00-concepts.md`, ui-quality-bar (fewer taps, one job)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | ＋ already means create a pack. A sheet with one row is a delay, not a menu. |
| UX Designer | Sell+upload → New collection page. Buy-only → Orders (same one-row smell). No-cap → toast why-line, not a sheet titled New. Do not put Add designs back. |
| Solution Architect | Click uses `createFabIntent` href or toast. Drop the New Sheet. |

---

## Platform consistency (required)

1. **Existing patterns?** Nav ＋; collection create already has **New collection** header.  
2. **Duplicates another feature?** The sheet duplicated the page title.  
3. **Should reuse an existing workflow?** `/catalog/collections/new`.  
4. **Naming matches the app?** Page title stays **New collection**.

**Philosophy conflict?** No — fewer taps.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Direct navigate |
| Business rules | OK | Caps unchanged |
| Workflows | OK | You Add still designs |
| Edge cases | OK | Explain toast |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Toast for blocked |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sheet over nav |
| Accessibility | OK | aria-label Create |
| Platform consistency | OK | |

## Approved scope for this slice

- ＋ → `/catalog/collections/new` when they can upload and sell.
- ＋ → `/orders` when buy-only.
- ＋ → danger toast when this login cannot add or order.
- No New sheet.

## Explicitly deferred / rejected

- Putting Add designs / Photo order / Invite on nav ＋.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
