# Feature Completeness Review — Explore own packs must not hide other businesses

**Date:** 2026-11-02  
**Module / ask:** Buying shows only **You**, Stories has no other shops, no **More posts**, letter placeholders instead of mill photos. Own publishes crowding peers off the ranking window is a **bug**.  
**Anchors:** `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Own live packs must stay on Buying / Stories **You**. They must **not** empty the peer list. Followed / interest shops belong in the first window. |
| UX Designer | Stories **You** first, then other rings. First 12: at most two newest own packs, then others. Extra own after **More posts**. Letter tile = empty `previewImages`; mill photos return when mill posts return. |
| Solution Architect | Exclude viewer from `feed()` / `collections()` other lanes. Own only via `ownLiveCollections`. Cap pin at 2 in the first 12. Stories built from the same peer sections. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — pin own so follows cannot *push you out*. Inverse (you push others out) is the bug.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `ownLiveCollections` + ranking window.  
4. **Naming matches the app?** You / More posts.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Peers in first 12; Stories others when follow/connected |
| Business rules | OK | Stories others still follow/connected |
| Workflows | OK | Buying home + first-paint feed |
| Edge cases | OK | No follows still shows public/interest; many own packs |
| Permissions | N/A | |
| User states | OK | Dual Buying |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Same rank window |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | Other shops visible without hunting |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Exclude self from Explore ranking queries.  
- First 12: ≤2 newest own + peers. Remaining own behind More posts.  
- Stories others from those peer sections.  
- Remove leftover debug ingest in `feed()`.  
- If mill posts return and still have empty `previewImages`, stamp member thumbs (cover fallback only if members have none — later if still blank).

## Explicitly deferred / rejected

- Showing unfollowed strangers on Stories (still follow/connected).  
- Using pack cover as the Explore strip when members have thumbs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
