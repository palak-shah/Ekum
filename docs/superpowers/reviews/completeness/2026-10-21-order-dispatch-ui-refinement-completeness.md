# Feature Completeness Review — Order and dispatch UI refinement

**Date:** 2026-10-21  
**Module / ask:** Five-screen visual refinement (Edit · ticket · Confirm · Dispatch ticket · Dispatch sheet). Product rules: balance color language; remaining-0 lines on Dispatch unselected so extras can still ship.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, `2026-10-04-dispatch-overship` G-001, `2026-10-20-order-sheet-density` G-001  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Remaining-to-ship is the everyday job, not an error — drop amber wash on negative Balance. Over-ship is the only number that needs attention (amber `+N`). Fully shipped lines must stay visible on an open Dispatch sheet so a trader can add extras without a new order. Whole-ticket Dispatch after status `dispatched` stays off. |
| UX Designer | One wash helper. Neutral / pale-green / pale-green+amber. CheckIcon ticks stay (selected ≠ complete). 48px thumbs match How many so Qty · Price · Bill · Ship · Balance can sit without colliding. Transport stays in the sticky footer. |
| Solution Architect | No API / status-machine change. `fulfillDispatchItems` includes remaining 0; `defaultDispatchOn` ticks remaining > 0 only; `shipOn[id] === true`. Seed This LR `1` when they tick a complete line. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet / Button / `OrderLineFacts` / CheckIcon ticks / How many 48px thumbs.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Confirm / Dispatch sheets.  
4. **Naming matches the app?** Status pills stay Placed / Confirmed / Part-shipped / Dispatched — not ChatGPT “Not shipped”.

**Philosophy conflict?** No. Rejected ChatGPT extras: native checkboxes, Decline on fulfill dock, Confirm CTA with a count, transport in the scroll body, Dispatch dock after the ticket is `dispatched`.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tick remaining-0 to ship extra; payload still omits off lines |
| Business rules | OK | Over-ship unclamped; remaining floors at 0 |
| Workflows | OK | Dock still only while remaining or Restore |
| Edge cases | OK | Seed This LR 1 on tick of remaining 0 |
| Permissions | OK | Seller-only dispatch |
| User states | OK | Requested lines have no Ship/Balance wash |
| Notifications | N/A | |
| Error handling | OK | Confirm dispatch still needs ≥1 ticked qty |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky transport footer; 48px thumbs free fact-strip width |
| First glance (BM-11) | OK | Tick = selected; green = done; amber + = over |
| Accessibility | OK | aria-pressed on ticks; color not the only cue (`+N`) |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Dispatch after the whole ticket is `dispatched`

| Field | Content |
|-------|---------|
| Gap | Dock still hidden when every line remaining is 0 and nothing to Restore. |
| Why it matters | Rare “forgot one more set after full dispatch”. |
| Impact if ignored | Same as over-ship G-001 remainder — amend/new order. |
| Recommendation | Defer — this slice is line-level extras on an open fulfill ticket. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Balance wash: open = none + ink; done = pale-green + ink 0; over = pale-green + amber `+N`.  
- Dispatch lists confirmed/dispatched including remaining 0; default on only remaining > 0; tick remaining 0 seeds This LR 1.  
- Ticket / Confirm / Dispatch thumbs 48px.  
- Tighter five-column fact strip. Compact sticky transport footer.  
- Docs + units; trader-eye.

## Explicitly deferred / rejected

- Native checkboxes; Confirm “N lines” CTA; fulfill-dock Decline; status “Not shipped”.  
- Dispatch dock after ticket `dispatched` (G-001).  
- API / lifecycle / Send quote rate-required / Settle.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + existing fulfillment journey.
