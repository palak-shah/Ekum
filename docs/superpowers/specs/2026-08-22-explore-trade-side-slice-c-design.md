# Explore trade-side + received packs (Slice C)

**Date:** 2026-08-22  
**Status:** Approved  
**Anchors:** [explore.md](../../features/explore.md), [home.md](../../features/home.md), [00-concepts.md](../../features/00-concepts.md), [2026-08-22-explore-trade-side-completeness.md](../reviews/completeness/2026-08-22-explore-trade-side-completeness.md)

## Problem

Explore is one mixed market. Dual-network companies cannot switch **Buying** (followed + packs sent to them) vs **Selling** (who may buy). Home has no light cue for new curated packs. Stories still include market suggestions.

## Product promise

**All is the market. Buying is people you follow and packs sent to you. Selling is buyers — never My Catalog. Home only taps you when a curated pack just landed.**

## Chrome

Keep Explore **search + filter square** as the one tight row.

Under it, Orders-style `FilterRail`:

```
[ All ]  [ Buying ]  [ Selling ]
```

| Control | Values | URL |
|---------|--------|-----|
| Trade-side | All (default) · Buying · Selling | `?side=all\|buying\|selling` (omit = All) |
| Content type | All / Collections / Designs / Businesses | existing `?show=` in the filter menu |

Do not replace content **All** in the Show menu. Keep prior home data visible while `side` changes (`placeholderData` / deferred).

## Side contents

| Side | Stories | Posts | Businesses |
|------|---------|-------|------------|
| **All** | Tightened rail | Today’s mixed **New for you** | Businesses for you + Buyers for you (if selling) |
| **Buying** | Tightened rail | **From people you follow** then **Received** (day → business → albums) | Businesses for you. Empty follow shelf still shows discovery |
| **Selling** | Hide if empty | None | **Buyers for you** only. Not My Catalog |

Content `show=` still filters type on All / Buying. Selling + Designs/Collections: empty posts, buyers remain.

## Received vs following vs market

| Bucket | What |
|--------|------|
| **Market** | Everyone-audience posts in All ranking |
| **Following-first** | Posts from companies the viewer **follows** (`fromNetwork` / `designsFromNetwork`) |
| **Received pack** | Published **collection** the viewer can see because audience is **connections / followers / selected**, **or** they are a `BroadcastRecipient` of a collection card (`referenceId`) |

Everyone-only posts are **not** received unless also broadcast to this company.

**Curated:** any member `product.companyId !== collection.companyId`. No Prisma flag.

**Received browse:** group by **UTC date** of `exploreActivityAt` (fallback `updatedAt`), then publisher. Newest day first.

## Home

Not a day/business tree.

`receivedCurated`: last **7 days**, cap **5**, curated received only.

Row: pack name · publisher · relative day → `/collections/:id`. Section **New packs** with “See all →” to `/explore?side=buying`. Show on busy and quiet Home. Does not count as a Needs verb.

## Stories

Company appears only if viewer **follows or is connected** and that company has a **published** post visible to the viewer. Rank by newest post. Hide rail when empty. Do not seed from suggested / Buyers / market-only `forYou`.

## API

`GET /explore/home` accepts `side` (`all` \| `buying` \| `selling`).

`ExploreHomeView` adds:

- `receivedByDay` — populated on **buying**; `[]` otherwise
- `receivedCurated` — always (Home)

Existing shelves unchanged. `buildStories` tightened for every side.

## Non-goals

Slice D, Send-hold, sticky search, Home share inbox, trader badges, Select all on Explore.

## Tests

| Track | What |
|-------|------|
| Unit | Directed-audience predicate; UTC day grouping; curated detect; Stories eligibility; Home row copy |
| API | home() Stories exclude suggestions; received includes selected + broadcast, excludes Everyone-only |
| Web | parse `side`; Buying shows follow then received; Selling hides follow/received |
| Functional | Explore chips visible; existing browse journey still opens Wedding Edit |

## Success

Meena opens Buying and sees followed posts above packs sent to her, grouped by day. Ravi opens Selling and only sees buyers. Home shows a short New packs strip when a curated album lands — not a second Explore.
