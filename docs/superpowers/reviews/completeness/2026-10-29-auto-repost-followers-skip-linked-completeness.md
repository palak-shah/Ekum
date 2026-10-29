# Feature Completeness Review — Auto-repost Followers skip Direct Link buyers

**Date:** 2026-10-29  
**Module / ask:** When T1 later publishes an auto-repost hop to Followers, B2 (follower, no Direct Link) sees T1’s post. B1 (already auto-delivered) does not see that hop again.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`  
**Disposition:** Proceed (redesign of “widen to Followers, Buyer 1 still sees the same card”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-auto-repost-selected-buyer-completeness.md` or `2026-10-28-auto-repost-future-only-supplier-completeness.md`. Auto-repost still publishes **Selected** to Direct Link buyers. This review redesigns the **manual Followers** step that reused one pack and cleared `audienceCompanyIds`, so Buyer 1 saw the hop again on Explore.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct Link T1 × S1 × B1. S1 publishes → T1 auto pack Selected to B1 (`From {S1}`). B2 follows T1, no link — does not see the auto hop. T1 later **manually publishes** that hop to Followers: **same Collection id**. B2 sees **T1’s post**. B1 does not see T1’s hop again. B2 sees S1’s original only if they also follow S1 — that is not this hop. Several Direct Link buyers → one pack; skip all of them after Followers. |
| UX Designer | No new chrome. Same Explore card (shop = T1, mill credit `From {S1}`). B1 already had the card from Selected; hiding it on Followers is the job, not a second post or a “you already saw this” badge. Owner (T1) still sees own pack on You / own Explore. |
| Solution Architect | Keep delivered `audienceCompanyIds` when automatic Selected widens to Followers. Explore Followers query: follower **except** those ids. Empty ids stay visible to all followers (ordinary Followers packs). `canDiscoverCollection` matches so detail / shop / search / saved do not leak. Bump `exploreActivityAt` on widen stays — B2 needs the new shelf. No schema. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Collection id, Selected skip-list reused as Followers exception list, `From {shop}`, no role badges. Yes.  
2. **Duplicates another feature?** No second post, no second pipeline.  
3. **Should reuse an existing workflow?** Yes: `publish` widen + `audienceVisibilityOr` / `canDiscoverCollection`.  
4. **Naming matches the app?** Direct links. Followers. `From {shop}` — not Seller/Buyer on the card.  
5. **Units?** No ₹/qty string change. Pack Explore card stays the collection.

**Philosophy conflict?** The 2026-10-28 Selected-buyer review said T2 sees two posts after Followers, and left Buyer 1 seeing the same card on Explore. That fights “already delivered — don’t show the hop again.” **Redesign** Followers visibility for those ids; keep one pack and mill credit. Not a silent drift.

---

## Locked examples

**Auto (unchanged).** T1 × S1 × B1. S1 publishes. T1 auto pack: `audience=selected`, `audienceCompanyIds=[B1]`, `From {S1}`. B1 sees T1’s card. B2 (follows T1, no link) does not.

**Several buyers.** T1 × S1 × B1 and T1 × S1 × B2 → one pack, Selected those buyers. After Followers, skip that list.

**Manual Followers.** T1 publishes that hop to Followers. Same Collection id. Keep delivered buyer ids on the row. Explore: followers **except** those ids. **B2 sees T1’s post.** B1 does not see it again. Owner still sees own pack.

**Ordinary Followers.** Draft → Followers still stores `[]`. Empty skip list: all allowed followers see it.

**Already Followers (Example C).** Do not shrink a pack that was Followers **before** auto. Empty ids stay empty.

**Republish Followers** on an automatic hop that already kept ids: keep those ids (do not wipe on a second Followers save).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Keep ids on auto Selected → Followers; hide those viewers on Explore Followers |
| Business rules | OK | B2 sees T1’s post; B1 skipped; one Collection id; owner unhidden |
| Workflows | OK | Same Repost / publish path; no new screen |
| Edge cases | OK | Empty ids unchanged; Example C; keep ids on Followers republish; several buyers |
| Permissions | OK | Follow still required; Selected list is skip, not a grant |
| User states | OK | B1 already had the Selected card; B2 first sees it at Followers |
| Notifications | OK | Bump shelf for B2; B1 is out of the query (not a second notify) |
| Error handling | N/A | Same publish errors |
| Scalability | OK | Same Prisma `has` / `NOT has` on existing array |
| Mobile interactions | OK | No new chrome; feed cards unchanged (BM-07 N/A) |
| First glance (BM-11) | OK | B1 feed vs B2 feed; same card language |
| Units (order / dispatch / Rate per) | N/A | No unit string change |
| Accessibility | OK | No new control |
| Platform consistency | OK | Selected skip-list + Followers query; no role badges |

---

## Gaps

### G-001 — Followers widen cleared delivered buyers

| Field | Content |
|-------|---------|
| Gap | `publish` set `audienceCompanyIds=[]` unless audience was Selected. After Followers, B1 (if they follow T1) saw the hop again. |
| Why it matters | The mill post was already auto-delivered to B1. A second Explore card of the same T1 pack is noise and fights Direct Link privacy of the first hop. |
| Impact if ignored | Buyer 1’s Explore shows T1’s hop twice in spirit (Selected then Followers); B2 is correct but B1 is not. |
| Recommendation | Keep delivered ids; Explore Followers exclude them. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + `explore.md` Auto-repost row + gap matrix. Do not rewrite 2026-10-28 auto-repost files.  
- `publish`: automatic origin + prior Selected + next Followers → keep `audienceCompanyIds`. Ordinary Followers still `[]`. Keep ids if an automatic hop is already Followers with a skip list (republish).  
- `canDiscoverCollection` / `audienceVisibilityOr`: Followers + non-empty ids → following and not in the list. Owner unchanged. Empty list: all followers.  
- Units + e2e: B1 Explore skip after Followers; B2 sees T1’s hop; still one Meena pack.  
- Trader-eye: B1 Explore vs B2 Explore (phone width).

## Explicitly deferred / rejected

- Solo **design** market posts (Explore design cards are not packs; a one-design auto pack would be the wrong card). Catalogs already hop.  
- Cross-publisher feed collapse by canonical root.  
- New card chrome / “already delivered” badge.  
- Schema change.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
