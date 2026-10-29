# Feature Completeness Review — Auto-repost future-only + Supplier copy

**Date:** 2026-10-28  
**Module / ask:** Direct Link create must not backfill older supplier packs. Auto-repost starts for posts **after** the link exists. Direct Links UI says **Supplier**, not Mill.  
**Anchors:** `docs/features/explore.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`, `docs/superpowers/reviews/completeness/2026-10-28-auto-repost-selected-buyer-completeness.md`  
**Disposition:** Redesign of create-time mill-pack delivery, then **Proceed** for this slice

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-auto-repost-selected-buyer-completeness.md`. This review **redesigns** “new Direct Link delivers the mill’s live packs.” Selected audience, reuse, `From {shop}` stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Creating a Direct Link is for **next** orders and **next** supplier posts. Old albums stay where they are. Trader language on this screen is **Supplier** × Buyer — mill is an orders-desk word, not the picker. |
| UX Designer | Sheet field **Supplier**. Intro and empty state match. Locked rows: Direct supplier orders; Supplier, buyer, and you share a group. Network hint matches. No new chrome. |
| Solution Architect | Drop `deliverMillPacks` on create. Keep buyer **union** on existing automatic Selected packs (same Collection id). New auto pack only when the source collection was **created after** this trader’s Direct Link for that supplier. Publish still enqueues `collection.propagate`. |

---

## Platform consistency (required)

1. **Existing patterns?** Direct Links sheet, Selected auto, mill credit `From {shop}`. Yes.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Publish → JobQueue propagate. Yes.  
4. **Naming matches the app?** Direct Links picker = Supplier (plain). Orders mill cards / These mills stay mill (desk hop).  
5. **Units?** N/A.

**Philosophy conflict?** Backfilling every live mill pack on Save overshares old catalog and failed Direct Link with a curate error. **Redesign** to future-only. Not silent drift.

---

## Locked examples

**Save Direct Link.** T1 × S1 × B1. S1 already has live POST-100. No new T1 pack. B1 still sees POST-100 from S1 if they follow S1.

**Then S1 publishes POST-200.** T1 auto pack Selected to B1, `From {S1}`.

**Second buyer.** T1 × S1 × B2 after POST-200 exists as automatic Selected → union B2 onto that pack. Do not mint a second card. Do not copy older S1 albums that never hopped.

**Draft started before the link, published after.** Collection `createdAt` before the link → no auto pack (treat as previous work). New albums after the link hop.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Future publish hops; create does not copy live albums |
| Business rules | OK | createdAt vs Direct Link createdAt; union stays |
| Workflows | OK | Save still mill ticket + group |
| Edge cases | OK | Delayed propagate of an old publish skips create |
| Permissions | OK | Unchanged hop Relist / discover |
| User states | OK | Supplier copy |
| Notifications | OK | No backfill notify |
| Error handling | OK | Save is not blocked by curate |
| Scalability | OK | No N-pack loop on create |
| Mobile interactions | OK | Same sheet |
| First glance (BM-11) | OK | Supplier is the mill field |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | Supplier on Direct Links; mill stays on order desk |

---

## Gaps

### G-001 — Create-time backfill

| Field | Content |
|-------|---------|
| Gap | New Direct Link ran propagate on every live mill pack. Save showed “not visible to you.” Old albums appeared as the trader’s posts. |
| Why it matters | Direct Link is next orders, not a bulk Repost. |
| Impact if ignored | Traders cannot save a path; buyers see old mill lots as trader posts. |
| Recommendation | Remove create-time delivery. Hop only collections created after the link. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + docs lock (explore Auto-repost row, tradelane audience sentence, orders shipped, gap matrix). Successor note on Selected-buyer completeness.  
- Remove `deliverMillPacks`. Skip new auto pack when source `createdAt` is before this trader×supplier Direct Link. Union stays.  
- Direct Links / Network copy: **Supplier**. API create errors match.  
- Tests: create does not propagate live packs; old collection does not hop; new collection after the link does; Playwright mill publish **after** the link.

## Explicitly deferred / rejected

- Renaming mill on order tickets / These mills / I-handle desk.  
- Mixed-cart How many.  
- Cross-publisher feed collapse.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
