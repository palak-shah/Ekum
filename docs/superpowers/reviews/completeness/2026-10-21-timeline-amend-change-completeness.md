# Feature Completeness Review — Timeline names the Edit, not the tally

**Date:** 2026-10-21  
**Module / ask:** Ticket Total already shows `130 mtrs`. Timeline must not repeat it. Name the change: **Updated qty** and/or **Removed N design(s)**. Drop **6 designs** on every Updated row.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-timeline-updated-qty-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Metres live once, on Total. Timeline says what they did. Design count is “how many lines exist,” not the edit. |
| UX Designer | Collapsed summary only. `Updated qty` / `Removed 1 design` / `Removed 3 designs`. Both: `Updated qty · Removed 1 design`. No `— 130 mtrs`. |
| Solution Architect | Diff before/after by `productId`. Qty-changed = same id, different qty. Remove-only is not also Updated qty (total metres drop because a line left). Heal `Updated — …` → `Updated qty`; strip `N designs` details. |

---

## Platform consistency (required)

1. **Existing patterns?** Trail summary like Quote updated (what happened).  
2. **Duplicates another feature?** No — Total keeps the tally.  
3. **Should reuse an existing workflow?** Amend still one `updated` type.  
4. **Naming matches the app?** **qty**, **design** — not quantity / SKU.

**Philosophy conflict?** No — one number, one job.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Amend write + heal |
| Business rules | OK | Remove ≠ qty change; skip declined not needed (amend replaces open lines) |
| Workflows | OK | Edit → Save → Timeline |
| Edge cases | OK | Note-only → **Updated**; both flags · join |
| Permissions | N/A | |
| User states | OK | Trail present after amend |
| Notifications | OK | Chat default body matches summary, no metres |
| Error handling | N/A | |
| Scalability | OK | Heal on list |
| Mobile interactions | OK | Collapsed summary |
| First glance (BM-11) | OK | No second 130 mtrs |
| Accessibility | OK | Text in summary |
| Platform consistency | OK | |

---

## Gaps

None required.

## Approved scope for this slice

- `amendTrailChange` + `amendTrailSummary({ qtyChanged, removedCount, addedCount })`.
- No family qty on Timeline or default chat body.
- No `N designs` detail on new Updated rows; strip that detail on read.
- Heal `Updated — {qty}` → `Updated qty`.

## Explicitly deferred / rejected

- Skipping a trail row when only the ticket note changes.
- Per-line “which design” in Timeline.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units.
