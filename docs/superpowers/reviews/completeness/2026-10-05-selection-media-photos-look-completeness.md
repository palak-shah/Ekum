# Feature Completeness Review — selection media looks selected (Photos-style)

**Date:** 2026-10-05  
**Module / ask:** When Selecting on Explore / designs / collections (and same traveling Selection elsewhere), keep the check mark **and** make the media look selected like Google Photos (inset frame), app-wide.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to see at a glance which tiles are in the pile — check alone is easy to miss on busy mosaics. |
| UX Designer | One shared media treatment: selected = shrink (surface gap) + white disc / ink check; unselected stay full color. No teal frame, no grey-out. |
| Solution Architect | Shared `SelectableMediaChrome` in kit/cards path; wire Explore feed, DesignTile, CatalogFeedPost, Saved, shop grid, design set, You library. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Select / long-press / traveling Selection; ink check on media (not accent frame).  
2. **Duplicates another feature?** No — visual only.  
3. **Should reuse an existing workflow?** Reuse selectMode/selected props; one chrome helper.  
4. **Naming matches the app?** No new verbs.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual selected state |
| Business rules | N/A | |
| Workflows | OK | Toggle unchanged |
| Edge cases | OK | Unselected in select mode still shows empty check |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No smaller hit targets |
| First glance (BM-11) | OK | Selected tile reads selected without hunting the check |
| Accessibility | OK | aria-label Select… unchanged; visual supplement |
| Platform consistency | OK | App-wide helper |

---

## Approved scope for this slice

- Shared selectable-media chrome: selected → surface shrink + white disc / ink check; unselected stay full color. No accent/teal frame, no grey-out.  
- Apply on Explore collection/design posts, DesignTile, CatalogFeedPost, Saved tiles, shop photo grid, design-set tiles, You library select tiles.  
- Docs + unit asserting selected media chrome classes.

## Explicitly deferred / rejected

- Animating selection spring / haptics  
- Changing ConnectionPicker / list-row selection language (already accent-border rows)

## Gap matrix

Update `feature-gap-matrix.md` after ship.
