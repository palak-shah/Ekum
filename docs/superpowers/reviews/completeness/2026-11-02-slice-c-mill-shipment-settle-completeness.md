# Feature Completeness Review — Slice C mill shipment roll-up / settle trim

**Date:** 2026-11-02  
**Module / ask:** Close G-005 (hop `editShipment` rebuilds mapped parent shipments) and G-006 (mill Settle trims excess parent shipment qty) for I-handle Manage parents, including mixed You Selling hops.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-02-trader-ihandle-completeness`, `2026-11-02-mixed-you-selling-hop-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buyer↔trader parent must show truth after mill pencil and mill Settle Final below prior shipped. You hop and other mills stay isolated. No new ticket hierarchy. |
| UX Designer | Soft-hide unchanged: parent Dispatches stay qty-only under trader name; no mill LR/legs/shop on parent. No new chrome. |
| Solution Architect | Reuse `downstreamOrderId` / `sourceItemId` / `shouldPassThrough`. Rebuild hop-attributable parent `OrderShipment` rows on edit (never re-call `passMillDispatchToParent`). Trim hop-attributable shipment items on settle sync. No schema / FK. Keep `parentHasPendingFulfilmentLines` + `allReleasedSubsetsComplete`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — same pass-through family as dispatch / lines / settle.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — hop operate → parent roll-up.  
4. **Naming matches the app?** Soft-hide trader name on parent cards.  
5. **Units?** N/A — qty only; no ₹ / Rate per string change.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Edit rebuild + settle trim |
| Business rules | OK | `sourceItemId` mapping; wholly hop-attributable filter |
| Workflows | OK | Mill + You; multi-mill |
| Edge cases | OK | Duplicate SKU; Final &lt; shipped; one path open |
| Permissions | OK | Seller-only edit/settle unchanged |
| User states | OK | Soft-hide; buyer never sees hop edit as mill shop |
| Notifications | OK | Buyer-safe parent card on edit pass |
| Error handling | OK | Skip unmapped lines (null match) |
| Scalability | OK | Per-hop shipment rewrite |
| Mobile interactions | N/A | API truth; no new sticky chrome |
| First glance (BM-11) | N/A | No UI chrome change this slice |
| Units | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-005 — Mill / You hop editShipment does not reach parent

| Field | Content |
|-------|---------|
| Gap | `dispatch` → `passMillDispatchToParent` creates parent LR. `editShipment` never rewrites it. |
| Why it matters | Parent progress / buyer card stay on first copy. |
| Impact if ignored | Stale `N of M sent` after mill pencil. |
| Recommendation | Rebuild wholly hop-attributable parent shipments from current hop shipments via `sourceItemId`. Never call `passMillDispatchToParent` on edit (would duplicate). |
| Priority | Required before implementation |

### G-006 — Settle Final below parent shipped (FG-007)

| Field | Content |
|-------|---------|
| Gap | `syncManageParentFromMillSettle` sets parent line qty := mill Final; does not trim parent shipment items. |
| Why it matters | Parent shows invented extra (shipped &gt; ordered). Extra does not trip pending guard. |
| Impact if ignored | Buyer sees lie after mill Settle. |
| Recommendation | Trim hop-attributable parent shipment items so shipped ≤ Final; leave other hops untouched. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + lock `orders.md` / gap matrix.  
- Helpers: hop-attributable shipment detect + rebuild/trim.  
- `passMillEditShipmentToParent` after hop `editShipment` when `shouldPassThrough`.  
- Trim in `syncManageParentFromMillSettle`.  
- Soft-hide parent edit card/trail.  
- API + functional matrix (one mill+You, two mills+You, settle isolation, edit reduce, duplicate SKU).  
- Regressions: mill-only, mixed You journey, Direct/trio smoke.

## Explicitly deferred / rejected

- G-008 amend rematch — **Deferred**.  
- Schema / `sourceShipmentId` — **Rejected** unless rewrite proves impossible (stop and explain).  
- Trim mill hop’s own shipment rows on settle — **Deferred** (parent-facing G-006 only).  
- Legacy mixed You-hop backfill — **Rejected**.  
- Parallel order hierarchy — **Rejected**.  
- Direct / ordinary 1:1 chrome — **Rejected**.  
- Deploy / migrate — **Rejected**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
