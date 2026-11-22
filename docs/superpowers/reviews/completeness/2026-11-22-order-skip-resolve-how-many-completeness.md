# Feature Completeness Review — Order skip resolve → How many groups

**Date:** 2026-11-22  
**Module / ask:** When Order includes regular / pick collections, skip the All/Choose resolve sheet; open How many with all members expanded under collection headings; Clear a whole collection or × one design. Catalog-as-whole stays one qty block with **no pick and choose**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/orders.md`  
**Disposition:** Redesign → Proceed

> Completeness keeps Ekum **coherent**. One fewer hop for Order; remove happens on How many. Whole catalogs stay bunch qty.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | All/Choose was a second decision after Select. Expand-all + remove on How many is fewer taps and matches “place then drop what they don’t want.” |
| UX Designer | Collection headings clarify mixed piles. Clear on heading + per-design ×; no select-mode on How many. Whole catalog: one block, read-only members. |
| Solution Architect | Drop Order `kind: 'resolve'` from prepare; reuse expand-all. Stamp `sourceCollectionName` for headings. Curate/Repost resolve unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** How many × language; Sheet; traveling Selection sync.  
2. **Duplicates another feature?** No — removes Order resolve; Curate keeps its sheet.  
3. **Should reuse an existing workflow?** Yes — `resolveCatalogOrderAlbums` default all + HowManyEachSheet.  
4. **Naming matches the app?** Collection name headings; Clear / ×; no Seller/Buyer jargon.  
5. **Units?** N/A for this chrome slice (qty steppers unchanged).

**Philosophy conflict?** Yes vs older All/Choose Order lock → **Redesign** that hop. Whole-order no pick/choose stays.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Skip resolve; expand; headings; Clear / × |
| Business rules | OK | Whole = no pick/choose; locked → album; empty error; dedupe |
| Workflows | OK | Explore / cart / shop / album / You Order |
| Edge cases | OK | Mixed whole + regular; multi collection; solo designs |
| Permissions | OK | Same preview / Ask-to-see navigate |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Empty / locked toasts |
| Scalability | OK | Same preview fetch |
| Mobile interactions | OK | Sheet scroll; BM-07 dock unchanged |
| First glance (BM-11) | OK | No All/Choose layer; headings quiet |
| Units | N/A | |
| Accessibility | OK | Clear {collection} aria; × name |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required.

### Redesign vs older completeness

| Older lock | Now |
|---|---|
| 2026-09-03 / explore: Order resolve All/Choose then How many | Order expands all → How many; remove on sheet |
| Pick catalogs keep All/Choose (collections.md) | Order: expand all; Curate resolve unchanged |
| Whole: no Choose (2026-10-28) | Unchanged — still no pick/choose; one qty block |

---

## Approved scope for this slice

- Order prepare never returns `kind: 'resolve'`; always expand albums as All (or navigate locked / error empty).  
- How many: collection headings + Clear group + per-design × for expanded regular/pick members.  
- Whole catalogs: catalog name + one qty; read-only members; no Clear/× on members.  
- Stamp `sourceCollectionName` on expand; sync Selection removes.  
- Docs + units + e2e; Curate/Repost resolve stays.

## Explicitly deferred / rejected

- Curate / Repost resolve redesign.  
- Select mode on How many.  
- Per-member pick/remove on whole catalogs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
