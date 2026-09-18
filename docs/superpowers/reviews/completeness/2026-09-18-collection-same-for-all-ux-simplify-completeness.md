# Feature Completeness Review — collection same-for-all UX simplify

**Date:** 2026-09-18  
**Module / ask:** Revert two-CTA apply; Same for all = Done for new photos only; library stays  
**Anchors:** `docs/features/collections.md`, `docs/superpowers/specs/2026-09-18-collection-same-for-all-design.md`  
**Disposition:** Proceed (Redesign — supersedes apply-on-create two-CTA)

> Completeness keeps Ekum **coherent**. Conflicts with product philosophy → **Reject** or **Redesign**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Bulk Apply PATCHed My designs while building a pack — wrong trust model. Shared details are for new photos; library keeps its rates. |
| UX Designer | One **Done**. Why-line: new photos get these; library keeps own; Diff marks differences; tap to change one. |
| Solution Architect | `confirmSameForAll` updates shared state + pending only. No product PATCH from this sheet (create or edit). Member sheet remains the explicit edit/PATCH path. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet + single primary Done.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Per-design edit for changing library rates.  
4. **Naming matches the app?** Done / Diff / Use same as all.

**Philosophy check:** Fits simplicity-first; no second apply decision.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Done + pending inherit + Diff |
| Business rules | OK | No library bulk PATCH |
| Workflows | OK | Create + edit same story |
| Edge cases | OK | Empty clears shared |
| Permissions | N/A | No PATCH from sheet |
| User states | OK | |
| Notifications | OK | Toast |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile / BM-07 | OK | Sheet |
| Accessibility | OK | |

---

## Gaps

| ID | Severity | Gap | Disposition |
|----|----------|-----|-------------|
| — | — | — | — |

---

## Disposition

**Proceed** — update features + design spec, then implement.
