# Feature Completeness Review — Collection form chrome

**Date:** 2026-10-20  
**Module / ask:** New/Edit collection identity chrome: kit spacing (not a looser scale); **Product details** groups Category → Rate → tags (slot order tightened 2026-10-27); short auto-grow Description; ₹ + **Rate**; existing tokens only.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Rate per units come from the selected category, so Rate sits **after Category** (below tags is fine). Description stays a pack blurb, not taxonomy. Category + tags still read as one product job. |
| UX Designer | Quiet **Product details** kicker (Explore/card language). Compact inner `gap-2`, majors `gap-3`. Description one kit row that grows while typing. ₹ prefix like SearchInput, not a new kit primitive. Foam tiles / `bg-input` fields — no new mint token. |
| Solution Architect | Reuse `RateRangeFields`, `CascadeTagsFields`, kit `Field` / `TextArea`. Grow height is a small clamp helper (same idea as chat composer). Member design sheet keeps the same rate chrome. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Field 40px / `gap-1.5`; dashed foam add tiles; SearchInput-style prefix; uppercase muted section labels.  
2. **Duplicates another feature?** No — same create/edit identity.  
3. **Should reuse an existing workflow?** Same taxonomy, rate parse, apply-all, Who / Order and dispatch expandables.  
4. **Naming matches the app?** **Product details** (not PRODUCT DESCRIPTION). **Rate**. **Item tags** / **Quality / work tags** / **Size tags**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Category → Rate → tags (2026-10-27); Description grows; ₹ Rate |
| Business rules | OK | Category still required when shop has more than one; Rate per options still from selected category; blank rate still allowed |
| Workflows | OK | Create + edit identity; member sheet shares rate control |
| Edge cases | OK | One-category shop hides Category; Rate stays in the Product details slot |
| Permissions | N/A | Own catalog |
| User states | OK | Empty Description is one row; empty Rate has ₹ + Rate |
| Notifications | N/A | |
| Error handling | N/A | No new submit rules |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome; dock clearance unchanged (BM-07) |
| First glance (BM-11) | OK | Add designs still loudest; Product details is a quiet group; Description not a tall empty box |
| Accessibility | OK | Category / Rate / Description labels; ₹ aria-hidden; rate inputs keep aria-label |
| Platform consistency | OK | Kit tokens only; no kit-wide placeholder italic change; no `--ekum-input` retint |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Identity order: **Collection name** → **Description** (short, grows) → **Product details** (**Category** → **Rate** ₹ **Rate** → Item / Quality / Size tags) → Who / Apply all / Order and dispatch.  
  Slot order **Category → Rate → tags** supersedes “below tags is fine” — see Completeness 2026-10-27-create-rate-after-category.  
- Kit gaps: majors `gap-3`; Product details inner `gap-2`; Field default `gap-1.5`; controls `min-h-10`.  
- `RateRangeFields`: ₹ prefix + placeholder **Rate**; unit/category selects `bg-input`.  
- Add tiles stay dashed `bg-foam` (hover does not gray them out).  
- Docs + units + publish journey heading.

## Explicitly deferred / rejected

- Optional / “Choose a category” placeholders.  
- “Use this rate for every design”.  
- All-caps **PRODUCT DESCRIPTION**.  
- Retinting `--ekum-input` or dropping kit `placeholder:italic` app-wide.  
- Page `gap-4` between every field.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
