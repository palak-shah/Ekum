# Feature Completeness Review — Collection one Add designs chooser

**Date:** 2026-10-06  
**Module / ask:** New collection / pack edit: one **Add designs** control. Tap opens a sheet: **Camera** · **Photo library** · **Designs**. No side-by-side doors.  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Three peer doors fight “one job.” One Add designs → choose source matches library-picker-as-sheet and chat attach judgment. |
| UX Designer | Empty + after-members: single dashed **Add designs**. Sheet order: Camera · Photo library · Designs (everyday capture first, library last). Photo library = OS gallery (no camera flash). |
| Solution Architect | Reuse existing `sourceOpen` menu; wire empty/dock CTAs to `openAddDesignsMenu` only. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet chooser like attach / source menu; kit Sheet-style menu already on page.  
2. **Duplicates another feature?** Removes duplicate doors.  
3. **Should reuse an existing workflow?** Yes — `collection-source-menu`.  
4. **Naming matches the app?** **Add designs** · **Photo library** (not Photos) · **Camera** · **Designs**.

**Philosophy conflict?** No — fewer taps to the right door; clutter cut.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One CTA → three sources |
| Workflows | OK | Camera / gallery / library unchanged under the hood |
| Mobile interactions | OK | Sheet above content; no sticky clip |
| First glance (BM-11) | OK | One loud job on empty pack |
| Platform consistency | OK | |

---

## Approved scope

- Empty create + compact add rows + edit add: single **Add designs** → source sheet  
- Sheet: **Camera** · **Photo library** · **Designs**  
- Lock collections.md  

## Explicitly deferred

- Changing chat ＋ Camera/Photos peers (separate surface)
