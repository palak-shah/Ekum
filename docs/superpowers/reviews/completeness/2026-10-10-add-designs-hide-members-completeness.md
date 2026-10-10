# Feature Completeness Review — Add designs hide album members

**Date:** 2026-10-10  
**Module / ask:** Album / collection **Add designs** library sheet shows designs already in the album as selected but non-tappable — they get in the way of picking new ones.  
**Anchors:** `docs/features/collections.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Add designs is append-only. Already-in-album designs belong on the album (Select → Remove), not in the add picker. |
| UX Designer | Hide members in add mode. Quiet empty: “All your designs are already in this collection.” Replace still shows the full library. |
| Solution Architect | Shared `libraryDesignsForPicker` helper; viewer + editor sheets; unit coverage. No API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — library picker as sheet; Remove stays on album Select.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse picker; do not invent select-mode chrome here.  
4. **Naming matches the app?** Add designs · Replace designs · plain empty copy.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide members on add; Replace unchanged |
| Business rules | OK | Append vs replace |
| Workflows | OK | Remove via Select on album |
| Edge cases | OK | All members → empty why-line; search on remaining |
| Permissions | N/A | Owner sheet only |
| User states | OK | Empty library vs all already in |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet; no sticky clip |
| First glance (BM-11) | OK | Only addable designs |
| Accessibility | OK | Same tiles |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Hide current album members from **Add designs** library grid (viewer + editor).  
- **Replace designs** still lists the full library.  
- Empty when every library design is already a member.  
- Unit: `libraryDesignsForPicker`.  
- Lock in `docs/features/collections.md` + gap matrix.

## Explicitly deferred / rejected

- Using `SelectableMediaFrame` / album Select chrome in this sheet.  
- Deselect-to-remove from the Add sheet.
