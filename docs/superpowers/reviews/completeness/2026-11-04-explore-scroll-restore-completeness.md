# Feature Completeness Review — Explore back lands on opened collection

**Date:** 2026-11-04  
**Module / ask:** From Explore, open a collection, press Back → land on **that same collection card** in the feed (not the top).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Bug fix / expected navigation continuity. No new chrome.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader deep in Buying opens a pack to check designs; Back must return to that pack so discovery continues without re-scrolling. |
| UX Designer | No new UI. Same Back. Success = that pack card readable in the shell scrollport. Filter / Stories / side change still starts fresh at top. |
| Solution Architect | Explore unmounts on `/collections/:id` (sibling routes + `RouteBody` pathname key). Persist in-memory: `focusCollectionId`, `homeTailOpen`, `scrollTop`. Restore by scrolling to `explore-collection-open-${id}` (photos id fallback). Do not keep Explore mounted or change rise animation. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — in-memory session like `exploreStagingSession`; shell `main.ekum-shell-scroll`; existing card test ids.  
2. **Duplicates another feature?** No — fills missing return continuity.  
3. **Should reuse an existing workflow?** Reuse album open paths; do not invent a second open.  
4. **Naming matches the app?** No new copy.  
5. **Units?** N/A.

**Philosophy conflict?** No — fewer taps; stay oriented.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Note focus on Explore→album open; restore on remount |
| Business rules | OK | Clear on story / show / side / category / city change |
| Workflows | OK | Back (`navigate(-1)`) and Explore tab return both remount Explore |
| Edge cases | OK | Load more expansion restored so deep packs stay in DOM; scrollTop fallback if node missing |
| Permissions | N/A | |
| User states | OK | Full reload → top (session cleared) |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Module memory only |
| Mobile interactions | OK | Scroll inside shell main; BM-07 unchanged |
| First glance (BM-11) | OK | No new chrome; card stays the job |
| Units | N/A | |
| Accessibility | OK | Same Back control |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Client: `exploreScrollSession` + note on Explore collection open + restore on `ExplorePage` remount (`homeTailOpen` seed + scroll to pack card).  
- Docs: explore.md one line; gap matrix.  
- Unit: session helpers.  
- Trader-eye: mid-feed open → Back → same pack; Load more deep pack → Back → same pack.

## Explicitly deferred / rejected

- Nested Explore keep-alive / changing `RouteBody` key.  
- React Router window `ScrollRestoration`.  
- Persisting restore across full page reload.
