# Feature Completeness Review — How many note feels like notes

**Date:** 2026-10-02  
**Module / ask:** Per-design “Colour, packing…” on How many each is a tiny one-line strip beside qty. Traders do not read it as a note.  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Colour / packing is a real line remark, not a chip. The 2026-10-01 strip saved space and hid the job. |
| UX Designer | Kit **TextArea** under the thumb · name · qty row, full line width. Starts **one line**; grows only as they type (chat composer). Placeholder names it: **Note — colour, packing…**. No Add note. Same on order builder. Do not put the box in the squeezed name column. |
| Solution Architect | Same `line.note` string. No voice on this sheet (photo order already has voice). |

---

## Platform consistency (required)

1. **Existing patterns?** Sheets use kit `TextArea` for notes (order actions). Qty stays the compact stepper.  
2. **Duplicates another feature?** No — same field, clearer control.  
3. **Should reuse an existing workflow?** How many each / builder lines.  
4. **Naming matches the app?** Note; colour and packing stay in the placeholder.

**Philosophy conflict?** No — the strip fought “plain words, one job.”

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same optional string |
| Business rules | OK | Empty still omitted |
| Workflows | OK | Place / Ask unchanged |
| Edge cases | OK | 20 lines: 2-row area, not min-h-24 |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Sheet scroll; BM-07 footer unchanged |
| Accessibility | OK | `aria-label` Note for {name} |
| Platform consistency | OK | Kit TextArea, not a new chrome |

---

## Gaps

None required.

---

## Approved scope for this slice

- How many each + order builder: per-line note is a full-width `TextArea` under the design row.
- Starts one line; grows with wrap / new lines, then caps.
- Placeholder **Note — colour, packing…**
- Docs + unit assert grow helper + textarea.

## Explicitly deferred / rejected

- Voice on How many each.
- One shared note for all designs.
- Bringing back **Add note**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units; visual)
