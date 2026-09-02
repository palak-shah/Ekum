# Feature Completeness Review — Explore feed Follow

**Date:** 2026-08-26  
**Module / ask:** Follow button on Explore collection/design feed cards for strangers viewing discoverable posts.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Feed = **Follow only**. Connection stays Request access on profile / approve incoming request. Follow is instant (not a request).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Everyone posts are supplier reach; one-tap Follow converts viewers without profile detour. |
| UX Designer | Single accent **Follow** in card header; hidden when following/connected/select mode. |
| Solution Architect | Client-side relationship from existing `/follows`, `/connections`; `POST /follows` only on feed. |

---

## Platform consistency

1. **Existing patterns?** Same Follow API as company profile; compact accent link style on Explore cards.  
2. **Duplicates?** No — profile still has Follow toggle + Request access.  
3. **Reuse?** Trust ladder step 1 only on feed.  
4. **Naming?** **Follow** — not Connect / Seller/Buyer.

**Philosophy conflict?** No.

---

## Approved scope

- `ExploreFeedFollowAction` on `OpportunityCollectionCard` / `OpportunityDesignCard`
- `useExploreCompanyRelationships` hook
- Docs + unit tests

## Deferred

- Request access on feed card
- Request access quick action on Followers list
- Follow notification to publisher

## Sign-off

Proceed.
