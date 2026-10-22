# Feature Completeness Review — Collection add-to-continue + tap to change

**Date:** 2026-10-20  
**Module / ask:** New collection empty dock **Add designs to continue** until photos or library designs exist; after members, a compact **N designs · tap to change** strip instead of a loud grid.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Empty create still allows **Save in Draft**. Publish stays gated on name / category / at least one ready design. Continue is a next-step, not a second publish path. |
| UX Designer | Empty: hero **Add from existing designs** · **Add photos** stay the add doors; dock primary is **Add designs to continue** (scrolls to those tiles). After members: overlapping thumbs + **N designs · tap to change** — tap expands the existing grid + compact add (no new sheet). **Create & Publish** returns once members exist. |
| Solution Architect | Reuse `AddDesignsControl`, `CappedMediaGrid`, member sheets. Small label helper + strip component. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Dual sticky dock; dashed foam tiles; kit `Button`; album still images-first. Strip is a collapsed stand-in for the grid, not a new picker.  
2. **Duplicates another feature?** No — same create add path.  
3. **Should reuse an existing workflow?** Same library picker + ContinuousCamera. Expand uses the grid already on the page.  
4. **Naming matches the app?** **Add designs to continue**. **N design(s) · tap to change**. **Create & Publish** / **Save in Draft** unchanged after members.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Empty dock continue; filled strip + expand to change |
| Business rules | OK | Draft empty still allowed; Publish still needs ready members |
| Workflows | OK | Create only. Edit album stays on the viewer / manage dock |
| Edge cases | OK | Last member removed → hero + continue again; uploading photos still count as members for the strip |
| Permissions | N/A | Own catalog |
| User states | OK | 1 vs N copy; no thumbs still shows the label |
| Notifications | N/A | |
| Error handling | N/A | Continue does not submit |
| Scalability | N/A | Strip peeks 6 thumbs; grid still caps at 9 |
| Mobile interactions | OK | Same one-row dock (BM-07 clearance unchanged) |
| First glance (BM-11) | OK | Empty: doors + continue are the job. After add: strip is quiet so identity is readable; tap to change is the obvious album control |
| Accessibility | OK | Continue named button; strip `aria-expanded` + label |
| Platform consistency | OK | No new sheet, checkbox, or dock variant |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Empty create dock: **Add designs to continue** (primary) · **Save in Draft** (secondary). Continue scrolls to `collection-add-doors`.  
- After any pending photo or library pick: strip **N designs · tap to change** (up to 6 thumbs). Tap toggles the existing grid + compact add + tip.  
- Dock after members: **Create & Publish** · **Save in Draft** (same enable rules as today).  
- Docs + unit + `collection.publish.journey`.

## Explicitly deferred / rejected

- Dropping **Save in Draft** on empty (prototype-only continue).  
- A new “change designs” sheet.  
- Moving identity above the album.  
- Edit / manage album using this strip.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
