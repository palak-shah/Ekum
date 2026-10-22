# Feature Completeness Review — Confirm cue + ticket Total

**Date:** 2026-10-21  
**Module / ask:** Confirm sheet **Asked · Quoted · ₹** per design? Ticket line Bill right-align vs Total `sets = pcs` on its own line.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-ticket-qty-number-completeness`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Confirm’s job is tick + Qty \| Rate. **Asked 12 · Quoted 12 · ₹120** restates the boxes. Send quote still needs Asked vs offer. Ticket scan: one ₹ at Total right; line Bill stays a column under **Bill**, not a second right-edge. |
| UX Designer | Drop the Confirm reference cue (keep **Declined** / leftover). Do **not** right-align line Bill — Qty · Price · Bill are one labeled strip. Total: **Total** · `12 sets` / `20 mtrs` · ₹. Skip `= N pcs` on the ticket (How many footer still converts). |
| Solution Architect | Confirm stops calling `quoteSheetReferenceCue`. Ticket `howManyOrderFooterSummary(..., { packConversion: false })`. Line Bill drops `text-right`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Send quote keeps Asked; How many footer keeps `sets = pcs`; ticket Qty is a number.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Confirm / Total.  
4. **Naming matches the app?** Total; sets / mtrs.

**Philosophy conflict?** No — quieter Confirm, one rupee scan on Total.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Confirm still writes qty + rate from the boxes |
| Business rules | OK | Pack bill formula unchanged |
| Workflows | OK | Send quote cue unchanged |
| Edge cases | OK | Mixed Total stacks `2 sets` and `70 mtrs`; pack size 1 no longer `12 sets = 12 pcs` |
| Permissions | N/A | |
| User states | OK | Declined still says Declined |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Less wrap on Total (BM-07) |
| First glance (BM-11) | OK | Name + boxes on Confirm; Total ₹ at right on the ticket |
| Accessibility | OK | Qty / Rate aria-labels stay |
| Platform consistency | OK | How many conversion unchanged |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Confirm: no Asked / Quoted cue on ticked lines. Declined / leftover stay.  
- Ticket line Bill: left under **Bill**, same as Qty / Price.  
- Ticket Total: order-unit nouns only (`12 sets`, `20 mtrs`); ₹ stays right. How many / Edit footer still `sets = pcs`.  
- Docs + units.

## Explicitly deferred / rejected

- Right-aligning every line Bill to match Total ₹.  
- Dropping Send quote Asked cue.  
- Changing How many conversion footer.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; e2e Asked assert on Confirm drops.
