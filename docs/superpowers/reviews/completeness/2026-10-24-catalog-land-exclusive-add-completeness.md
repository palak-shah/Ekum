# Feature Completeness Review — Catalog land, exclusive Add, Designs membership

**Date:** 2026-10-24  
**Module / ask:** After Create & Publish a catalog, land on You Catalogs. Catalog-exclusive designs must not offer Add. You Designs listing shows which packs a design sits in. Designs / General Collection ⋯ say Add to collection / catalog.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`  
**Disposition:** Proceed (listing caption is a locked Redesign of “name only”)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Creating a catalog and landing on Collections is the wrong home. Exclusive catalog members cannot join another pack — offering Add is a dead door. Designs list must show membership so the verb can stay generic. |
| UX Designer | Name stays loud; one muted pack-name line (not chips). Library ⋯ is Add to collection / catalog. Regular album ⋯ is Add to other collections. Catalog album: no Add. |
| Solution Architect | Reuse `collectionNames` already on ProductView. Label by surface (`library` \| `album`). Hide Add when any pick has `catalogCollectionId`. After-publish href by pack kind. |

---

## Platform consistency (required)

1. **Existing patterns?** You tabs; CatalogFeedPost `meta`; exclusivity already on API `catalogCollectionId`.  
2. **Duplicates another feature?** No — listing membership is the cue; Add sheet Already in stays.  
3. **Should reuse an existing workflow?** Same AddToPackSheet; omit the door when exclusive.  
4. **Naming matches the app?** Catalogs · Collections · In your catalog.  
5. **Units?** N/A.

**Philosophy conflict?** No. Tile “name only” is Redesigned to name + quiet membership on You Designs only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Land, hide Add, listing line, verbs |
| Business rules | OK | Exclusive = no Add |
| Workflows | OK | Create & Publish catalog → Catalogs; Save in Draft stays on editor |
| Edge cases | OK | Mixed leftover + exclusive: no Add |
| Permissions | OK | Owner |
| Mobile interactions | OK | One muted line, truncate |
| First glance (BM-11) | OK | Name louder than pack names |
| Units | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Catalog Create & Publish lands on Collections

| Field | Content |
|-------|---------|
| Gap | Navigate always `?tab=collections`. |
| Why it matters | Catalogs is the home they just created. |
| Impact if ignored | Hunt Collections for a catalog. |
| Recommendation | `?tab=catalogs` when kind is catalog. |
| Priority | Required before implementation |

### G-002 — Add offered on exclusive catalog members

| Field | Content |
|-------|---------|
| Gap | You / album ⋯ still Add; sheet says leave catalog first. |
| Why it matters | Exclusive means exclusive. |
| Recommendation | Omit Add when any pick has `catalogCollectionId`. Catalog album select ⋯ has no Add. |
| Priority | Required before implementation |

### G-003 — Designs tile cannot show membership

| Field | Content |
|-------|---------|
| Gap | Name only. Verb “Add to other collections” was the only cue. |
| Why it matters | Trader looking at Designs cannot see which pack it sits in. |
| Recommendation | Quiet `collectionNames` line on You Designs Feed/Grid only. |
| Priority | Required before implementation |

### G-004 — “In your collections” on a catalog member

| Field | Content |
|-------|---------|
| Gap | Pack-published without Explore tile always says collections. |
| Recommendation | `catalogCollectionId` → In your catalog. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Create & Publish catalog → You Catalogs; collection → Collections; Save in Draft stays on editor.  
- Hide Add when exclusive. Library ⋯ **Add to collection / catalog**. Regular album **Add to other collections**.  
- You Designs listing: muted pack names under the name.  
- Edit design status: In your catalog when exclusive.

## Explicitly deferred / rejected

- Membership line on Explore, Saved, album tiles, General Collection.  
- Visitor album Add.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
