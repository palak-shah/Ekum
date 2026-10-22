# Feature Completeness Review — Dispatch Ship in this LR column · LR/Bill names · scroll transport

**Date:** 2026-10-21  
**Module / ask:** Dispatch: (1) **Ship in this LR** must fit one line — that column is the only editor, so it can be a bit wider. (2) Empty LR/Bill fields must read **LR number** / **Bill number**, not Optional (the shared header scrolls away). (3) Transporter · Parcels · LR+photo rows must not pin as a sticky footer — three LRs with photos hide the design list (BM-07).  
**Anchors:** `docs/features/orders.md`, How many (transport in scroll, sticky total + Place), `2026-10-21-order-line-stepper-money-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The Dispatch job is still “how many on this LR”. Transport facts are required to confirm but they are not the first scan. Sticky Confirm + This LR total stay; LR rows scroll with the designs. |
| UX Designer | Hairline **Ordered · Shipped · Ship in this LR · Balance**. Editor column slightly wider, label `whitespace-nowrap`, − n + in that cell (not trailing on the name). Empty LR/Bill placeholders name themselves so a 2nd/3rd parcel still reads after the first row. Matches How many: extras in the body, sticky = tally + primary. |
| Solution Architect | Presentation only. Same `shipQty` / `legs[]` / Confirm payload. Reuse `QtyStepper` and kit `Sheet` footer. Prior-edit already lives in the scroll — same placeholders. |

---

## Platform consistency (required)

1. **Existing patterns?** How many: Transporter in scroll; sticky footer is total + Place. Ticket hairline facts. `QtyStepper` − n +. Kit `TextInput` placeholders.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Dispatch sheet / prior-edit.  
4. **Naming matches the app?** Ship in this LR · LR number · Bill number. Not Optional.

**Philosophy conflict?** No — one editor column, quieter extras, content not clipped.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | This LR still `lineDispatchQty`; legs still Parcels = N |
| Business rules | OK | Over-ship unclamped; remaining-0 still start off |
| Workflows | OK | New LR: lines then transport in one scroll; prior-edit unchanged location |
| Edge cases | OK | 3 LRs + photos: lines stay reachable; empty fields still named |
| Permissions | OK | |
| User states | OK | Editing a prior hides new-LR transport (same as today) |
| Notifications | N/A | |
| Error handling | OK | In-sheet error stays above Confirm |
| Scalability | N/A | |
| Mobile interactions | OK | Sticky Confirm + This LR total only (BM-07). Editor column ≥ ~9rem so the label does not wrap. |
| First glance (BM-11) | OK | Name, then Ordered / Shipped / Ship in this LR / Balance. LR number · Bill number on every row. |
| Accessibility | OK | aria-label Ship in this LR quantity; LR number N / Bill number N |
| Platform consistency | OK | How many scroll vs sticky; no native checkbox |

---

## Gaps

None Required.

`2026-10-21-dispatch-sheet-row-chrome` deferred “putting transport in the scroll body.” This slice **closes** that deferral — sticky LR+photo rows clip the list (BM-07).

---

## Approved scope for this slice

- Dispatch strip: Ordered · Shipped · **Ship in this LR** (− n + in a wider nowrap column) · Balance.  
- Placeholders **LR number** / **Bill number** on new dispatch and prior-edit (no shared header that scrolls away).  
- Transporter · Parcels · LR+Bill+photos move into the sheet **scroll** after the design lines. Sticky footer = This LR total + Confirm dispatch.  
- Docs + units.

## Explicitly deferred / rejected

- Native checkboxes; changing parcel/leg API; making Confirm a dock tab.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units; existing fulfillment still finds `order-dispatch-line-qty`.
