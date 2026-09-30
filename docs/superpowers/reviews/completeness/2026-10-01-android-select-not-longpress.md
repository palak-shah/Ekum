# Feature Completeness Review — Android catalog Select (not long-press)

**Date:** 2026-10-01  
**Module / ask:** Catalog multi-select on Android — long tap is a poor experience  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop / Saved already start pick with **Select**, then tap. Explore and album still require hold. Android hold fights the OS (context menu, ghost click). Primary path must be **Select**, not hold. |
| UX Designer | Same quiet **Select** / **Selecting** pill as shop — not a third 40×40 square, not checkboxes. Long-press stays a shortcut. Explore: pill after Filter, hidden in search / Selling / Businesses. Album: pill in header when there are designs. No Select-all on mixed Explore (still shop / album / Saved). |
| Solution Architect | `applySelectingPill` already exists. Explore sets both shortlist + album pick modes. Album stays local (`pageSelecting`) so a traveling pile does not lock the pack. Fix `useLongPress` so timeout + Android `contextmenu` cannot toggle twice. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — shop / Saved **Select** then tap rows; traveling Selection floater unchanged.  
2. **Duplicates another feature?** No — same pile, better start.  
3. **Should reuse an existing workflow?** Yes — `applySelectingPill`, not inbox Select chats.  
4. **Naming matches the app?** **Select** / **Selecting**.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Enter Selecting without hold; tap mosaic/photo toggles |
| Business rules | OK | Types preserved; name still opens |
| Workflows | OK | Shop already this path |
| Edge cases | OK | Hide Select when there is nothing to pick |
| Permissions | N/A | |
| User states | OK | Selling / search / businesses: no Select |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar; Select-all float already on album (BM-07 unchanged) |
| Accessibility | OK | Named button, not hold-only |
| Platform consistency | OK | Match shop pill |

---

## Gaps

None Required. Deferred: Explore **Select all** on mixed feed (gap matrix already “not on Explore”).

---

## Approved scope for this slice

- Explore: **Select** / **Selecting** after Filter (not a Selection square). Enter mode with empty pile; tap posts to pick. Long-press remains a shortcut.  
- Album: same pill in the header when the pack has designs.  
- `useLongPress`: one fire per hold (timer vs `contextmenu`).  
- Docs + unit + functional for Explore Select.

## Explicitly deferred / rejected

- Explore Select-all on mixed design+album feed.  
- Dropping long-press on iOS/desktop.  
- Chat inbox / thread long-press menus (different job).

## Sign-off

Product + UX + architecture: **Proceed**.
