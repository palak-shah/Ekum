# Feature Completeness Review — Cart Repost zero → toast (Explore parity)

**Date:** 2026-11-19  
**Module / ask:** Cart Repost: when nothing can be curated and no Relist Ask, disable + toast (match Explore); do not open the empty explain sheet  
**Anchors:** `docs/features/saved.md`, Completeness `2026-11-02-repost-eligibility-chrome`  
**Disposition:** Proceed (Redesign of prior Cart “zero → stay on sheet”)

> Completeness keeps Ekum **coherent**. It does not make every request work.

Prior lock this slice **replaces** (historical): Cart zero allowed → open Repost sheet with **N designs unavailable** + reason.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Empty explain sheet felt like Repost worked. Explore already grays + toasts at zero. Cart should match when there is nothing to do and no Ask. |
| UX Designer | Dock Repost disabled + toast why. Sheet only when ≥1 allowed or Relist Ask (`RELIST_NOT_ALLOWED`). Pack albums still open resolve. |
| Solution Architect | Reuse existing Cart `curate-check` + `cartMayAskRelist` / `zeroEligibleSharedReason`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore `REPOST_NO_PERMISSION` / gray dock; Cart toast uses shared reason (pack-only copy when applicable).  
2. **Duplicates?** No — aligns Cart with Explore zero gate.  
3. **Reuse?** `POST /collections/curate-check` already on SelectionPage.  
4. **Naming?** Repost · Ask to put in my collection unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** Yes vs prior Cart explain-at-zero → Redesign then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Block empty open; Ask/allowed still open |
| Business rules | OK | Ask only RELIST_NOT_ALLOWED; pack-only never Ask |
| Workflows | OK | Designs-only gate; pack albums → resolve |
| Edge cases | OK | Check loading: keep enabled until settled |
| Permissions | OK | Same curate codes |
| First glance (BM-11) | OK | No fake Repost sheet |
| Platform consistency | OK | Explore parity |

---

## Approved scope

- Helper: blocked-empty Cart Repost when check settled, zero allowed, no Ask, no relistable albums.
- SelectionPage dock: disable + toast; `onCurate` / `openCurate` resume respect gate.
- Update `saved.md`; units for gate matrix.

## Explicitly deferred / rejected

- Changing Explore feed chrome  
- Ask on pack-only / look-only  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
