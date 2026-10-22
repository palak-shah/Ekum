# Feature Completeness Review — Ticket Qty is a number

**Date:** 2026-10-21  
**Module / ask:** Line Qty should not repeat **mtrs** (or sets). The unit is common; **Total** already has it. What about mixed units? Pack bill = sets × pcs-in-set × price per pc.  
**Anchors:** `docs/features/orders.md`, `2026-10-21-order-ticket-unit-chrome-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Repeating mtrs on every row is noise. One unit: lines are counts; Total says `130 mtrs`. Mixed: we already restack under **Sets** / **Mtrs** — those titles are the unit; lines stay numbers; Total still stacks `2 sets = 24 pcs` and `70 mtrs`. |
| UX Designer | Compact mill bill. Do not add a Sets/Mtrs heading when every line shares one unit (Total is enough). How many / Edit keep the noun on the stepper footer. |
| Solution Architect | Ticket `OrderLineFacts` compact/detail: Qty = quantity only. Pack bill already `qty × packSize × rate` (`lineBillAmount`). No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Mixed already groups with `SectionHeader`. Total already has family nouns.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** `groupHowManyByOrderUnit` + `howManyOrderFooterSummary`.  
4. **Naming matches the app?** Sets / Mtrs headings; Total nouns.

**Philosophy conflict?** No — unit once.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | OK | Pack bill unchanged: sets × pcs/set × ₹/pc |
| Workflows | OK | Ticket scan |
| Edge cases | OK | Mixed headings; blank pack size → no ₹ (already) |
| Permissions | N/A | |
| User states | OK | Parent + mill cards with facts |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | More room in Qty |
| First glance (BM-11) | OK | Numbers; Total has the word |
| Accessibility | OK | Qty label still there; Total has noun |
| Platform consistency | OK | How many footer unchanged |

---

## Gaps

### G-001 — How many / quote / mill Send

| Field | Content |
|-------|---------|
| Gap | Place and mill Send still show unit on/near the line (stepper / sold-as). |
| Why it matters | Ticket is the record; typing sheets still need a unit cue. |
| Recommendation | Keep How many footer + mill Send sold-as this slice. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Ticket compact/detail Qty = number only.
- Mixed: keep **Sets** / **Mtrs** headings; Total keeps nouns.
- One unit: no heading; Total has the noun.
- Confirm pack Bill = `sets × piecesPerPack × rate` (already). Native = `qty × rate`.

## Explicitly deferred / rejected

- Changing How many / Edit line chrome.
- Inventing a heading when every line is metres.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + trader-eye.
