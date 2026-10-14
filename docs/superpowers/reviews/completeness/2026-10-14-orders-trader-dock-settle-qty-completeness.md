# Feature Completeness Review — Trader dock (no quote) + settle qty + bill chrome

**Date:** 2026-10-14  
**Module / ask:** I-handle trader parent: drop **Send quote** (no **Confirm** either) — everyday job is mill **Send** / **Send all**. Remove **Trading with …** subtitle. Fix QTY · PRICE · BILL clipping. Settle sheet: editable final qty ≤ shipped (one Settle still closes).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, settle design `2026-09-06-settle-order-and-order-trail-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Negotiation is not an Orders-page job on the I-handle parent. Trader is buyer on mill hops — does not Confirm to mills. Parent Confirm stays off. Send quote off the parent dock. Mill Confirm + pass-through firms the buyer ticket. Settle must let the seller set final qty (≤ shipped), not only close at shipped. |
| UX Designer | Dock: **Decline · Send all** (when ≥2 held). Mill card **Send** stays the loud everyday verb. After Send: cue waiting on mill — not Send quote. No **Trading with** under the title (counterpart already in the header). Bill amounts must not clip (`₹4…`). Settle Final inputs match Dispatch This LR chrome. |
| Solution Architect | UI: `showSendQuoteOnDeskFace` false when mill desks; keep `showSellerConfirmOnDesk` false with mill desks. Settle API: optional `items[]` on `settleOrderSchema`; omit = today’s qty := shipped. Bilateral Send quote / Confirm unchanged this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — sticky dock, mill-card Send, Dispatch qty inputs, OrderLineFacts strip, Confirm sheet (bilateral only).  
2. **Duplicates another feature?** No — removes quote negotiation from parent; does not invent a second lock path.  
3. **Should reuse an existing workflow?** Yes — mill Send + mill Confirm + pass-through; Dispatch-like Final on Settle.  
4. **Naming matches the app?** Send / Send all / Decline / Settle / Final — no Seller/Buyer on chat body.

**Philosophy conflict?** No — fewer taps; one job per screen; quote soft-offer stays on bilateral/mill tickets only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide parent Send quote; settle items[]; bill flex |
| Business rules | OK | Confirm still off on parent; final qty ≤ shipped |
| Workflows | OK | Send → mill Confirm → pass-through |
| Edge cases | OK | After Send, dock may be none; cue waiting |
| Permissions | N/A | |
| User states | OK | Needs you / Your move without Send quote |
| Notifications | OK | Unchanged mill Send / Confirm chat |
| Error handling | OK | Reject settle qty > shipped |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 bill + settle sheet clearance |
| First glance (BM-11) | OK | Send / Send all loudest on parent |
| Accessibility | OK | Same controls |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Docs still say parent Send quote / Needs you · Send quote

| Field | Content |
|-------|---------|
| Gap | `orders.md` I-handle dock and list cues still describe Send quote on parent. |
| Why it matters | Spec drift vs product. |
| Impact if ignored | Tests and copy fight the dock. |
| Recommendation | Update orders.md + gap matrix in this slice. |
| Priority | Required before implementation |

### G-002 — Settle final qty never built

| Field | Content |
|-------|---------|
| Gap | Design allowed final qty ≤ shipped; API/UI always qty := shipped. |
| Why it matters | Traders need Dispatch-like control when closing mismatch. |
| Impact if ignored | Settle-only-entirely complaint. |
| Recommendation | `items[]` + Final inputs. |
| Priority | Required before implementation |

### G-003 — Bill truncate on compact facts

| Field | Content |
|-------|---------|
| Gap | Equal flex + truncate clips `₹4,250` → `₹4…`. |
| Recommendation | Drop value truncate; give Bill more flex. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- I-handle parent: hide Send quote; Confirm stays off; Send / Send all / Decline unchanged.  
- Cues: no “Send quote to …”; waiting on mill after Send.  
- Can’t-supply on trader parent must not open Send quote.  
- Remove Trading-with subtitle on manage selling detail.  
- OrderLineFacts compact Bill readable.  
- Settle optional `items[]` + editable Final UI.

## Explicitly deferred / rejected

- Parent Confirm while mills exist (rejected — trader is buyer on mill hop; Confirm wrong there).  
- Remove Send quote from bilateral / mill seller tickets (out of scope).  
- Auto-Send mills when parent firms (not needed — no parent Confirm).  
- Partial settle that leaves order `part_shipped` (deferred — one Settle still closes).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
