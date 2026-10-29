# Feature Completeness Review — Auto-repost Selected linked buyer

**Date:** 2026-10-28  
**Module / ask:** Direct Link auto-repost audience is the linked buyer(s) only (Selected), not the trader’s Followers. Manual Followers Repost reuses the same pack. Trader 2 following mill + trader sees two posts only after that manual publish.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`  
**Disposition:** Redesign of auto-repost audience, then **Proceed** for this slice

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-direct-links-network-completeness.md` (Network IA + uniqueness) or `2026-10-28-direct-link-order-workflow-completeness.md` (mixed Place). This review **redesigns** the Network lock that auto-repost publishes to Followers. It closes G-007 (overshare to all trader followers) from the mixed-Place review.

**Successor (same day):** create-time delivery of live mill packs is redesigned in `2026-10-28-auto-repost-future-only-supplier-completeness.md` — hop only collections created after the Direct Link; Direct Links copy is **Supplier**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct Link = mill × buyer for this trader. When the mill posts, auto-repost is **for that buyer**, not every shop that follows the trader. Attribution: trader’s pack, mill named (`From {mill}`). Later manual Repost to Followers does not give Buyer 1 a second Collection. Trader 2 who follows mill and trader sees mill original + trader Followers card (two posts). Auto Selected is private to the linked buyer. |
| UX Designer | Reuse Explore card language: shop header = trader; mill credit = existing `From {shop}` with Show supplier name on. No “posted by / trader / supplier” chrome (role opacity). Repost on the mill post stays tappable while the auto pack is Selected-only; done icon after Followers. One album on You — not two copies of the mill pack. |
| Solution Architect | Same Collection `id` / one pack per trader × canonical root / JobQueue `collection.propagate`. Change publish audience to Selected + Direct Link `buyerCompanyId`s. Reuse `resolveRepostSource` when existing child is automatic Selected. Direct Link create unions the buyer (and delivers mill live packs). Revoke removes the buyer; empty Selected auto pack → draft, not delete. No schema. |

---

## Platform consistency (required)

1. **Existing patterns?** Selected audience, mill credit `From {shop}`, Repost sheet Who, Collection `id` = post. Yes.  
2. **Duplicates another feature?** No second Repost pipeline. No DirectLink table.  
3. **Should reuse an existing workflow?** Yes: `collection.propagate`, `publish`, Explore visibility `audienceCompanyIds`.  
4. **Naming matches the app?** Direct links. Mill · buyer. `From {mill}` — not Seller/Buyer on the card.  
5. **Units?** No ₹/qty string change. Pack Explore card stays the collection.

**Philosophy conflict?** The Network review locked Followers auto-repost. That overshares mill catalog to every follower of the trader (G-007). **Redesign** audience to Selected linked buyers; keep uniqueness / Relist / Example C. Not a silent drift.

---

## Locked examples

Identity unchanged: Collection `id` = Post ID. `repostRootCollectionId` = root. One pack per trader × root (Example A/C).

**Auto audience.** T1 has Direct Link T1×S1×B1. S1 publishes POST-100. T1 auto pack POST-201: `audience=selected`, `audienceCompanyIds=[B1]`, `showSourceShops=true`. B1 sees T1’s card with `From {S1}`. T2 (follows S1 and T1, not B1) sees only POST-100.

**Several buyers.** T1×S1×B1 and T1×S1×B2 → one pack, Selected `[B1, B2]`.

**Manual after auto.** T1 Reposts POST-100 to Followers. Reuse POST-201 (same id). Audience widens to Followers (`shouldBumpExploreOnPublish` resurfaces for new followers). B1 is not given a second Collection. T2 now sees POST-100 and POST-201.

**Existing Followers pack first (Example C).** Auto only syncs mill members. Do not shrink audience to Selected.

**Example A hops.** T3 auto-fires on mill Direct Link (T3×S1×B1). T3 does **not** hop T1’s Selected pack unless T3 is in that Selected list or T1 later widened to Followers. Two automatic triggers still yield one T3 pack.

**New Direct Link.** Union that buyer onto existing automatic Selected packs for that mill. If no auto pack yet, run/enqueue propagate on the mill’s published collections. Followers packs: leave audience.

**Revoke.** Remove buyer from automatic Selected lists. Empty Selected → draft (do not delete). Followers packs stay.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Selected auto; reuse on manual Followers; mill credit on |
| Business rules | OK | One pack × root; no shrink of Followers; Relist future-only |
| Workflows | OK | Direct Link create/revoke syncs Selected list |
| Edge cases | OK | No buyers → skip; Example C; last buyer drafts auto pack |
| Permissions | OK | Hop still needs discover + Relist + mill ticket |
| User states | OK | Selected-only auto is not Repost-done |
| Notifications | OK | Same Collection id for B1; Explore bump on widen is not a second post |
| Error handling | OK | `ALREADY_REPOSTED` only when a broad-audience child exists |
| Scalability | OK | JobQueue + reuse unique |
| Mobile interactions | OK | No new chrome; existing Repost sheet / feed cards |
| First glance (BM-11) | OK | Shop = trader; quiet `From {mill}`; one caption |
| Units (order / dispatch / Rate per) | N/A | No unit string change |
| Accessibility | OK | Done icon still status-only after Followers |
| Platform consistency | OK | Selected + From mill; no role badges |

---

## Gaps

### G-001 — Followers auto-repost overshares

| Field | Content |
|-------|---------|
| Gap | Network lock published auto-repost to the trader’s Followers. G-007 left Followers vs this-one-buyer unresolved. |
| Why it matters | Mill catalog reaches shops the trader did not put on a Direct Link. |
| Impact if ignored | Invented leak of mill identity/catalog. |
| Recommendation | Selected = Direct Link buyers. Manual Followers is explicit. |
| Priority | Required before implementation |

Closed in this slice.

---

## Approved scope for this slice

- Completeness + `explore.md` / TradeLane spec / `orders.md` / gap matrix. Successor note on the Network review (do not rewrite it).  
- `collection.propagate` publishes Selected + buyer ids + `showSourceShops`. Union buyers on automatic Selected; never shrink Followers/manual.  
- Direct Link create/revoke (and follow-revoke) add/remove that buyer; empty Selected auto pack → draft.  
- `resolveRepostSource` reuses automatic Selected; `ALREADY_REPOSTED` when a Followers (broad) child exists.  
- Explore `viewerReposted` / done icon only for broad-audience children.  
- Tests: propagate Selected; reuse; discover B1 vs T2; Playwright mill → B1 private → T1 Followers → T2 two posts; B1 one id.

## Explicitly deferred / rejected

- Mixed-cart How many (Yours / gray-skip).  
- FG-007, FG-009.  
- Staging/production migrate.  
- Cross-publisher feed collapse by canonical root.  
- New card chrome beyond forced mill credit.  
- DirectLink table.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
