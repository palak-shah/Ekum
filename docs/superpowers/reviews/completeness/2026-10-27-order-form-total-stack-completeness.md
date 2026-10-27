# Feature Completeness Review — Order form PDF Total stack

**Date:** 2026-10-27  
**Module / ask:** Order form PDF Total sits too far left, wraps `100 pcs` / `All` under the word Total, and can print `All ₹…` while a unit family has no ₹ (looks like the whole ticket). Stack like the ticket: 40 sets ₹ · 100 pcs ₹ · All ₹, and name a missing price.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-ticket-unit-bill-totals-completeness`, `2026-10-21-ticket-total-missing-rates-completeness`, `2026-10-27-order-form-qty-pack-completeness`  
**Disposition:** Proceed (small Redesign of “all-blank pack, no cue” when another family is billed)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | All ₹ is billed cloth, not “everything on the form.” If 40 sets have no ₹, traders must see why — not a quiet All that matches only the pcs. |
| UX Designer | Same mill-bill as the ticket: **Total** once (nothing under that word), qty then ₹ per family, then **All**, then **+Missing rates** / **+No pcs in a set**. PDF Total starts at the Qty column, ₹ under Bill — not the page gutter. |
| Solution Architect | Reuse `ticketTotalSummary`. PDF draws label / qty / money on the table columns. Widen pack cue: uncounted pack lines + any billed ₹ (mixed units with all-blank pack still cue). Sets-only all-blank pack with no ₹ stays quiet. |

---

## Platform consistency (required)

1. **Existing patterns?** Ticket `OrderUnitTotal` (Total · qty · ₹ · All · +cue).  
2. **Duplicates another feature?** No — same mill-bill, print surface.  
3. **Should reuse an existing workflow?** `ticketTotalSummary` / `ticketTotalMissingCue`.  
4. **Naming matches the app?** Total · All · Missing rates · No pcs in a set.  
5. **Units?** Whose = **design**. Which = **order** qty, **Rate per** ₹. Surface = order form PDF (+ ticket cue). Pack Explore unchanged.

**Philosophy conflict?** Partial — “all-blank pack, no cue” hid a missing family ₹ next to a billed All. **Redesign:** cue when pack lines cannot bill and something else is billed. Sets-only with no ₹ stays silent.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Stack + cue |
| Business rules | OK | No invented ₹; All is billed sum |
| Workflows | OK | Same ⋯ Open PDF |
| Edge cases | OK | Can’t-supply out of Total; one family no All |
| Permissions | N/A | Same as form |
| User states | OK | Inquiry title unchanged |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | 22-row cap |
| Mobile interactions | N/A | PDF |
| First glance (BM-11) | OK | Total caption quieter than the stack |
| Units (order / dispatch / Rate per) | OK | Order unit qty · Rate per ₹ |
| Accessibility | OK | Cue is text |
| Platform consistency | OK | Ticket + PDF share summary |

---

## Gaps

### G-001 — PDF Total at page gutter

| Field | Content |
|-------|---------|
| Gap | Totals draw at `margin`; with photos Qty starts 44pt in. `100 pcs` / `All` sit under **Total**. |
| Why it matters | Reads as a broken title, not one mill-bill. |
| Impact if ignored | Traders screenshot “this looks broken.” |
| Recommendation | Ticket columns: Total on first row only; qty under Design; ₹ under Bill. |
| Priority | Required before implementation |

### G-002 — All ₹ with a blank family

| Field | Content |
|-------|---------|
| Gap | 40 sets (rate /pc, no pack) + billed pcs → All = pcs ₹, no +cue (all-blank pack rule). |
| Why it matters | Looks like the whole order is billed. |
| Impact if ignored | Accounts WhatsApp a short total. |
| Recommendation | +No pcs in a set / +Missing rates when a remaining pack/rate skip exists and any ₹ is billed. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Order form Total matches ticket stack: **Total** once; per-family qty + ₹ (blank if none); **All** when mixed; **+cue** when billed ₹ exists and some remaining lines are uncounted.  
- PDF x: Total at Qty column; later rows skip that column; money at Bill column.  
- Pack cue whenever uncounted pack lines exist under a billed Total (not only mixed pack size). Sets-only all-blank pack with no ₹ stays quiet.  
- Docs + units.

## Explicitly deferred / rejected

- Multi-page PDF; GST; inventing ₹ for blank pack; changing How many footer.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
