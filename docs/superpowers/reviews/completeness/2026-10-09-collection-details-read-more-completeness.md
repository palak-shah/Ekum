# Feature Completeness Review — Collection details read-more

**Date:** 2026-10-09  
**Module / ask:** Album viewer first section: replace flat categories · rate + **About this collection** with one collapsed details block (2–3 lines + **read more**) that expands into labeled **Rate → Size → Description → Item tags → Quality tags**. Hide Size when empty.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Pack identity belongs in one scannable block. Flat tag dump fights “one job”; labeled sections match create-form language. Tools and design grid stay below. |
| UX Designer | Default clamp 2–3 lines + **read more** / **Show less**. Empty sections omitted. No second About chevron. |
| Solution Architect | Split tags with `categoriesToTagSlots`; rate via `packRateBand`. Reuse overflow helper. Lot tools / docks unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Album scan stack; muted body under semibold labels; Explore About is separate surface.  
2. **Duplicates another feature?** No — replaces facts + About on the album only.  
3. **Should reuse an existing workflow?** Taxonomy slot split + pack rate band.  
4. **Naming matches the app?** **Rate** · **Size** · **Description** · **Item tags** · **Quality tags** · **read more**.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Ordered sections; Size hide; clamp + read more |
| Business rules | OK | Rate only when honest band; empty omit |
| Workflows | OK | Header → details → tools → designs |
| Edge cases | OK | No sections → hide block; short content → no read more |
| Permissions | N/A | |
| User states | OK | Owner + visitor same identity block |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome; tools stay below |
| First glance (BM-11) | OK | Designs stay the job; details quiet when clamped |
| Accessibility | OK | Expand control aria-expanded |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Album-only pack details read-more (not Explore feed caption).
- Section builder + `CollectionPackDetails` UI; wire `CollectionViewerPage`.
- Docs + unit/component tests.

## Explicitly deferred / rejected

- Thumb **On request** overlay changes.
- Owner dock **Add designs** rename.
- Explore feed **About this collection**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
