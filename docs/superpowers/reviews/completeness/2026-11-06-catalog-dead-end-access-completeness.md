# Feature Completeness Review — Catalog dead ends (share / Explore / Place)

**Date:** 2026-11-06  
**Module / ask:** Stop red no-action “isn't available” when the trader should see Ask / Request access, or when they already have see rights. Inventory signed off in plan `catalog_dead-end_inventory`.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed (Redesign of 2026-10-29 “detail must not leak” for Followers skip-list)

> Completeness keeps Ekum **coherent**. Red ErrorState with no next step is not a product pass.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Guest WhatsApp → Request access / Login must land somewhere useful. Allowed follow must open Followers packs (Place + deep link). Explore can still hide a second auto-repost card for Direct Link buyers. |
| UX Designer | Reuse album Ask + shop Request access. Never leave a lone red banner. Distinguish expired link vs gone vs ask. |
| Solution Architect | Explore skip stays in `audienceVisibilityOr`. `canDiscoverCollection` follows Allowed follow for Followers. Share claim → view grant. Soft shell (products null) instead of 404 when pack is live but not yet granted. DesignAlbum chat opens designs. |

---

## Platform consistency (required)

1. **Existing patterns?** Ask-to-see pack card; shop Request access; CollectionViewGrant; 48h `/s/:token`.  
2. **Duplicates another feature?** No — wires share into grant/Ask.  
3. **Should reuse an existing workflow?** Yes — view request + grant; Explore feed skip unchanged.  
4. **Naming matches the app?** Request access / Ask to see this pack.  
5. **Units?** N/A.

**Philosophy conflict?** 2026-10-29 said detail must not leak to skip-list buyers. That fights “I follow and place.” **Redesign:** skip = Explore shelf only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Soft shell + share claim + skip-list split + DesignAlbum |
| Business rules | Gap | Followers access vs Explore hide |
| Workflows | Gap | Guest Request access → login → claim/Ask |
| Edge cases | OK | Blocked / draft / expired still 404 |
| Permissions | Gap | Token claim grant; soft shell not blocked |
| User states | OK | Guest / auth / pending ask |
| Notifications | OK | Existing view-request notify |
| Error handling | Gap | Actionable errors |
| Scalability | OK | Claim upsert grant |
| Mobile interactions | OK | Same sheets; BM-07 N/A |
| First glance (BM-11) | Gap | Red banner with no verb |
| Units | N/A | |
| Accessibility | OK | Button labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Followers skip list blocks detail / Place

| Field | Content |
|-------|---------|
| Gap | `canDiscoverCollection` denies Followers when viewer ∈ `audienceCompanyIds`. |
| Why it matters | Allowed followers hit “not available” on Place and share open. |
| Recommendation | Followers access = following; Explore query keeps NOT has. |
| Priority | Required before implementation |

### G-002 — Share token discarded after login

| Field | Content |
|-------|---------|
| Gap | Auth `/s/:token` redirects without redeem. |
| Recommendation | Authenticated claim → collection view grant; then open album. |
| Priority | Required before implementation |

### G-003 — 404 hides Ask UI

| Field | Content |
|-------|---------|
| Gap | Audience deny throws NOT_FOUND. |
| Recommendation | Live published + not blocked → soft shell (`products=null`) so Ask shows. |
| Priority | Required before implementation |

### G-004 — DesignAlbum chat not authorized on product detail

| Field | Content |
|-------|---------|
| Gap | Only ProductCard chat unlocks design detail. |
| Recommendation | Treat DesignAlbum metadata productIds like a chat share. |
| Priority | Required before implementation |

### G-005 — Destination ErrorState has no CTA

| Field | Content |
|-------|---------|
| Gap | Collection/design ErrorState is red only. |
| Recommendation | Soft responses use Ask; true gone/expired keep short copy + Back / Home where useful; Repost locked preview links Open. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + docs (explore auto-repost skip = feed only; share claim; soft shell).  
- `canDiscoverCollection` Followers = following; Explore OR unchanged.  
- `POST /share-links/:token/claim` → collection view grant; landing uses claim.  
- Soft shell for live published collections (and soft design preview) when access missing.  
- DesignAlbum chat access for product detail.  
- Actionable ErrorState / Repost locked preview when possible.  
- Units + gap matrix.

## Explicitly deferred / rejected

- Permanent open catalog for guests (Everyone).  
- Share claim auto-Allow without token (must have valid 48h token).  
- Order/thread “isn't available” pages outside catalog.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
