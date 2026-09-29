# Feature Completeness Review — You library: Designs/Collections as parent tabs

**Date:** 2026-09-28  
**Module / ask:** You library chrome: Designs / Collections must read as the **main tab**; Published / Draft / Archived / Saved belong **inside** that tab.  
**Anchors:** `docs/features/settings.md`, `docs/features/catalog.md`, ui-quality-bar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Kind (design vs pack) is the library; status is a filter of that library. Two equal chip rows hide that. |
| UX Designer | Parent = Explore search underline tabs (not the Group-info linen well — already rejected here). Child = existing Chip FilterRail. Same ＋ on the parent row. |
| Solution Architect | Markup/class only. Testids stay. |

---

## Platform consistency (required)

1. **Existing patterns?** Explore search `border-b-2` kind tabs; Chats/Orders Chip rails for filters.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — do not invent a third tab kit. Do **not** bring back `bg-linen` segment.  
4. **Naming matches the app?** Designs · Collections · Published · Draft · Archived · Saved.

**Philosophy conflict?** No. Two rows already exist; hierarchy is the missing visual.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same tab/filter behaviour |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Buyers still get kind tabs when Saved is the list |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky bar; BM-07 unchanged |
| Accessibility | OK | `tablist` / `tab` / `aria-selected` on kind; status stays buttons |
| Platform consistency | OK | Explore underline + Chip filters |

---

## Approved scope for this slice

- Designs / Collections: underline parent tabs (Explore search treatment), `role="tab"`.
- Published / Draft / Archived / Saved stay kit Chips on the row under that.
- ＋ stays on the parent tab row; Find / Feed·Grid stay on the status row.
- Docs + You journey asserts kind is tabs, status is not.

## Explicitly deferred / rejected

- Reverting Designs/Collections to a linen well.
- Merging into a single chip row (loses kind vs status).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
