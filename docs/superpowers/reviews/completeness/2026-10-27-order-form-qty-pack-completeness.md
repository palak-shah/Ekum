# Feature Completeness Review — Order form PDF, line qty, pack cue, drop Send quote, Bill/bale

**Date:** 2026-10-27  
**Module / ask:** (1) Order form PDF on every ticket (⋯, buyer and supplier). (2) After lock, line expand edits **Ordered** qty + Can’t supply — not Last LR. (3) `+No pcs in a set` only under a billed Total when some pack lines have size and some do not. (4) Remove **Send quote** button; Confirm is the lock. (5) Dispatch bill placeholder **Bill/bale number**, equal columns.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-10-05-order-line-edit-dispatch-pdf`, `2026-10-08-confirm-primary-quote-secondary`, `2026-10-21-ticket-total-missing-rates`, `2026-10-21-dispatch-lr-scroll-editor`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders WhatsApp the ticket, not only a packing list. After lock they change remaining qty without touching an old LR. “No pcs in a set” must not shout when nobody gave pcs and there is no ₹. Send quote is a second path — Confirm already locks with optional rate. Bill placeholder wrapping is a scan miss. |
| UX Designer | Order form in ⋯ (everyday send, Complaint last). Packing list stays on the shipment card. Line expand: Can’t supply + Ordered box; Last LR stays Dispatch Edit. Cue only under billed ₹. Dock: Decline · Confirm. LR \| Bill/bale same `grid-cols-2` as Transporter \| Parcels. |
| Solution Architect | Client-side PDF (reuse packing-list writer). New `POST /orders/:id/lines/quantity` (floor shipped; raise reopens `part_shipped`). Quote API unused from UI; leftover Accept quote stays. Pack cue + mill-bill in `ticketTotalSummary`. |

---

## Platform consistency (required)

1. **Existing patterns?** ⋯ `MoreActionsSheet`, packing-list Open/Share sheet, Can’t supply switch, compact qty box, Confirm dock, ticket mill-bill, Dispatch two-column fields.  
2. **Duplicates another feature?** Order form ≠ packing list (ticket vs this LR). Qty edit ≠ Settle (new agreement vs close leftover).  
3. **Should reuse an existing workflow?** PDF writer, `setLineSupply` status rollup, Confirm sheet, OS Share.  
4. **Naming matches the app?** Order form PDF · Can’t supply · Ordered · Bill/bale number · Confirm. No Seller/Buyer on chat cards.  
5. **Units?** Order form qty = **order unit** per design; ₹ = **Rate per**; Total = ticket mill-bill (`ticketTotalSummary`). Pack on Explore unchanged.

**Philosophy conflict?** No — dropping Send quote is an intentional second-path cut (fewer taps). Seller qty change is the same one-sided fulfill model as Can’t supply / over-ship; chat pulses.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Five slices as approved |
| Business rules | OK | Qty floor shipped; 0 = Can’t supply switch; dispatched raise → part_shipped |
| Workflows | OK | Confirm-only requested dock; mill Send unchanged |
| Edge cases | OK | All-blank pack no cue; mixed + billed ₹ cues; leftover Accept quote |
| Permissions | OK | PDF anyone who can GET; qty seller after lock |
| User states | OK | Requested → Confirm; fulfill expand; settled read-only qty |
| Notifications | OK | Living chat + Timeline `Updated qty` |
| Error handling | OK | In-card / toast; below-shipped helper |
| Scalability | OK | Same 22-row PDF cap |
| Mobile interactions | OK | ⋯ sheet + dock BM-07 unchanged; Bill/bale one line |
| First glance (BM-11) | OK | Confirm is the one requested job; cue quiet when no bill |
| Units (order / dispatch / Rate per) | OK | Form = order unit + Rate per; packing list still this-LR order unit |
| Accessibility | OK | Labels on qty, PDF, Bill/bale |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Multi-page order form

| Field | Content |
|-------|---------|
| Gap | Packing list and order form stay single A4, max 22 rows. |
| Why it matters | Long tickets clip. |
| Impact if ignored | Same as packing list today. |
| Recommendation | Defer multi-page. |
| Priority | Future improvement |

### G-002 — GST / letterhead on PDF

| Field | Content |
|-------|---------|
| Gap | Billing firms unused (FG-014). |
| Why it matters | Accounts may want GST. |
| Impact if ignored | Form is a trade ticket, not an invoice. |
| Recommendation | Defer. |
| Priority | Future improvement |

### G-003 — Quote API still exists

| Field | Content |
|-------|---------|
| Gap | `POST /orders/:id/quote` unused from UI; leftover Rate cards still Accept. |
| Why it matters | Dead path vs leftover tickets. |
| Impact if ignored | Harmless; buyer Accept still works on old quotes. |
| Recommendation | Do not delete this slice. |
| Priority | Future improvement |

### G-004 — Header PDF icon

| Field | Content |
|-------|---------|
| Gap | User chose ⋯, not a header icon. |
| Why it matters | Extra tap vs packing-list icon language. |
| Impact if ignored | Form is still reachable. |
| Recommendation | Defer header icon. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Order form PDF in ticket ⋯ (both parties, all statuses they can open); packing list on shipments unchanged.  
- Seller line expand: Ordered qty + Can’t supply; no Last LR. `POST /orders/:id/lines/quantity`.  
- `+No pcs in a set` only when billed ₹ exists **and** some pack lines have size and some do not. Mixed family bills billable lines; qty unconverted. **+Missing rates** the same: only under a billed ₹; all-blank rates = no cue.  
- Remove Send quote button, sheet, Needs-you/list copy. Confirm-only requested dock (rate optional). Leftover Accept quote stays.  
- Dispatch placeholder **Bill/bale number**; equal `grid-cols-2`.  
- Docs + units + `@orders` functional + trader-eye.

## Explicitly deferred / rejected

- Multi-page PDF; GST/letterhead; auto-attach PDF to chat; header PDF icon; deleting the quote API.  
- Native checkboxes / new dock chrome.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
