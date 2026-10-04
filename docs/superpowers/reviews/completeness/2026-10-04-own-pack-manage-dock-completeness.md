# Feature Completeness Review — Own pack manage dock

**Date:** 2026-10-04  
**Module / ask:** On own collection viewer and Edit collection, hide bottom nav; sticky dock **Add new designs** · **Replace whole collection**; selecting → **Select all** · **Clear** and dock **Delete** · **Remove from collection** (confirm when design is in other packs). Hide owner shop name card.  
**Anchors:** `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Own pack job is manage membership, not trade. Visitor Ask/Order stays. Delete vs Remove is the hard fork traders already think. |
| UX Designer | One bottom band; nav gone. Idle Add / Replace; select Delete / Remove. No own name card. Select all · Clear float like other albums. |
| Solution Architect | Remove = `PUT` membership. Delete = product delete when sole pack; multi-pack sheet: all collections vs only this. Foreign curated: Remove only. |

---

## Platform consistency (required)

1. **Existing patterns?** Portaled dock + `usePageOwnsBottomBand`; SelectAllFloat; Add designs sheet from editor.  
2. **Duplicates another feature?** No — replaces owner Update/Publish dock on edit with membership dock; Publish stays in ⋯ / header.  
3. **Should reuse an existing workflow?** Add designs camera/library; setProducts.  
4. **Naming matches the app?** Add new designs · Replace whole collection · Remove from collection · Delete.

**Philosophy conflict?** No — one job per screen; owner ≠ visitor dock.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Idle + select docks both surfaces |
| Business rules | OK | Remove membership; Delete product / confirm |
| Workflows | OK | Replace = clear then pick |
| Edge cases | OK | Last live design drafts pack; foreign no Delete |
| Permissions | OK | Own company only |
| User states | OK | Draft / published editor |
| Notifications | N/A | |
| Error handling | OK | Toast on fail |
| Scalability | OK | Batch other-pack count |
| Mobile interactions | OK | BM-07 clearance under dock |
| First glance (BM-11) | OK | Manage verbs loud; no own shop card |
| Accessibility | OK | Buttons labeled |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Own viewer + Edit: manage dock; nav hidden; hide owner CompanyRow.
- Pack-local select (not traveling Order selection on own manage).
- Add / Replace via existing Add designs path.
- Delete confirm when design in other owned packs; Remove = membership.
- Docs + units.

## Explicitly deferred / rejected

- Visitor chrome changes.
- Hard-delete whole pack from this dock.
- Changing Publish sheet fields.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units)
