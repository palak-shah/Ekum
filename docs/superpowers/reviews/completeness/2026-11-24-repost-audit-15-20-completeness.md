# Feature Completeness Review — Repost audit #15–#20 (+ feed new-design meta)

**Date:** 2026-11-24  
**Module / ask:** Ship audit rows #15–#20 from `2026-11-23-repost-bug-sheet-audit.md` plus drop Explore caption “N new designs” / “You added N”.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed (with intentional Redesign of album Repost entry + Explore staging vs traveling pile)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Inherit Who/rates/forward/download from source and never grant more (#15) is the trust ladder. Hiding source-chain in Selected (#16) prevents self/supplier loops. Album Repost (#17) matches cart/Explore entry. Blank How many (#19) stops false MOQ feel. Notify header/dup (#20) is trader trust. |
| UX Designer | One RepostSheet language everywhere. Explore leave clears Explore-only checks; traveling pile from album stays (#18). Caption drops activity meta — title + rates only. |
| Solution Architect | Seed create from pack preview/detail + API `allowForward` ceiling. Stamp `sourceChainCompanyIds` for Selected exclude. Origin-tag shortlist (`explore` vs `travel`). Stop `qtyEachMemory` seed. Coalesce I-handle `orderCreated` notifies; `pageOwnsTopChrome` for `/notifications`. |

---

## Platform consistency (required)

1. **Existing patterns?** Shared `RepostSheet`, `ConnectionPicker`, Selection dock / cart Repost, kit Sheet footer.  
2. **Duplicates?** No — album Repost reuses Explore/cart sheet.  
3. **Reuse?** Credit hop load for chain exclude; cart dock Repost for select bar.  
4. **Naming?** Repost / Selected / How many / Notifications.  
5. **Units?** N/A for this slice (no ₹/qty string format change; blank qty only).

**Philosophy conflict?** No — #17/#18 are intentional Redesigns of prior locks; documented below.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Inherit, exclude, album Repost, staging split, blank qty, notify |
| Business rules | OK | Ceilings; no new “reposted” supplier notify |
| Workflows | OK | Create seed; leave Explore; Place blank |
| Edge cases | OK | Mixed explore+travel pile; empty Selected after exclude |
| Permissions | OK | allowForward ≤ source; audience ceilings |
| User states | OK | Visitor album Trading + canCurate |
| Notifications | OK | Merge I-handle dups; no repost-created event |
| Error handling | OK | API refuse widen |
| Mobile / BM-07 | OK | Place footer clearance |
| First glance BM-11 | OK | No new-design meta line |
| Units | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Album Repost was Explore/cart-only

| Field | Content |
|-------|---------|
| Gap | `collections.md` visitor ⋯ = Message · Share · Bookmark only |
| Recommendation | Redesign — add Repost when Trading + curatable |
| Priority | Required (this slice) |

### G-002 — Explore clear wiped traveling pile

| Field | Content |
|-------|---------|
| Gap | `clearExploreStaging` → `clearSelection` shared store |
| Recommendation | Origin-tag; clear Explore-origin only |
| Priority | Required (this slice) |

### G-003 — Supplier “someone reposted” notify

| Field | Content |
|-------|---------|
| Gap | Sheet mentioned absence |
| Recommendation | Intentional absence — out of scope |
| Priority | Deferred |

---

## Approved scope for this slice

- Completeness + flip locks in explore / collections / orders.
- #15 Create inherit + API allowForward ceiling.
- #16 `sourceChainCompanyIds` + Selected exclude.
- #17 Visitor ⋯ + SelectionWorkspaceBar Repost → same RepostSheet.
- #18 Origin-tag shortlist/album pick; leave Explore clears Explore-origin only.
- #19 Drop qty memory seed/write on How many (+ OrderBuilder same rule); Sheet footer clearance.
- #20 Single Notifications header; coalesce I-handle order notifies for same recipient.
- Drop Explore caption new-design meta (keep count for ranking).

## Explicitly deferred / rejected

- New supplier “reposted your pack” notification.
- Explore New\|Existing choose.
- Copy sheet rows (#24–#40) except as touched by inherit UI.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
