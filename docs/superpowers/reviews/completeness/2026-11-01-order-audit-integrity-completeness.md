# Feature Completeness Review — OrderAudit integrity

**Date:** 2026-11-01  
**Module / ask:** Atomic qty+audit writes; buyer-amend removal rows; can’t-supply restore kind. No UI.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-01-ticket-live-qty-private-note-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Dispute log must match live qty. A failed audit must not leave a changed line. Dropped amend designs stay in the report. Restore is not “Can’t supply”. |
| UX Designer | No ticket, Notes, or report UI. Kinds are SQL labels. Timeline copy **Back on order** / **Removed N designs** stays. |
| Solution Architect | Same `OrderAudit` table. Qty mutation and insert in one Prisma transaction. New string kinds `amended_removed` and `restored`. Hop vs parent ownership unchanged. Send-up still rewrites hop `requestedQuantity`. |

---

## Platform consistency (required)

1. **Existing patterns?** Append-only `OrderAudit`; one line × one edit; snapshots; mill hops own their rows.  
2. **Duplicates another feature?** No — Timeline stays.  
3. **Should reuse an existing workflow?** Yes — `appendQty` + existing qty endpoints.  
4. **Naming matches the app?** **Buyer removed · {name} · {qty}**; **Back on order · before → after**; **Can’t supply** only when qty is capped.  
5. **Units?** Whose = the line on that order · which = **order** unit · surface = SQL row only. No ₹ string change.

**Philosophy conflict?** No. Integrity of the approved audit table; no extra chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Atomic write; removal row; restore kind |
| Business rules | OK | No fake live line on remove; requestedQuantity on seller edit still untouched; send-up hop requested unchanged |
| Workflows | OK | Place, amend, quote, confirm, seller edit, mill pass, can’t-supply, settle |
| Edge cases | OK | No-op skip; mill hop delete on amend; restore with same qty writes nothing |
| Permissions | N/A | Existing seller/buyer gates |
| User states | N/A | No UI |
| Notifications | N/A | Chat/trail stay outside the qty tx |
| Error handling | OK | Audit insert failure rolls back qty |
| Scalability | OK | Same append-only rows |
| Mobile interactions | N/A | No UI |
| First glance (BM-11) | N/A | No UI |
| Units (order / dispatch / Rate per) | N/A | No displayed ₹/qty string change |
| Accessibility | N/A | No UI |
| Platform consistency | OK | Kinds stay on OrderAudit; no OrderView |

---

## Gaps

### G-001 — Qty write without a shared transaction

| Field | Content |
|-------|---------|
| Gap | Item update commits, then audit insert can fail. |
| Why it matters | Report disagrees with the live ticket. |
| Impact if ignored | Disputes trust a missing row. |
| Recommendation | One `$transaction` for quantity mutation + `appendQty`. Pass `tx`; no nested transaction. |
| Priority | Required before implementation |

### G-002 — Amend drop has no row

| Field | Content |
|-------|---------|
| Gap | `deleteMany` / hop `delete` leaves no audit for the dropped design. |
| Why it matters | Later SQL cannot see what left the ticket. |
| Impact if ignored | Silent disappearance. |
| Recommendation | `amended_removed` snapshot on **that** order (parent vs hop). `qtyAfter` 0. No new `OrderItem`. |
| Priority | Required before implementation |

### G-003 — Restore labelled Can’t supply

| Field | Content |
|-------|---------|
| Gap | Restore qty uses kind `cant_supply`. |
| Why it matters | Report cannot tell cap-to-shipped from Back on order. |
| Impact if ignored | Wrong dispute story. |
| Recommendation | `cant_supply` on reduction; `restored` on restore. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Optional `tx` on `appendQty`; wrap every live qty write + insert.  
- `amended_removed` on parent amend and mill-hop unmapped delete.  
- `restored` vs `cant_supply` on `setLineSupply`.  
- API tests: rollback, removal, reduction vs restore, parent vs hop `orderId`.  
- Docs + domain kinds. Local `migrate status` only.

## Explicitly deferred / rejected

- UI, export API, ticket Changed disclosure, backfill.  
- Changing send-up `requestedQuantity`.  
- Wrapping chat/trail in the qty transaction.  
- Staging/production migrate deploy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (API units; no new UI journey)
