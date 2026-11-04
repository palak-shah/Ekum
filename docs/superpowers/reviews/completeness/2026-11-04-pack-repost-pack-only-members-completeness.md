# Feature Completeness Review — Pack Repost includes collection-only designs

**Date:** 2026-11-04  
**Module / ask:** Explore pack Repost skipped members that are Published only inside a collection (`postedToMarketAt` null) even when allowForward / Share is on. Trader rule: on Explore as part of a collection (not as a solo design) still means curatable when reposting that pack.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/saved.md`, `docs/features/explore.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Solo Explore tile is optional. Pack on Explore is enough listing for Repost of that pack. |
| UX Designer | Stop false Skipped for pack-only members; plain skip copy when a real block remains. |
| Solution Architect | Optional `sourceCollectionId` on curate-check / setProducts widens discoverability for that pack’s Published members. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — curate-check ceiling, RepostSkipSection, allowForward / look-only.  
2. **Duplicates another feature?** No — corrects wrong gate.  
3. **Should reuse an existing workflow?** Reuse pack viewability; do not force `postedToMarketAt` on every pack member.  
4. **Naming matches the app?** Plain trader skip copy.  
5. **Units?** N/A.

**Philosophy conflict?** No — collection-on-Explore is intentional listing.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pack Repost includes visible pack members without solo stamp |
| Business rules | OK | Still enforce allowForward, look-only, block, audience ceiling |
| Workflows | OK | Explore pack Repost; Cart without source pack unchanged |
| Edge cases | OK | Missing/inaccessible source pack → no widen |
| Permissions | OK | Viewer must be able to see pack products |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | One pack member query |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | No false Skipped (2) when all pack designs allowed |
| Units | N/A | |
| Accessibility | OK | Under-bar reason readable |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- API: `sourceCollectionId` on curate-check + setProducts unlocks Published members of that viewable pack without `postedToMarketAt`.  
- Client: RepostSheet passes pack id; plainer skip copy.  
- Docs: saved.md / explore note.

## Explicitly deferred / rejected

- Stamping every pack member with `postedToMarketAt` on pack publish.  
- Changing Cart multi-supplier curate without a source pack.
