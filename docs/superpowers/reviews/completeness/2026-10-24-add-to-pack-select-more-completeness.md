# Feature Completeness Review — Select ⋯ Add to collection (label by exclusivity)

**Date:** 2026-10-24  
**Module / ask:** Selecting designs (You and owned album) ⋯ must offer Add to collection / catalog. If any picked design already sits in a collection, the verb is **Add to collection** only — catalogs stay exclusive to General Collection leftovers.  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same job as design-sheet Add. Select ⋯ is the bulk door. Pack members cannot join a catalog — the label must not promise Catalog. |
| UX Designer | Everyday first, Delete last. You ⋯ must appear whenever Designs are selected (not only when Hide/Delete apply). Album select: Bookmark · Add · Remove · Delete. Sheet title matches the verb. |
| Solution Architect | Reuse AddToPackSheet + `addToPackEligibleTargets`. Label helper: leftover-only → “Add to collection / catalog”; any `collectionNames` or `catalogCollectionId` → “Add to collection”. |

---

## Platform consistency (required)

1. **Existing patterns?** You select ⋯, album select ⋯, DesignSheet Add.  
2. **Duplicates another feature?** No — missing/wrong chrome on an existing verb.  
3. **Should reuse an existing workflow?** Yes — same sheet.  
4. **Naming matches the app?** Collection / Catalog; no Seller/Buyer.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | You + album select ⋯ |
| Business rules | OK | Catalog only when every pick is a leftover |
| Workflows | OK | Design sheet unchanged besides label |
| Edge cases | OK | Mixed pick → collection-only; exclusive catalog still opens Already in |
| Permissions | OK | Owner |
| Mobile interactions | OK | Existing select dock + ⋯ |
| First glance (BM-11) | OK | Add before Hide/Delete |
| Units | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Album select ⋯ has no Add

| Field | Content |
|-------|---------|
| Gap | Owner selecting designs: Bookmark · Remove · Delete only. |
| Why it matters | Bulk add from the album is the same job as one design ⋯. |
| Impact if ignored | They leave the album and hunt You. |
| Recommendation | Insert Add after Bookmark. GC album: Add (leftovers may join a catalog). |
| Priority | Required before implementation |

### G-002 — You ⋯ hides Add / puts it after Delete

| Field | Content |
|-------|---------|
| Gap | ⋯ only if Hide or Publish+Delete apply. Add sits after Delete. |
| Why it matters | Selecting leftovers with no Hide path has no ⋯. Delete-first fights §0. |
| Recommendation | Show ⋯ whenever Designs are selected. Order: Add · Repost · Hide · Delete last. |
| Priority | Required before implementation |

### G-003 — Label always says catalog

| Field | Content |
|-------|---------|
| Gap | Pack members cannot join a catalog; the verb still says Catalog. |
| Why it matters | Exclusivity was locked; the words must match. |
| Recommendation | **Add to collection** when any pick is already in a pack or catalog. **Add to collection / catalog** only for leftover-only picks. Sheet title matches. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- You Designs select ⋯ always when something is selected; Add first among extras; exclusivity-aware label.  
- Owned album select ⋯: Add after Bookmark (collection-only on a regular/catalog album; leftover label on General Collection).  
- Sheet title uses the same label. Design sheet ⋯ too.

## Explicitly deferred / rejected

- Adding a catalog from a pack-member pick (still blocked by eligible targets).  
- Visitor album Add.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
