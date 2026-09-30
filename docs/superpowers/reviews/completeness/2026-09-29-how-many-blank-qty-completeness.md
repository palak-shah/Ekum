# Feature Completeness Review — How many each · blank qty until remembered

**Date:** 2026-09-29  
**Module / ask:** Same for all / line pieces show **20** before the trader types. They want **blank the first time**, else the **last number they entered**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Prefilled **20** (How many) and **100** (order builder) guess for the trader. First order from a shop should wait for their count. After they have typed once, that shop should open with that count — not a platform default. |
| UX Designer | Empty stepper + idle chip **Same for all** (no · N). After a remembered or applied count: **Same for all · N**. Place / Ask / Order for buyer off until every line has pieces ≥ 1. Share stays (qty unused). Quote **Same for all** is already blank ₹ — leave rates alone. |
| Solution Architect | Keep `ekum:qty-each:{sellerId}` (or `multi`). Read returns `null` when missing. Persist the last committed pieces (Same for all Apply, line commit, Place / Ask). Same helper on How many each and order builder so the two place paths do not fight. |

---

## Platform consistency (required)

1. **Existing patterns?** Piece stepper, Same for all chip, per-shop qty memory — keep those; drop the fake default.  
2. **Duplicates another feature?** No. Quote Same for all is **rate**, already blank until Apply.  
3. **Should reuse an existing workflow?** Yes — same memory key on How many each and order builder.  
4. **Naming matches the app?** Same for all; pieces; Place Order.

**Philosophy conflict?** No. Busy traders should not unlearn a guess; they should type their usual pieces once.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Blank first; remembered later; CTAs gated on qty. |
| Business rules | OK | Pieces ≥ 1 on every line before Place / Ask / Order for buyer. Share unchanged. |
| Workflows | OK | Open sheet → type or Same for all Apply → Place. Reopen same shop → last N. |
| Edge cases | OK | Clear field stays empty (no snap to 20). + from empty → step 10. Multi-shop key `multi`. |
| Permissions | N/A | |
| User states | OK | First shop vs returning shop. |
| Notifications | N/A | |
| Error handling | OK | Disabled CTAs; no 0-piece POST. |
| Scalability | N/A | localStorage only. |
| Mobile interactions | OK | Sticky footer; empty boxes still clear last line (BM-07 unchanged). |
| Accessibility | OK | aria Pieces; empty textbox. |
| Platform consistency | OK | Builder uses the same memory, not 100. |

---

## Gaps

### G-001 — Pack-size (sets) vs piece count

| Field | Content |
|-------|---------|
| Gap | Qty is still pieces, not sets. |
| Why it matters | Separate locked model. |
| Impact if ignored | None for this slice. |
| Recommendation | Stay deferred (`2026-09-23-order-pack-size`). |
| Priority | Future improvement |

---

## Approved scope for this slice

- How many each: first open (no memory) → blank Same for all + blank line steppers. Memory hit → last pieces on chip and lines.  
- Place Order / Ask rates / Order for buyer disabled until every remaining line has pieces ≥ 1. Share stays.  
- Persist last pieces per shop on Apply, line commit, Place, Ask (`ekum:qty-each:v2` — ignores old v1 keys that stored the platform default 20).  
- **Same for all** editor always opens blank (like quote ₹); chip may still show · N after Apply.  
- Order builder standard (and photo bulk seed): same blank / remembered rule — no hardcoded 100.

## Explicitly deferred / rejected

- Pack-size conversion.  
- Changing quote Same for all (₹).  
- Tiny 10/15/20 chips as the primary qty UI.

## Sign-off

Required gaps closed: Yes  
Ready to implement: Yes
