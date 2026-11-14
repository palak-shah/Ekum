# Feature Completeness Review — Followers skip-list vs album / Place access

**Date:** 2026-11-05  
**Module / ask:** Allowed followers hit “This collection isn't available” on Place and WhatsApp open for Followers-widened auto-repost hops that still list them on `audienceCompanyIds`.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/orders.md`, `docs/features/collections.md`  
**Disposition:** Redesign (of 2026-10-29 “detail must not leak” for Followers skip-list)

> Completeness keeps Ekum **coherent**. Explore hide ≠ revoke see / order rights.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Buyer follows trader (**I see theirs**). Auto-hop widened to Followers still lists Direct Link buyers on `audienceCompanyIds` so Explore does not show a second card. That list must not brick Place or share open. |
| UX Designer | Same album / Place path as ordinary Followers packs. Short diagnosable error copy when truly gone. |
| Solution Architect | Split: `audienceVisibilityOr` keeps `NOT has` for Explore; `canDiscoverCollection` / `canViewCollectionProducts` use Allowed follow only for Followers. Selected membership unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Followers = Allowed follow; Selected = list; Explore auto-repost skip for Direct Link buyers.  
2. **Duplicates another feature?** No — corrects over-applied skip.  
3. **Should reuse an existing workflow?** Yes — same discover/detail helpers; Explore query OR unchanged.  
4. **Naming matches the app?** Followers / Selected / Direct Link / Place.  
5. **Units?** N/A.

**Philosophy conflict?** Yes with 2026-10-29 “detail must not leak” for skip-list buyers → **Redesign:** skip = Explore shelf only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Split discover vs feed skip |
| Business rules | Gap | Followers access vs Explore hide |
| Workflows | Gap | Place + `/s/:token` → album |
| Edge cases | OK | Selected without membership still deny; mill source exclude |
| Permissions | Gap | Skip must not revoke follow rights |
| User states | OK | Allowed follow / unfollow |
| Notifications | N/A | |
| Error handling | Gap | Prefer API message on album error |
| Scalability | OK | |
| Mobile interactions | OK | BM-07 N/A |
| First glance (BM-11) | Gap | Red “isn't available” with follow rights |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Skip list blocks detail / Place

| Field | Content |
|-------|---------|
| Gap | `canDiscoverCollection` denied Followers when viewer ∈ `audienceCompanyIds`. |
| Why it matters | Allowed followers cannot Place or open WhatsApp-linked albums for Followers-widened hops. |
| Impact if ignored | Partial catalog: some packs work, auto-hops brick. |
| Recommendation | Followers access = following; Explore OR keeps NOT has. |
| Priority | Required before implementation |

### G-002 — Catch-all album error hides API reason

| Field | Content |
|-------|---------|
| Gap | CollectionViewer always shows “isn't available.” |
| Why it matters | Expired / gone / network look the same. |
| Recommendation | Prefer short API message when present. |
| Priority | Recommended enhancement |

---

## Approved scope for this slice

- Completeness Redesign + explore/orders docs + gap matrix.  
- `canDiscoverCollection` / products: Followers = following (no skip deny).  
- Keep Explore `audienceVisibilityOr` NOT has.  
- Album ErrorState prefers API message.  
- Units: discover allow for skip-list + following; Explore OR still excludes; Selected / mill exclude regression.  
- Trader-eye: Place + share open for Allowed follower on widened hop.

## Explicitly deferred / rejected

- 48h token creating Selected membership (separate dead-end slice may claim view grant).  
- Changing who appears on Explore for Direct Link buyers.  
- Rewriting confirmed orders.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
