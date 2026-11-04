# Feature Completeness Review — Slice D amend rematch (G-008)

**Date:** 2026-11-03  
**Module / ask:** Stable parent `OrderItem` identity during buyer amend so mill / You hop `sourceItemId` mappings never rematch by productId/name after delete/recreate.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-02-trader-ihandle-completeness` G-008  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buyer edit before seller responds must not scramble which hop line maps to which parent line when the same design appears twice. Held mills stay Waiting; removing a design still drops that held-hop line. |
| UX Designer | Amend sheet must key qty / remove / note by line id so two same-SKU rows can differ. No new chrome language. |
| Solution Architect | Stop parent `deleteMany` + recreate. Update retained ids in place; delete only removed; create only new. Prefer hop `sourceItemId`; `claimParentItemId` only for genuine orphans. Wire `orderItemId` on amend DTO (not a Prisma migration). One DB transaction for parent + hop writes + audits. No legacy You-hop backfill. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Manage parent + hop `sourceItemId`; amend window unchanged.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `passBuyerAmendToMills` family; spawn held mill hop when amend adds a new mill owner.  
4. **Naming matches the app?** Trader-facing errors stay plain (“That design isn’t on this ticket.”).  
5. **Units?** N/A — no ₹ / Rate per string change.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Update-in-place + hop prefer-sourceItemId |
| Business rules | OK | Held remove-only for deletes; no release; no You backfill |
| Workflows | OK | Mill + You + ordinary 1:1 / Direct amend |
| Edge cases | OK | Duplicate SKU; foreign/duplicate ids; missing hop |
| Permissions | OK | buyerCanAmend unchanged |
| User states | OK | Amend window preserved |
| Notifications | OK | Existing amend card/trail only |
| Error handling | OK | Reject bad orderItemId; reject new You line without You hop |
| Scalability | OK | Same hop loop |
| Mobile interactions | OK | Sheet keys by item id; How many peers via catalogPeerOrderItemIds |
| First glance (BM-11) | OK | Same amend sheet job |
| Units | N/A | |
| Accessibility | OK | Existing steppers |
| Platform consistency | OK | |

---

## Current behaviour and failure mechanism

1. `amend` writes `items: { deleteMany: {}, create: snapshots }` → all new parent ids.  
2. Hop `sourceItemId` `onDelete: SetNull`.  
3. `passBuyerAmendToMills` first-claims by productId/name → duplicate SKUs can swap; rematch looks “correct” afterward.  
4. Amend UI / `oldByProduct` collapse duplicates by productId.  
5. `OrderShipmentItem` Cascades with parent item delete (latent if amend window widens).  
6. `OrderAudit.orderItemId` is not an FK — recreate leaves stale ids.

## Data relationships

- Parent `OrderItem.id` ← hop `OrderItem.sourceItemId` (SetNull on delete).  
- Parent / hop `OrderShipmentItem.orderItemId` → Cascade on item delete.  
- Qty audit stores `orderItemId` as plain string.

## Smallest safe solution

| Line fate | Parent | Hop (open / Waiting) | Hop (Hold after Send) |
|-----------|--------|----------------------|------------------------|
| Retained (`orderItemId`) | Update same id | Prefer `sourceItemId`; sync qty | Keep mapping; sync qty only |
| Removed | Delete that id | Delete mapped hop line | Delete mapped hop line; do not release |
| New (no `orderItemId`) | Create | Create on correct owner hop only — never productId rematch onto an existing hop line | Do not add lines on held hops |
| New mill, no hop | Create parent line | Spawn **new held** mill hop with that line (intentional) | — |
| New trader-owned, no You hop | — | **Reject** amend (no legacy You backfill) | — |

API: reject foreign, duplicate, and non-live `orderItemId` before writes. Parent + hop mutations + audits in one transaction. `claimParentItemId` only when hop `sourceItemId` is null/orphan.

**Migration / repair:** none.

---

## Gaps

### G-001 — Parent amend deletes and recreates lines (G-008)

| Field | Content |
|-------|---------|
| Gap | deleteMany + create nulls hop `sourceItemId`; rematch swaps duplicate SKUs; sheet keys by productId. |
| Why it matters | Wrong qty/remove/audit on hop; fulfilment history can attach to the wrong parent line. |
| Impact if ignored | Invisible cross-map on packs with two of the same design. |
| Recommendation | Update-in-place + amend `orderItemId` + prefer-sourceItemId hop pass; held delete sync; reject You add without You hop. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness (this doc).  
- Domain: optional `orderItemId` on amend items.  
- Web: AmendOrderSheet / OrderDetailPage key by item id.  
- API: in-place amend; validation; transactional hop sync (incl. held mapped deletes).  
- Tests: unit / API / functional per plan + held / missing-hop / validation regressions.  
- Lock `orders.md` + gap matrix **after** tests pass.

## Explicitly deferred / rejected

- Prisma schema / migration — **Rejected**.  
- Historical audit repair / legacy You backfill — **Rejected**.  
- G-005 / G-006 shipment work — **Deferred** (already shipped Slice C).  
- Direct / ordinary 1:1 chrome redesign — **Rejected**.  
- Deploy — **Rejected**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
