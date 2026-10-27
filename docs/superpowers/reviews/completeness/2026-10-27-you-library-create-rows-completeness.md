# Feature Completeness Review — You library create rows

**Date:** 2026-10-27  
**Module / ask:** On You, New design must match New collection / New catalog (list row, not a trailing tab ＋). All three create rows smaller. Selecting disables them instead of hiding.  
**Anchors:** `docs/features/catalog.md`, `docs/features/settings.md`, `docs/features/collections.md`  
**Disposition:** Proceed (chrome of existing create; same destinations)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Create belongs with the list, not a second control on the tab row. Same job on Collections / Catalogs / Designs → same row. Selecting is for the pile; create stays visible so the list does not jump, but must not start a new album/design until Select ends. |
| UX Designer | Trailing ＋ fights tab chrome and looks louder than New collection. 64px dashed thumb competes with album tiles. Kit 40px thumb + 14px label is quiet. Disable (muted, no tap) — do not unmount. Bookmark / Deleted still hide create (those views are not create). Empty Designs **Add designs** stays. |
| Solution Architect | Shared row component + `youLibraryShowsDesignAdd` no longer keys off `selecting`. Destinations unchanged (`/catalog/collections/new`, `?kind=catalog`, `/catalog/products/new`). |

---

## Platform consistency (required)

1. **Existing patterns?** You list row (dashed plus · accent label). Kit 40px field/button size. Disable in place, not a second hide rule.  
2. **Duplicates another feature?** No — same create, quieter chrome.  
3. **Should reuse an existing workflow?** Yes — Add designs / New collection / New catalog editors.  
4. **Naming matches the app?** **New design** beside **New collection** / **New catalog**. Editor heading stays **Add designs**.  
5. **Units?** N/A — no ₹ or qty string.

**Philosophy conflict?** No. One create language per tab; Selecting does not steal the list.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Three rows; Designs row opens Add designs |
| Business rules | OK | Upload cap toast unchanged |
| Workflows | OK | Idle tap creates; Selecting disables |
| Edge cases | OK | Bookmark / Deleted hide; empty Add designs button stays |
| Permissions | OK | `uploads` still gates Add designs |
| User states | OK | Idle vs Selecting vs Bookmark vs Deleted |
| Notifications | N/A | |
| Error handling | OK | Existing no-upload-cap toast |
| Scalability | N/A | |
| Mobile interactions | OK | No extra sticky bar; list does not jump on Select |
| First glance (BM-11) | OK | Create quieter than 64px tiles; tabs stay one row |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | `disabled` + muted; no hide |
| Platform consistency | OK | Same row on three tabs |

---

## Gaps

### G-001 — Designs create is a tab-row ＋; Selecting hides create

| Field | Content |
|-------|---------|
| Gap | Add designs sits right of the tabs. New collection / New catalog unmount while Selecting, so the list jumps. 64px create thumbs are louder than the job. |
| Why it matters | First-time seller hunts ＋; Select feels like create vanished. |
| Impact if ignored | Three create languages on one page; layout jump (BM-11). |
| Recommendation | List row **New design**; 40px thumbs; disable while Selecting. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Designs: **New design** list row (not trailing ＋) → `/catalog/products/new`.  
- Shared smaller create row (40×40 dashed plus, 14px label) for New collection / New catalog / New design.  
- Selecting: rows stay, `disabled`. Bookmark / Deleted still hide.  
- Album / design tiles stay 64px. Empty **Add designs** button unchanged.

## Explicitly deferred / rejected

- Changing Add designs / New collection editors.  
- Showing create on Bookmark or Deleted.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
