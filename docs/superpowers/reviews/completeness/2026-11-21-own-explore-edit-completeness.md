# Feature Completeness Review — Own Explore Edit post / Edit repost

**Date:** 2026-11-21  
**Module / ask:** Own Explore cards open shared RepostSheet Edit when Trading is on; not-allowed stays gray Repost; Save targets that card’s collection only  
**Anchors:** `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Redesign of “own post always grays Message and Repost.” Message stays gray on own. Repost becomes Edit when allowed.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to change Who / rates on their own live Explore packs without hunting album ⋯. Same Save sheet as peer Edit. Not-allowed must stay gray Repost (never Edit on a dead control). |
| UX Designer | Shared `RepostSheet` only. Titles: **Edit post** (own original), **Edit repost** (own child / peer child). Album Add/Photos stay under album ⋯ / manage. Instagram icon row language unchanged (done vs Repost). |
| Solution Architect | Own → `editCollectionId = collection.id`. Peer already-reposted → `viewerRepostCollectionId`. Never resolve own via `repost-of` to upstream. Stamp `isRepostChild` for title only. Trading OFF / zero-eligible / look-only → gray Repost. Curate still gates member adds; settings-only grandfather intact. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — reuse Explore feed icons + `RepostSheet` peer Edit path.  
2. **Duplicates another feature?** No — album manage stays separate.  
3. **Should reuse an existing workflow?** Yes — shared RepostSheet Who / Show rates / pricing.  
4. **Naming matches the app?** Edit post / Edit repost / Repost; Message stays gray on own.  
5. **Units?** N/A — no ₹ / qty string change in this slice.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Own original / own child / peer create / peer edit |
| Business rules | OK | Identity lock; no duplicate create on Save |
| Workflows | OK | Prefill → Save updates target |
| Edge cases | OK | Trading OFF; not-allowed gray; no upstream mutate |
| Permissions | OK | Curate for adds; pricing / forward ceilings unchanged |
| User states | OK | Own vs peer; Trading on/off |
| Notifications | N/A | |
| Error handling | OK | Existing sheet errors |
| Scalability | N/A | |
| Mobile interactions | OK | Existing sheet clearance |
| First glance (BM-11) | OK | 390px + desktop trader-eye Meena/Ravi |
| Units | N/A | |
| Accessibility | OK | aria-label Edit post / Edit repost / Repost |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred: own solo design tiles stay gray Repost (collections / You packs first).

---

## Approved scope for this slice

- Stamp `isRepostChild` on Explore `CollectionCard` (title only).  
- `canOpenExploreRepostEdit`: own + Trading + collection → Edit; peer `viewerReposted` + Trading → Edit; else no.  
- ExploreFeedActions: allowed → Edit post / Edit repost + done icon; not allowed → gray **Repost**.  
- Own `editCollectionId = collection.id`; peer keeps `viewerRepostCollectionId` / resolve.  
- RepostSheet title Edit post vs Edit repost; Save updates target; no album Add/Photos.  
- Replace explore.md own grey-Repost rule.  
- Unit matrix + Meena/Ravi localhost 390px and desktop.

## Explicitly deferred / rejected

- Own solo Explore design tiles → Edit post (prefer packs).  
- Second edit surface / album manage in RepostSheet.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
