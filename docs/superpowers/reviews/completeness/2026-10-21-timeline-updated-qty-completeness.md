# Feature Completeness Review — Timeline Updated quantity

**Date:** 2026-10-21  
**Module / ask:** After Edit order, Timeline should show the new qty (collapsed), not a bare **Updated**.  
**Anchors:** `docs/features/orders.md`, `2026-09-11-quote-updated-trail-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Collapsed Timeline shows `summary` only. “6 designs” is in `detail` (expand). Put the ticket family qty in summary: **Updated — 60 mtrs**. Same language as Quoted — ₹. |
| UX Designer | Newest-first; qty on the Updated step, not a second line. Mixed: `2 sets = 24 pcs · 60 mtrs`. |
| Solution Architect | Write `amendTrailSummary` on amend. Heal **latest** bare Updated only (older amends stay bare — current qty would lie). |

---

## Platform consistency (required)

1. **Existing patterns?** `quoteTrailSummary` on Quoted.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Family qty rows (same nouns as ticket).  
4. **Naming matches the app?** Updated — 60 mtrs / 2 sets = 24 pcs.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Amend write + heal latest |
| Business rules | OK | Skip declined; do not rewrite older Updated |
| Workflows | OK | Edit → Save → Timeline |
| Edge cases | OK | Two amends: each new row has qty at that moment |
| Permissions | N/A | Buyer amend already gated |
| User states | OK | Trail present after amend |
| Notifications | OK | Chat body uses qty when no custom note |
| Error handling | N/A | |
| Scalability | OK | One heal on list |
| Mobile interactions | OK | Collapsed row is enough |
| First glance (BM-11) | OK | Qty on the step they already look at |
| Accessibility | OK | Text in summary |
| Platform consistency | OK | Quote money pattern |

---

## Gaps

None required.

## Approved scope for this slice

- `amendTrailSummary` / `orderQtyFamilyRows` in domain-types.
- Write summary on `POST /orders/:id/amend`.
- Heal latest bare Updated from current lines.
- Chat default body uses qty when the buyer did not type a note.

## Explicitly deferred / rejected

- Healing every historical Updated to current qty.
- Qty on Requested (place) this slice.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + trader-eye.
