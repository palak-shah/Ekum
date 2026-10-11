# Feature Completeness Review — Explore Repost once + done icon

**Date:** 2026-10-11  
**Module / ask:** Explore feed Repost: block own posts; one Repost per peer post; after success show Instagram-style dual-arrow+check (full ink, not grayed); tap on done is status-only.  
**Anchors:** `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Instagram: you don’t repost yourself; once you’ve reposted a peer post, the control becomes a “done” check — not a gray dead control. Ekum Repost still publishes under my name. |
| UX Designer | Own → Message + Repost gray. Peer done → `RepostDoneIcon` at ink (not opacity-40). Bookmark/Share stay live on own. |
| Solution Architect | Stamp `repostSourceCollectionId` / `repostSourceProductId` on the created Collection; unique per owner+source; feed `viewerReposted` via exists batch. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Explore icon row + Repost sheet.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Repost sheet unchanged except create stamps.  
4. **Naming matches the app?** Repost / Reposted.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Once per source post |
| Business rules | OK | Own blocked; allowForward / Trading unchanged |
| Workflows | OK | Sheet → create stamp → publish |
| Edge cases | OK | Second create → ALREADY_REPOSTED |
| Permissions | OK | Owner company only stamps |
| User states | OK | viewerReposted on cards |
| Notifications | N/A | |
| Error handling | OK | Toast on conflict |
| Scalability | OK | Batch exists for page ids |
| Mobile interactions | OK | Icon row |
| First glance (BM-11) | OK | Done ≠ gray |
| Accessibility | OK | aria-label Reposted |
| Platform consistency | OK | Instagram judgment |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Schema stamps + unique partial indexes  
- Create DTO + service reject  
- Feed/card `viewerReposted`  
- Icons + ExploreFeedActions  
- Docs + unit tests  

## Explicitly deferred / rejected

- Cart / Selection dock Repost  
- Undo from feed  
- Stamping non-Repost curate  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
