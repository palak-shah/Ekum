# Feature Completeness Review — Collection header + ⋯ polish

**Date:** 2026-10-11  
**Module / ask:** Hide You avatar; album ⋯ Bookmark this collection (idle); select ⋯ bookmarks designs  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Idle ⋯ bookmarks the album; with picks, Bookmark means the selected designs — matches trader intent (select then save those lots). Dropping JE on You avoids a dead account chrome on a library job. |
| UX Designer | Same MoreActionsSheet language; longer Share/Bookmark labels match owner Share this collection. Danger Delete stays last. No new kit. |
| Solution Architect | Reuse `useSaveToggle` for collection; `toggleSavedDesigns` for bulk product saves against `/saved`. Shell gate via `shellShowsHomeAccount`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — MoreActionsSheet, save API, AppShell band.  
2. **Duplicates another feature?** No — clarifies bookmark target by mode.  
3. **Should reuse an existing workflow?** Yes — Saved list / Follow-style toggle.  
4. **Naming matches the app?** Yes — Bookmark this collection / Bookmark design(s).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Idle collection bookmark; select design bookmark(s) |
| Business rules | OK | Own select still Remove/Delete |
| Workflows | OK | Header ⋯ always; sheet body mode-swaps |
| Edge cases | OK | All-selected-already-saved → Remove bookmark(s) |
| Permissions | OK | Owner vs visitor sheets unchanged otherwise |
| User states | OK | You without avatar; Home keeps account menu |
| Notifications | N/A | |
| Error handling | OK | Toast on save failure |
| Scalability | OK | Sequential saves for small select sets |
| Mobile interactions | OK | Sheet + header ⋯ |
| Accessibility | OK | Existing menu roles |
| Fixed/sticky chrome | OK | No new docks |

---

## Required gaps

None blocking.

## Disposition rationale

Small chrome polish aligned with universal collection chrome; no philosophy conflict.

## Approved scope (if Proceed)

- AppShell: account avatar Home only  
- Owner idle ⋯: Bookmark this collection under Share  
- Visitor idle labels: Share/Bookmark this collection  
- Select ⋯: bookmark selected designs; own also Remove/Delete  
- Docs + units  
