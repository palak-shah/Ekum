# Feature Completeness Review — 1:1 ticket Designs / party / Chat polish

**Date:** 2026-11-02  
**Module / ask:** Match Selling + Buying **1:1** order detail to the client HTML prototype: no Order in Sets/Mtrs group titles on the ticket, Designs caption on the right of the heading, party = avatar + ink shop name + role under, Chat square first on the dock.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-01-buying-order-detail-completeness`, `2026-11-01-selling-order-detail-completeness`, client `Ekum Order Page Prototype (Copy).html`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Visual-only on `oneToOneTicket`. No API, lifecycle, or `orderActionDock` verb change. Direct / I-handle keep today’s group headings, `supplier · shop` party, and party chat icon.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ticket Designs is one list. Qty/rate already sit on the line. Caption (`Order in Sets · rate per mtr`) is quiet, on the right. Party is the shop, then Supplier/Buyer. Chat stays one path: dock, left. |
| UX Designer | Prototype `h4` + `<small>`; party `.nm` / `.rl`; dock `.btn.sec` 46px first. Drop `Order in Sets` / `Order in Mtrs` section titles on 1:1 even when mixed. Name is ink, not a teal chip. |
| Solution Architect | `hideHeadings` on `OrderUnitGroups` for 1:1 parent Designs only. Mill desks / How many / Confirm / Dispatch unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Designs heading row matches Notes / Dispatches (`flex justify-between`). Chat square is `listSquareButtonClass`. Avatar 48.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `ticketDesignsCaption`; existing dock Chat.  
4. **Naming matches the app?** Supplier / Buyer; Designs; Chat.  
5. **Units?** Caption and line qty/rate copy unchanged. Whose = ticket lines · which = order unit on the line + Rate per on the line · surface = Designs card. No ₹ string change.

**Philosophy conflict?** No. Progress still **sent**; ships **Dispatches**; wait **Waiting: supplier**. Prototype Received / Accept extra stay Reject.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Caption placement + hide group titles + party ink + Chat left |
| Business rules | OK | |
| Workflows | OK | Chat still opens the existing thread |
| Edge cases | OK | Mixed units: one list, caption omits mismatched bits; no threadId hides Chat |
| Permissions | OK | |
| User states | OK | Gate remains `oneToOneTicket` |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Dock Chat `shrink-0` first; BM-07 clearance unchanged |
| First glance (BM-11) | OK | Shop name loudest after header; unit not a second title |
| Units (order / dispatch / Rate per) | OK | No ₹ / qty string change |
| Accessibility | OK | Chat `aria-label="Chat"`; name still a profile link |
| Platform consistency | OK | 1:1 only; sheets keep Order in Sets |

---

## Gaps

### G-001 — Do not strip How many / mill-desk unit headings

| Field | Content |
|-------|---------|
| Gap | `OrderUnitGroupedList` is shared with mill desks and already used with `hideHeadingWhenSingle` on Direct/I-handle tickets. |
| Why it matters | Mixed How many / Confirm / mill cards still need **Order in Sets** / **Order in Mtrs**. |
| Recommendation | `hideHeadings` only on 1:1 parent Designs (and the can’t-supply fold inside that card). |
| Priority | Required before implementation |

### G-002 — Party name stays a profile link

| Field | Content |
|-------|---------|
| Gap | Prototype `.nm` is not a teal link. Product still links other shops to `/company/:id`. |
| Recommendation | Keep the link; paint it ink (`font-emphasis text-ink`), not `text-accent`. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- 1:1 Designs: caption on the right of **Designs**; no `Order in Sets` / `Order in Mtrs` titles (including mixed).  
- 1:1 party: 48px Avatar, ink shop name, muted Supplier/Buyer under; no party Chat.  
- Dock: Chat square first, left; verbs/wait to the right; complete **Chat with {name}**.  
- Selling and Buying 1:1 share this. Direct / I-handle unchanged.

## Explicitly deferred / rejected

- Progress verb **received**; ships heading **Received**; **Accept extra**.  
- Shop-named wait (`Waiting for {shop} to send`).  
- Strip unit group titles from How many / Confirm / Dispatch / mill desks.  
- Remap status pills to Part received / Completed.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
