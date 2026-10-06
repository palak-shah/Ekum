# Feature Completeness Review — Edit collection images first

**Date:** 2026-10-06  
**Module / ask:** Edit collection must show design images first (same as New collection / Add designs), then pack identity fields.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Update pack job starts with the designs. Name/rate are secondary on edit. |
| UX Designer | New collection already: media → identity. Edit currently identity → media. Match create. |
| Solution Architect | Reorder JSX in CollectionEditorPage edit branch only. |

---

## Platform consistency (required)

1. **Existing patterns?** Create flow: photos first.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same identityFields block, moved down.  
4. **Naming matches the app?** Unchanged.

**Philosophy conflict?** No — one job first (the designs).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same fields, new order |
| Workflows | OK | Grid → Add designs → identity |
| Mobile interactions | OK | First screenful is photos |
| First glance (BM-11) | OK | Images loudest on Edit |
| Platform consistency | OK | Matches create |

---

## Approved scope

- Edit: **N designs** heading + grid + Add designs + tip, then identity fields.
- Docs lock.

## Explicitly deferred / rejected

- Changing create order (already images first).
