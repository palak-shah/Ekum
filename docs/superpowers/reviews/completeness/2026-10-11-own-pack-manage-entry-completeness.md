# Feature Completeness Review — Own pack manage entry + ⋯ items

**Date:** 2026-10-11  
**Module / ask:** Own collection album: bottom **Designs · Photos · Replace** dock only when opened to manage (You / ＋ / own shop via `location.state.packManage`); Explore own pack hides the dock. Owner ⋯ always includes **Add from existing designs** · **Add photos** · **Replace entire collection**.  
**Anchors:** `docs/features/collections.md`, Completeness 2026-10-04-own-pack-manage-dock  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Explore own pack is browse (feed job); manage membership is You / ＋ / own shop. Same actions via ⋯ everywhere for owner. |
| UX Designer | One URL `/collections/:id`; entry state gates the dock. Menu labels full; dock stays short. Everyday Share/Who first; manage trio; Edit last among non-destructive. |
| Solution Architect | `collectionOwnerManageDock({ isOwner, packManage })`; do not clear `packManage` on mount. Explore/chat/Saved omit state. |

---

## Platform consistency (required)

1. **Existing patterns?** OwnerPackManageDock + OwnerCollectionMoreSheet; location.state entry flags elsewhere.  
2. **Duplicates another feature?** No — entry-aware chrome only.  
3. **Should reuse an existing workflow?** Same Add / Replace handlers.  
4. **Naming matches the app?** Menu: Add from existing designs · Add photos · Replace entire collection; dock: Designs · Photos · Replace.

**Philosophy conflict?** No — one job per screen; Explore browse vs You manage.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Dock gated; ⋯ always has trio |
| Business rules | OK | Owner only |
| Workflows | OK | You/＋/own shop → packManage |
| Edge cases | OK | Chat/Saved/Explore no dock |
| Permissions | OK | isOwner |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 when dock shown |
| First glance (BM-11) | OK | Explore own pack not crowded by manage dock |
| Accessibility | OK | Menu labels |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- `packManage` state from manage entries; dock only when owner + packManage.
- Owner ⋯: Add from existing designs · Add photos · Replace entire collection.
- Docs + units.

## Explicitly deferred / rejected

- Changing dock short labels.
- Visitor ⋯ / Order dock.
- Edit page `/catalog/collections/:id` dock.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
