# Feature Completeness Review — Add designs picker uses app-wide select chrome

**Date:** 2026-10-20  
**Module / ask:** Selection on the **Add designs** library sheet must match the rest of the app: color, circle size, placement.  
**Anchors:** `docs/features/collections.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

2026-10-10 deferred `SelectableMediaFrame` on this sheet. The picker still uses a 24px green ✓ and a teal frame. That is a one-off. Un-defer.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Picking designs for a pack is the same job as Selecting on Explore / You / album: tap a photo. The check must look like the rest of Ekum or they re-learn the tap. |
| UX Designer | Reuse `SelectableMediaFrame`: selected photo shrinks (gap is sheet surface, not a teal frame); 18px filled **accent** check; square thumbs place it **top-right** like album design photos (`right-2 top-2`). Unselected stay full color with the idle hollow check (this sheet is always Selecting). No green badge ✓. |
| Solution Architect | One `LibraryPickTile` for New collection + album Add/Replace. No new check CSS. |

---

## Platform consistency (required)

1. **Existing patterns?** `SelectableMediaFrame` (Explore, You, Saved, album).  
2. **Duplicates another feature?** No — same pick chrome, wrong implementation here.  
3. **Should reuse an existing workflow?** Yes — do not invent a picker check.  
4. **Naming matches the app?** Add designs / Done. Not Select.

**Philosophy conflict?** No. One-off green check fights §4 uniformity.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Tap still adds / deselects |
| Business rules | N/A | Hide already-in members unchanged |
| Workflows | OK | Create + album Add + Replace |
| Edge cases | OK | No photo → initial; idle check on unselected |
| Permissions | N/A | Own library |
| User states | OK | Empty library / all already in |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Same grid |
| Mobile interactions | OK | Sheet footer Done; BM-07 unchanged |
| First glance (BM-11) | OK | Same shrink + small accent circle as the rest of the app |
| Accessibility | OK | `aria-pressed`; name still on the tile |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Add designs / Replace designs library tiles use `SelectableMediaFrame` (18px accent check, shrink, no teal frame). Placement `right-2 top-2` to match album design thumbs.  
- Shared tile for editor + album viewer.  
- Docs + unit (BM-11: not green / not 24px / not a frame).

## Explicitly deferred / rejected

- Changing Explore vs album left/right check (album designs stay top-right).  
- Deselect-to-remove already-in members from this sheet (still hidden).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing add-and-go journey still taps a library photo)
