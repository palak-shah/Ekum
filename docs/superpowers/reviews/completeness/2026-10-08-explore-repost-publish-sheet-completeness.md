# Feature Completeness Review — Explore per-post Repost sheet

**Date:** 2026-10-08  
**Module / ask:** Feed **Repost** opens an on-page sheet (Who / groups / companies / forward·download / 48h link) — not Your selection Curate. Individual post only.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/collections.md`, PublishAudienceFields, CatalogShareSheet 48h  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Repost = publish under my name for chosen Who. One post → one sheet. Multi-pick Curate/Repost on Your selection stays for piles. |
| UX Designer | Kit Sheet + PublishAudienceFields + quiet 48h like Share. No Selection hop. BM-11: Who is the job; 48h stays quiet. |
| Solution Architect | Resolve product ids → curate-check → create pack → set products → publish. Reuse PublishAudienceFields + share-links for new pack. showSourceShops default off. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet, PublishAudienceFields, CatalogShare 48h row, curate-check.  
2. **Duplicates?** No — replaces wrong Selection hop for single-post Repost.  
3. **Reuse?** Yes.  
4. **Naming?** Repost (not Curate) on the sheet title.

**Philosophy conflict?** No — B2B Who, not Everyone blast.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Sheet + create/publish + optional 48h |
| Business rules | OK | Trading + allowForward gate; ceiling; rates on request when foreign |
| Workflows | OK | Stay on Explore |
| Edge cases | OK | Locked products / no product list → in-sheet notice |
| Permissions | OK | Trading; curate-check |
| User states | OK | Own posts hide Repost |
| Notifications | N/A | |
| Error handling | OK | InlineNotice |
| Scalability | OK | One pack |
| Mobile / BM-07 | OK | Sheet scroll |
| BM-11 | OK | Trader-eye after |
| Accessibility | OK | aria on icons already |
| Platform consistency | OK | |

---

## Approved scope

- Explore feed Repost → `RepostSheet` on current page  
- PublishAudienceFields (Who / groups / companies / rates / buyers can add / download / show supplier when foreign)  
- Quiet **Share a link · 48 hours** after or with publish (new pack)  
- Docs + unit for “does not navigate to /selection”

## Explicitly deferred

- Changing Your selection multi-pick Repost/Curate flow  
- Inline PublishAudienceFields inside CurateFromSelectionSheet  

## Sign-off

Required gaps closed or deferred in writing: **Yes**  
Ready for implementation: **Yes**
