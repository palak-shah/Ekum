# Feature Completeness Review — Owner rates on supplier post you reposted

**Date:** 2026-11-24  
**Module / ask:** Explore feed: after Edit repost on a supplier post, caption still shows mill ₹ only while Edit shows your buyer-facing ₹ — show your rate + Supplier ₹ (+ margin) for the viewer who reposted; same chrome on own curated child album/DesignSheet/Explore; edit sheets show supplier + previous.  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, sell-as-units  
**Disposition:** Proceed (Redesign of 2026-11-24 #7 “not on Explore feed cards”)

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader edits rate on Edit repost but stares at supplier Explore card — caption must match Edit (your ₹ + supplier ₹). Other viewers of mill card unchanged. Buyers of child see buyer-facing only. |
| UX Designer | Quiet Supplier + Margin under your rate; album/DesignSheet language reused on feed. Edit sheets: Supplier + previous/saved Your ₹. |
| Solution Architect | Stamp viewer-only fields from child via `viewerRepostCollectionId` + `resolvePackMemberBuyerRates`. Never rewrite mill `rateMin` globally. |

---

## Platform consistency (required)

1. **Existing patterns?** Owner Supplier cue helper; Explore `viewerReposted` stamps; album/DesignSheet dual rate.  
2. **Duplicates?** No — extends #7 to the feed surface that caused the Edit/feed mismatch.  
3. **Reuse?** `ownerSupplierRateCue` + `formatCatalogRate` / `exploreFeedRateLine`.  
4. **Naming?** Supplier ₹…; Margin ₹… / Margin N%.  
5. **Units?** Whose = pack Rate per (collection card). Which = Rate per. Surface = Explore caption (viewerReposted + own child), album, DesignSheet, edit sheets.

**Philosophy conflict?** No — owner/viewer chrome only; buyers unchanged.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Mill rateMin unchanged for others |
| Workflows | OK | Edit repost → feed caption |
| Edge cases | OK | Mixed source → omit Supplier/delta; resolve fail → omit stamps |
| Permissions | OK | Viewer-only stamps |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Fail-closed stamps |
| Scalability | OK | Batch resolve children in card page |
| Mobile interactions | OK | Caption under photo |
| First glance (BM-11) | OK | Your ₹ loudest; Supplier/Margin quiet |
| Units | OK | Pack Rate per |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required before implementation.

---

## Approved scope for this slice

- API viewer-only stamps on CollectionCard when `viewerReposted` (your band + supplier + margin mode/value).
- Own curated child: owner supplier + margin stamps (rateMin already buyer-facing).
- Explore caption uses stamps for dual + margin lines.
- Album / DesignSheet: add Margin under Supplier.
- Edit sheets: Supplier + previous/saved Your ₹.
- Docs + tests + trader-eye.

## Explicitly deferred / rejected

- You library row rate chips  
- Showing Supplier/Margin to buyers  
- Place / OrderItem changes  
- Audit #6 menu  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
