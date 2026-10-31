# Feature Completeness Review — Order ticket chrome + hop-scoped Notes

**Date:** 2026-10-30  
**Module / ask:** Restyle shared order-ticket chrome (header subtitle, 48px party avatar, ship progress card, idle wait on the body) for buyer / supplier / trader. Add a hop-scoped **Notes** card (Add note + Voice · Photo) and trader-only **Forward** onto the other hop.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-10-21-order-ticket-heading-id-completeness`, `2026-10-30-orders-list-card-glance-completeness`, `2026-09-07-i-handle-no-upstream-names`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

This is a **visual Redesign of ticket chrome** plus a small persist for hop-scoped Notes. Kit line facts, mill cards, dock verbs, Direct/I-handle routing, and Personal note stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One ticket layout. Header = id · Buying/Selling · time · myNo. Wait copy is role words. Notes = both sides of **this hop**, not a three-way wall. Trader Forward is explicit (complaint Send-to-supplier judgment). Personal note never leaves ⋯. |
| UX Designer | PageHeader + 48px Avatar (same as list). Progress is a ticket card (`5 of 12 sets sent`, charcoal bar), not the list 3px edge and not teal. Idle wait on the party block so dock-none keeps nav. Notes: How many **Add note** + **+**. Forward only on the trader desk. |
| Solution Architect | Reuse ship totals + waiting helper. `POST /orders/:id/notes` appends trail `noted` + a chat system tag (do not rewrite the living card body). Forward copies onto the other hop as the trader shop; scrub mill/buyer names. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader, StatusPill, ⋯, Avatar 48, NoteAttachField, ClockIcon, FwdIcon, trail + living-thread tags.  
2. **Duplicates another feature?** No — Timeline stays status; chat stays 1:1 / trio; Notes is freeform on this ticket.  
3. **Should reuse an existing workflow?** Yes — `tradeListDispatchInPlay` / ship totals; chat Forward remains the everyday path.  
4. **Naming matches the app?** Buying / Selling; Waiting: supplier \| buyer; Notes (not “Notes & comments”); Forward (not “Forward order”). Parties stay `supplier` / `buyer`.  
5. **Units?** Whose = remaining ticket lines · which = **order** unit · surface = ticket progress (`5 of 12 sets sent`). Mixed units omit the noun.

**Philosophy conflict?** No if Notes stay hop-scoped and wait stays off the dock. Auto-fan-out to mill + buyer would fight soft-hide → would be Reject.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Chrome + Notes + trader Forward |
| Business rules | OK | Hop-scoped; Direct/trio no Forward |
| Workflows | OK | Add note; trader Forward to mill / parent |
| Edge cases | OK | Empty Notes; 0-width bar; mixed units; 2+ mills pick |
| Permissions | OK | Party on this order; Forward only I-handle trader |
| User states | OK | Buyer / seller / trader same chrome |
| Notifications | OK | Chat tag on add/forward |
| Error handling | OK | In-card InlineNotice / danger toast on page |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky; dock-none keeps nav (BM-07) |
| First glance (BM-11) | OK | Wait quiet; progress only when live; Add note + + idle |
| Units (order / dispatch / Rate per) | OK | Order unit on progress |
| Accessibility | OK | Wait + Forward have text, not icon-only |
| Platform consistency | OK | Kit chrome; Theme C |

---

## Gaps

### G-001 — Chat tag vs living card body

| Field | Content |
|-------|---------|
| Gap | `postOrderCard` rewrites the living card body. A note must not replace Place / Quote copy. |
| Why it matters | One living reference; later events are tags. |
| Recommendation | Trail `noted` + system lifecycle tag `{shop} added a note`. Do not change the living card title/body. |
| Priority | Required before implementation |

### G-002 — Party logos for both trader lines

| Field | Content |
|-------|---------|
| Gap | Detail payload has one `counterpart.logoUrl`. |
| Recommendation | Use that logo when `companyId` matches; else initials. No extra API this slice. |
| Priority | Later |

---

## Approved scope for this slice

- Header subtitle Buying/Selling · time · manual no.  
- 48px Avatar on party lines.  
- Progress card when dispatch is in play; extra warning when over-ship.  
- Idle wait on the party body (not dock). Skip mill-named wait on I-handle trader desk.  
- Notes card: place-time note moved here; Add note + Voice · Photo; `POST /orders/:id/notes`.  
- Trader-desk Forward onto the other hop as the trader.  
- Soft-hide: no mill names on buyer Notes.

## Explicitly deferred / rejected

- Design-row restyle; Received vs Dispatches; Extra accept/reject.  
- Trade through / Direct / autoDispatch / reveal UI.  
- Auto-copy notes to mill and buyer.  
- Notes in the trio group.  
- Chat in the action bar.  
- Wait in a sticky dock that hides nav.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
