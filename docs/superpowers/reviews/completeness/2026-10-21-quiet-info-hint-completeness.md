# Feature Completeness Review — Quiet info (i)

**Date:** 2026-10-21  
**Module / ask:** Confirm / decline why-copy is too loud. Put instructional copy in a circle **i**; tap shows it. Same mark on New collection (Apply this info). One kit control so changing the icon changes it everywhere. Confirm Qty / Rate type must match How many / Edit order.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The Confirm job is tick + qty + rate. A three-sentence why-line on every open is CMS, not trade. The words stay — behind **i**. Collection Apply-all helper is the same class of copy. |
| UX Designer | One `InfoHint` (circle i, 32px tap, muted). Tap opens a short foam note; tap again / outside / Escape closes. Sheet title and field/row labels use the same control. Qty \| Rate on Confirm (and quote / mill Change) use How many / Edit **14px emphasis tabular-nums**, not kit body 16px. |
| Solution Architect | Kit primitive + `InfoIcon`. `Sheet.titleInfo`, `Field.info`. TextInput chrome must not force `font-body` over `font-emphasis`. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field / Sheet; design-line qty tokens (`designLineChrome`). Not a new tooltip library.  
2. **Duplicates another feature?** No — replaces always-on why-lines.  
3. **Should reuse an existing workflow?** Same Confirm / Apply-all meaning.  
4. **Naming matches the app?** Confirm / decline lines; Apply this info to all designs. Button accessible name **About …**.

**Philosophy conflict?** No — clutter-free; optional chrome stays quiet (BM-11).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Copy unchanged; hidden until tap |
| Business rules | OK | Confirm / Apply-all rules unchanged |
| Workflows | OK | Same ticks / CTA |
| Edge cases | OK | Long why-copy wraps in the note; i sits outside nested buttons |
| Permissions | N/A | |
| User states | OK | Closed = zero extra lines |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One icon component |
| Mobile interactions | OK | 32px tap; portal note (sheet overflow does not clip). No new sticky bar (BM-07). |
| First glance (BM-11) | OK | Title + lines + Confirm loudest; i is quiet |
| Accessibility | OK | aria-expanded / aria-controls / note role; Escape closes |
| Platform consistency | OK | Same i on collection Apply-all; qty type shared |

---

## Gaps

### G-001 — Other Field hints stay below

| Field | Content |
|-------|---------|
| Gap | Login OTP “Sent to…”, Team phone, live Order preview stay always-on `hint`. |
| Why it matters | Those are status / format, not how-to. |
| Impact if ignored | Putting every hint in i hides live state. |
| Recommendation | `Field.hint` stays below. Instructional copy uses `info` / `titleInfo`. |
| Priority | Future improvement — convert only when the line is how-to |

---

## Approved scope for this slice

- Kit `InfoHint` + `InfoIcon`. Sheet `titleInfo`. Field `info` (i next to the label).  
- Confirm / decline: why-copy on the title **i**.  
- New collection: Apply-all helper on the same **i**.  
- Confirm / quote / mill Change Qty \| Rate: `14px font-emphasis tabular-nums` (How many / Edit). TextInput does not override that with `font-body`.  
- Docs + units.

## Explicitly deferred / rejected

- Native tooltips / a second popover kit.  
- Converting every `Field.hint` in the app.  
- Restacking Send quote’s live “Quoting N of M” line (status, not how-to).  
- ± stepper on Confirm Qty \| Rate.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes — units + trader-eye; no new journey (chrome).
