# Feature Completeness Review — Edit dock is Update only

**Date:** 2026-10-06  
**Module / ask:** Edit collection sticky dock should be **Update** only. Drop the peer **Add designs** — that door already lives on the page.  
**Anchors:** `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two Add designs (page + dock) is a second path. Edit job at the bottom is **save**. |
| UX Designer | Full-width Update. Page dashed **Add designs** stays. Viewer dock unchanged (no in-page add). |
| Solution Architect | `OwnerPackManageDock` when `onUpdate`: single primary button. |

---

## Platform consistency (required)

1. **Existing patterns?** One primary dock CTA (Create & Publish; viewer Add · Replace is a different surface).  
2. **Duplicates another feature?** Yes — dock Add duplicates in-page Add. Removing it.  
3. **Should reuse an existing workflow?** In-page Add designs chooser.  
4. **Naming matches the app?** **Update**.

**Philosophy conflict?** No — keep the shorter path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Add still on page |
| Workflows | OK | After replace, Update saves |
| First glance (BM-11) | OK | One loud dock job |
| Platform consistency | OK | |

---

## Approved scope

- Edit idle dock: **Update** only (full width).
- Viewer idle dock unchanged.
- Selecting dock unchanged.
- Docs + unit.

## Explicitly deferred / rejected

- Removing in-page Add designs.
