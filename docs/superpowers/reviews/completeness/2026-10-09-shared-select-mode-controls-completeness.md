# Feature Completeness Review — Shared select mode chrome

**Date:** 2026-10-09  
**Module / ask:** One Select → Select all / Clear control language across album, You, Saved, shop, Explore. Clear exits Selecting. Explore hides Select all via prop. Half-size pick checks. Shared `BrowseLotChrome` for Find + select + layout + children.  
**Anchors:** `docs/features/collections.md`, `docs/features/saved.md`, `docs/features/explore.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same enter/exit everywhere; Explore still no Select all on mixed feed. |
| UX Designer | Idle Select; Selecting shows count + Select all (optional) + Clear. Smaller checks. |
| Solution Architect | `SelectModeControls` + `BrowseLotChrome`; `showSelectAll` prop; shrink `SelectableMediaFrame`. |

---

## Platform consistency

1. **Existing patterns?** Kit pills; lot tools row.  
2. **Duplicates?** Replaces SelectAllFloat + Selecting pill on migrated surfaces.  
3. **Reuse?** One control component.  
4. **Naming?** Select · Select all · Clear · N selected.

**Philosophy conflict?** No

---

## Approved scope

- SelectModeControls + BrowseLotChrome
- Half-size checks
- Migrate album viewer, You, Saved, shop, Explore (`showSelectAll={false}`)
- You library: tabs + ＋ on row 1; `BrowseLotChrome` (Find · Select · layout) on row 2; find + filter via `findPanel`
- Docs + tests

## Explicitly deferred

- Select all on mixed Explore feed
- Chat forward select
- Generic tile card rewrite

## Sign-off

Required gaps closed: Yes  
Ready: Yes  
