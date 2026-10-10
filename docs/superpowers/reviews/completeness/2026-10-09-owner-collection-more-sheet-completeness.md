# Feature Completeness Review — Owner collection ⋯ bottom sheet

**Date:** 2026-10-09  
**Module / ask:** Client prototype: owner ⋯ on album opens a bottom sheet (collection title) with icon + text: Share this collection · Who has access · Add photos · Edit collection details.  
**Anchors:** `docs/features/collections.md`, kit `Sheet`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Manage jobs in one place; dock Add remains for everyday add while Selecting is off. |
| UX Designer | Bottom sheet (not top popover) — matches prototype + kit. Quiet icon then label. Visitor ⋯ stays Message · Share · Bookmark. |
| Solution Architect | Share = existing album sheet. Who = editor with `openPublish`. Add photos = editor with `openDesignPicker` (already opens photos). Edit = editor. |

## Platform consistency

1. Kit Sheet; icon+text rows like SettingsDomainCard / GroupInfo media.  
2. No new share API.  
3. Reuse editor boot states.  
4. Prototype copy.

**Philosophy conflict?** No.

## Approved scope

- Owner ⋯ → bottom Sheet titled with collection name.
- Four rows (icon + text): Share this collection · Who has access · Add photos · Edit collection details.
- Drop Bookmark from owner ⋯ (still available elsewhere if bookmarked from visitor flows).
- Visitor ⋯ unchanged (dropdown or later).

## Explicitly deferred

- Moving Select into the header beside ⋯.
- Icon+text visitor sheet.
- Putting Publish / Hide / Archive into this sheet (stay on editor ⋯).

## Sign-off

Ready for implementation / unit on sheet rows + boot navigations.
