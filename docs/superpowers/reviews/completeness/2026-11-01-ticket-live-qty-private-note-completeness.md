# Feature Completeness Review — Ticket live qty, private note, Notes, OrderAudit

**Date:** 2026-11-01  
**Module / ask:** Prototype private-note card on every personal-note preview; seller qty edit is live ordered qty on selling fulfill tickets; dedicated `OrderAudit` table for qty disputes; hop Notes include sheet comments, You/them wash, newest 3.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `2026-11-01-selling-order-detail-completeness`, `2026-10-31-ticket-notes-timeline-path-icons-completeness`, `2026-10-27-confirm-sheet-manual-personal-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Ticket shows **live** agreed qty after seller edit (50→45 → 30 of 45 sent, Total 45). Buyer place and first confirm stay on the line. Disputes read a **separate** `OrderAudit` table later — not a second order, not Timeline JSON. Notes is where both sides read comments, including confirm/dispatch/settle sheet notes. |
| UX Designer | One private-note card (lock + **PRIVATE NOTE · ONLY YOU**, dashed foam) everywhere a preview exists; placement stays (Selling 1:1 after buyer; others above party). You = chat-out, them = foam. Newest 3 notes; **N more notes** chevron above. No report UI. |
| Solution Architect | `Order` stays the live ticket. `OrderAudit` is a child table (`orderId` FK), one **line × edit** row, named qty columns + snapshots. One write helper on every qty path. Timeline `OrderTrailEvent` unchanged for traders. Chat **Updated qty** stays. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Card / Sheet / NoteAttachField; dashed foam lock card already on Selling 1:1; DisclosureChevron; hop Notes composer; live `quantity` already the API contract for `POST /orders/:id/lines/quantity`.  
2. **Duplicates another feature?** No — Timeline stays; audit is SQL-only. Notes stay hop-scoped (not a trio wall).  
3. **Should reuse an existing workflow?** Yes — same qty endpoint, same personal-note sheet, same Notes composer.  
4. **Naming matches the app?** **Private note · Only you**; **On confirm** / **On dispatch** / **On settle**; **N more notes** / **View less**; no Seller/Buyer on note body (You / shop).  
5. **Units?** Whose = remaining ticket lines · which = **order** unit · surfaces = Total, progress, line sent, Dispatch Ordered. Pack conversion unchanged. `₹` strings unchanged.

**Philosophy conflict?** No. One live order; fewer taps (qty edit is the order); one place to read notes; audit is not extra chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Private-note chrome; live qty cache + dispatch Ordered; OrderAudit writes; Notes sheet notes + cap |
| Business rules | OK | Never rewrite `requestedQuantity` / `confirmedQuantity` on seller edit; floor at shipped |
| Workflows | OK | Selling 1:1, Direct mill, I-handle mill hop (pass-through already) |
| Edge cases | OK | No-op qty skip; can’t-supply only audits when qty caps; amend replaces lines (audit keeps old `orderItemId` string) |
| Permissions | OK | Seller-only qty after lock; personal note company-only; audit not on OrderView |
| User states | OK | Buying ticket still gets lock card if they have a personal note |
| Notifications | N/A | Chat Updated qty already posts |
| Error handling | OK | Existing in-sheet / toast |
| Scalability | OK | Append-only rows; no backfill this slice |
| Mobile interactions | OK | Newest 3 — no inner scroll; composer at bottom; existing dock clearance (BM-07) |
| First glance (BM-11) | OK | Lock label quiet; optional **Add note** stays composer; name+unit unchanged |
| Units (order / dispatch / Rate per) | OK | Live `quantity` is order unit on Total / progress / line sent / Dispatch Ordered |
| Accessibility | OK | Lock decorative; **N more notes** is a button; Chat-out wash still has who-line text |
| Platform consistency | OK | Same chevron as Timeline / can’t supply; chat-out token not a new teal |

---

## Gaps

### G-001 — Dual-write every qty path

| Field | Content |
|-------|---------|
| Gap | A path that changes `OrderItem.quantity` without `OrderAudit` makes the later report silently wrong. |
| Why it matters | Disputes will trust the table, not trail JSON. |
| Impact if ignored | Place/quote/amend/confirm/seller edit/mill pass/can’t-supply/settle (and send-up, mill amend, buy-for-buyer, mill settle→parent) disagree. |
| Recommendation | One `appendQty` helper. Kinds: `placed` · `amended` · `quoted` · `confirmed` · `seller_edit` · `mill_pass` · `cant_supply` · `settled`. `quoted` is required even though the plan’s example list omitted leftover Send quote. |
| Priority | Required before implementation |

### G-002 — Two tables, no ticket report

| Field | Content |
|-------|---------|
| Gap | Easy to hang history on `Order` JSON or expose audit on `OrderView`. |
| Why it matters | Live ticket must stay current; Postgres report is `SELECT` on `OrderAudit`. |
| Recommendation | Separate `OrderAudit`. No OrderView field, no Changed disclosure, no export API this slice. |
| Priority | Required before implementation |

### G-003 — Notes real estate (BM-07 / BM-11)

| Field | Content |
|-------|---------|
| Gap | Sheet notes plus free notes can bury the composer. |
| Why it matters | Inner scroll + stacked chrome clips the last note (BM-07). Loud list fights one job (BM-11). |
| Recommendation | Newest 3 visible; **N more notes** above; composer stays; no inner scroll. |
| Priority | Required before implementation |

### G-004 — decideLines can change qty without a trail row

| Field | Content |
|-------|---------|
| Gap | Partial confirm that leaves the ticket `requested` with no note skips trail. |
| Why it matters | Audit must not follow trail’s “only if status changed”. |
| Recommendation | Write `confirmed` audit rows whenever decideLines updates qty / first snapshot. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- One private-note preview chrome on every ticket that has a personal note. Placement unchanged.  
- `saveLineQty` `setQueryData`; `dispatchLineCountLine` uses live `quantity`. Progress / line sent / Total already live — lock with units. All selling fulfill tickets.  
- New `OrderAudit` table; helper on every qty write; mill hops each have their own order + audit.  
- Notes: any hop trail row with body; cues On confirm / On dispatch / On settle; You `bg-chat-out` / them `bg-foam`; newest 3 + N more notes.  
- Docs + API spec 50→45 while part shipped + functional qty-edit and Notes journeys.

## Explicitly deferred / rejected

- Audit export API, ticket **Changed** disclosure, backfill of old tickets.  
- Non-qty audit columns (`rateBefore` / `rateAfter`) — add later, same table.  
- Buying / Direct / I-handle Selling-1:1 restyle (already deferred).  
- New note APIs.  
- Putting audit JSON on `Order`.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
