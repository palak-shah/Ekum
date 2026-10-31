# Feature Completeness Review — Ticket notes, timeline, bill total, list path icons

**Date:** 2026-10-31  
**Module / ask:** Restyle ticket Notes, Designs, and Timeline to the order-page prototype; persist supplier **Show bill total on orders** on `CompanySettings`; list path icons (people = Direct Link, chain = I-handle).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/settings.md`, `2026-10-30-order-ticket-chrome-completeness`  
**Disposition:** Proceed (visual Redesign + persist)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Hop-scoped Notes persist, trader Forward, Personal note in ⋯, mill From/To rates, dispatch/How many/settle strips, and order-form PDF stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Bill total is the **supplying shop’s** intent, not a device theme. Default off. Same ticket for every party on that hop. Notes stay hop-scoped. List icons replace Shared/Trading words. |
| UX Designer | Notes: foam You/them, composer **+ \| field \| Add** (plus first like chat). Designs: proto `.dl` (42×4/5 thumb, name + Rate per right, qty under). Total ₹ on the right when on. Timeline · N expands all rows. Theme C charcoal, no teal. |
| Solution Architect | `CompanySettings.tradeDefaults.showBillTotalOnOrders`. Stamp `OrderView.showBillTotal` from **sellerCompanyId**. Buyer UI must not read its own settings. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Card / Chip / NoteAttachField / GroupIcon / PageHeader; chat attach + first; Appearance stays device-only.  
2. **Duplicates another feature?** No — not Appearance, not PDF, not mill From/To.  
3. **Should reuse an existing workflow?** Yes — PATCH `/settings` + `tradeDefaults` merge; hop Notes already persist.  
4. **Naming matches the app?** **Show bill total on orders**; **Notes & comments**; **Timeline · N**; **Direct connection** / **Through you**. No Seller/Buyer on list cards.  
5. **Units?** Whose = remaining ticket lines · which = **order** unit for qty, **Rate per** for ₹/unit on the line, bill total = existing mill-bill Total · surface = ticket Designs + Total. Pack conversion stays on Total. Blank pack does not invent ₹.

**Philosophy conflict?** No if the flag is seller-company, hop-scoped, and same for all viewers. Per-login localStorage would fight “supplier does not want to show total.” Per-line Bill column fights the prototype.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Notes chrome; Designs proto; Timeline · N; list icons; seller flag |
| Business rules | OK | Seller company; default off; same hop ticket |
| Workflows | OK | Settings Billing chip; ticket reads OrderView |
| Edge cases | OK | I-handle two hops / two sellers; mixed units; missing rates only when on |
| Permissions | OK | Buyer cannot turn it on; staff of seller share one value |
| User states | OK | Selling/trading see the chip |
| Notifications | N/A | |
| Error handling | OK | Existing settings PATCH errors |
| Scalability | OK | One settings read on order serialize |
| Mobile interactions | OK | No new sticky (BM-07) |
| First glance (BM-11) | OK | Rate on the line; Total ₹ only when on; + first on notes |
| Units (order / dispatch / Rate per) | OK | Rate per on line; qty order unit; Total bill when on |
| Accessibility | OK | Timeline summary text; icon titles |
| Platform consistency | OK | Chat +; kit Chip; Theme C |

---

## Gaps

### G-001 — Buyer must not infer bill from own settings

| Field | Content |
|-------|---------|
| Gap | If the ticket reads the viewer’s `GET /settings`, a buyer who sells elsewhere could show ₹ on a hop whose supplier hid it. |
| Why it matters | Supplier intent is the product. |
| Recommendation | Stamp `OrderView.showBillTotal` from the hop **seller** company. |
| Priority | Required before implementation |

### G-002 — Do not restore Qty · Price · Bill on the ticket

| Field | Content |
|-------|---------|
| Gap | Older ticket chrome locked a Bill column. Prototype + this ask drop it. |
| Recommendation | Ticket lines: name + Rate per + qty. Total ₹ on the right when on. Dispatch / How many / settle strips unchanged. PDF unchanged. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Notes & comments foam bubbles; composer **+ \| field \| Add**; Forward / Personal note unchanged.  
- Ticket Designs proto lines; Total qty always; ₹ right only when `showBillTotal`.  
- Seller `showBillTotalOnOrders` in `CompanySettings.tradeDefaults`; Settings Billing chip.  
- Timeline · N; all events when expanded; warning dot on Updated.  
- List: GroupIcon Direct Link; LinkIcon I-handle; no Shared/Trading words.

## Explicitly deferred / rejected

- Teal bars, Accept order, dock chat, Extra accept/reject, mill-card restyle, PDF bill, Appearance/localStorage bill toggle.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
