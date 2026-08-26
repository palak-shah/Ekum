# Feature Completeness Review — Explore trade-side (Slice C)

**Date:** 2026-08-22  
**Module / ask:** Explore **All / Buying / Selling**, Following-first Buying, received packs (Home attention + Buying browse by day/business), Stories follow/connected + published  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/home.md`, `docs/superpowers/reviews/mvp-garmenthub-gap-matrix.md`, `docs/superpowers/reviews/feature-gap-matrix.md`  
**Disposition:** Proceed

> IA split already locked in product docs. Does not add a Trader role, badges, or a dense Home share inbox.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Dual-network companies need Buying (upstream / received) separate from Selling (buyers). All stays the mixed market. Home only flags new curated packs — browse lives on Explore Buying. |
| UX Designer | Trade-side is an everyday job: Orders-style `FilterRail` under search. Content type stays in the filter square. Two “All”s are OK because one is a chip and one is inside Show. Section titles change with the job (follow vs received vs buyers). |
| Solution Architect | Reuse `ExploreHomeView` + `home()`. Add `side` query, `receivedByDay` / `receivedCurated`, tighten `buildStories`. Directed audience + broadcast recipients — no new Prisma table. Curated = foreign member product. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — `FilterRail` + `Chip` (Orders buy/sell); Explore search + filter square; album cards; Home attention rows.  
2. **Duplicates another feature?** No. Notifications stay on the bell. Saved is a hub, not received browse.  
3. **Should reuse an existing workflow?** Yes — `fromNetwork` / `lookingForWhatYouSell` / collection cards / Home Need-style rows.  
4. **Naming matches the app?** **All · Buying · Selling**. **From people you follow**. **Received**. **Buyers for you**. **New packs**. No Trader/Seller badges, no “shares analytics.”

**Philosophy conflict?** No. Rejected: Home-only day/trader tree; Selling = My Catalog; Stories from market suggestions.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Three sides; Buying splits follow vs received; Selling = buyers |
| Business rules | OK | Directed audience ≠ Everyone market; curated derived |
| Workflows | OK | Tap album → viewer; Story filter unchanged |
| Edge cases | OK | No follows; no received; not selling; empty Stories hide rail |
| Permissions | OK | Audience + curated-source exclude unchanged |
| User states | OK | Buying off still can open Buying (discovery). Selling empty if `lookingForWhatYouSell` null |
| Notifications | N/A | Bell unchanged |
| Error handling | OK | Existing Explore load error |
| Scalability | OK | Received query capped; Home 5 / 7 days |
| Mobile interactions | OK | Rail is in-flow (not a second sticky bar). BM-07: last card above bottom nav + select dock |
| Accessibility | OK | Chip buttons; day headers as headings |
| Platform consistency | OK | Asked: rail vs bury-in-menu — rail matches Orders |

---

## Gaps

### G-001 — Two “All” labels

| Field | Content |
|-------|---------|
| Gap | Trade-side **All** and Show **All** (content) |
| Why it matters | First-time trader might confuse job vs type |
| Impact if ignored | Mild; Show All lives in the filter menu |
| Recommendation | Keep both. URL `?side=` vs `?show=`. Do not rename content All. |
| Priority | Recommended enhancement (accepted) |

### G-002 — Broadcast Everyone packs

| Field | Content |
|-------|---------|
| Gap | Everyone + broadcast still counts as received via recipient row |
| Why it matters | Directed “sent to you” includes compose-once send |
| Impact if ignored | Broadcast albums vanish from Received |
| Recommendation | Union directed audience **or** `BroadcastRecipient` + collection `referenceId` |
| Priority | Required before implementation |

### G-003 — Sticky Explore search (UX list 2)

| Field | Content |
|-------|---------|
| Gap | Search chrome still scrolls away |
| Why it matters | Separate ask |
| Impact if ignored | None for Slice C |
| Recommendation | Own Completeness later |
| Priority | Future improvement |

---

## Approved scope for this slice

- Explore `FilterRail`: All (default) · Buying · Selling (`?side=`).
- Content type stays in filter square (`?show=`).
- Buying: Following-first shelf + Received by UTC day → business → albums; Businesses for you; Stories (tightened).
- Selling: Buyers for you only.
- All: today’s mixed New for you + both business shelves; Stories tightened.
- Home: up to 5 new **curated** received packs (7 days) — light rows, not the day tree.
- Docs + gap matrix + units; cheap `@explore` chip assertion if practical.

## Explicitly deferred / rejected

- Slice D anonymity / multi-hop  
- Send-hold  
- Sticky Explore search  
- Dense Home day/trader analytics (Rejected)  
- Trader badges  
- Select all on Explore  

## Sign-off

Required gaps closed or deferred in writing: Yes (G-002 in implement; G-001 accepted; G-003 deferred)  
Ready for implementation / `@functional` journeys: Yes  
