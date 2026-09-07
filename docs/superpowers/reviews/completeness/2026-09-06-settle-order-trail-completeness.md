# Feature Completeness Review — Settle order + order audit trail

**Date:** 2026-09-06  
**Module / ask:** Seller Settle (qty = shipped, close ticket); full dispatch completes; separate order trail for Timeline  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-06-settle-order-and-order-trail-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Closing on what actually left matches trader reality; seller-owned Settle avoids waiting on buyer Mark delivered. Full ship auto-complete is consistent. |
| UX Designer | Part shipped → two clear next actions (Dispatch more / Settle). Timeline must show Settled with who/date; chat living card update + notify. |
| Solution Architect | Append-only `OrderTrailEvent` is the right source for Timeline; keep living chat card. Qty rewrite on settle must preserve `requestedQuantity`. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheets, living order card, trail on order detail — yes.  
2. **Duplicates another feature?** Replaces Mark delivered as happy path; does not duplicate cancel.  
3. **Should reuse an existing workflow?** Reuse dispatch sheets + living card upsert/announce.  
4. **Naming matches the app?** Settle order / Settled / Part shipped — plain language; no Seller/Buyer on card body.

**Philosophy conflict?** No.

---

## Checklist gaps

| Area | Notes |
|------|--------|
| Functionality | Settle sheet; full dispatch → settled; trail backfill |
| Business rules | Seller only; qty = shipped; no further dispatch after settled |
| Workflows | Part ship fork; complete path without buyer deliver |
| Edge cases | Settle with zero shipped line; multi-shipment; legacy delivered |
| Permissions | Seller party only |
| User states | List filters / attention treat settled as completed |
| Notifications | Buyer notified on settle and full-complete |
| Errors | Wrong actor / already settled → toast or in-sheet |
| Mobile / chrome | Settle sheet BM-07 |
| Accessibility | Sheet focus / primary CTA |

**Required gaps before build:** none blocking Proceed — open points in design (returns window field, legacy alias) resolved in plan.

---

## Disposition rationale

Fits Ekum: one clear close action for the shipper, honest quantities, timeline as audit. Proceed with approved spec scope only.
