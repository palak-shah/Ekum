# Feature Completeness Review — My Collections (General Collection, Catalogs, Delete)

**Date:** 2026-10-23  
**Module / ask:** My Collections has three sections (Collections, Catalogs, Designs). Every company has one persistent **General Collection** (`kind` flag). Catalogs are a distinct collection kind with owner-scoped exclusivity. Rates stamp onto designs. Draft = offline. Delete = irreversible soft-delete.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/settings.md`  
**Disposition:** Proceed (with Redesign of Apply-to-all “won’t replace existing rate”, Collection Ready, and Restore)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need one unassigned bucket (General Collection) for leftover draft and published designs, a real Catalog kind for order-as-whole / pick-and-choose, and Delete that does not erase history. Downstream must still curate a catalog as a catalog or as individual designs. |
| UX Designer | Three You tabs. Persistent General badge after rename. No manual add/remove on General Collection. Archive copy → **Delete**; Deleted filter; no Restore. Draft is the hide word. Apply-to-all overwrites member rates; How many still uses the design rupee. |
| Solution Architect | Reuse `Collection` + `CollectionProduct` + `Product`. Add `kind`, `orderMode`, `Product.catalogCollectionId`. General membership is computed. Orders keep snapshotting `Product.rate`. Never hard-delete. Identity is `kind`, never name. |

---

## Platform consistency (required)

1. **Existing patterns?** You library tabs, collection editor, album picker, Sheet confirms, `status=archived` soft-delete, order-line snapshots.  
2. **Duplicates another feature?** Catalog is not a second Collection label — it is a kind with exclusivity + stamp-on-add. General Collection is not a virtual UI bucket.  
3. **Should reuse an existing workflow?** Same create editor (“Treat this collection as a catalog?”). Same Deleted filter chrome as today’s Archived view.  
4. **Naming matches the app?** Draft · Delete · Catalog · General Collection. Not Unpublish / Offline / Archive / Restore.  
5. **Units?** Orders / How many: whose = **design**, which = Rate per. Explore pack card: whose = **collection** when pack ₹ is set. Catalog add stamps collection rate onto the design.

**Philosophy conflict?** Partial — Apply-to-all currently will not overwrite a filled design rate (2026-10-22-pack-apply-all-honest-rates). **Redesign:** overwrite when Apply is on. Collection Ready and Restore are removed (lifecycle Draft · Published · Deleted). Global catalog exclusivity that would block Curate is **Rejected**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | GC, catalogs, three You tabs, stamp rates, Delete |
| Business rules | OK | Qualifying membership; owner-scoped exclusivity; unassigned drafts in GC |
| Workflows | OK | Create collection/catalog; add/remove; draft/delete confirms |
| Edge cases | OK | Shared design draft; also-delete-designs; name clash on GC display name |
| Permissions | OK | `uploads` + `owned`; exclusivity in the service transaction |
| User states | OK | Draft / Published / Deleted filters; GC never Draft/Deleted |
| Notifications | N/A | |
| Error handling | OK | `GENERAL_COLLECTION_READONLY`, `CATALOG_EXCLUSIVE`, `NOT_ALLOWED` restore |
| Scalability | OK | Computed GC query + indexes |
| Mobile interactions | OK | Sheets above nav; BM-07 clearance on select docks |
| First glance (BM-11) | OK | Badge, three tabs, no manual GC controls |
| Units (order / dispatch / Rate per) | OK | Stamp onto design; order snapshots design; pack card display may show collection ₹ |
| Accessibility | OK | Existing kit controls |
| Platform consistency | OK | After Apply-to-all Redesign |

---

## Gaps

### G-001 — Apply-to-all overwrites existing design rates

| Field | Content |
|-------|---------|
| Gap | Current Same-for-all skips designs that already have a rupee. |
| Why it matters | Traders asked Apply this to all to stamp every member. |
| Impact if ignored | Mixed rates in a pack after Apply; wrong mental model. |
| Recommendation | Redesign: overwrite own members when Apply is on. Orders still use design rate. |
| Priority | Required before implementation |

### G-002 — No Restore / no Collection Ready / no hard delete

| Field | Content |
|-------|---------|
| Gap | Archive+Restore, Ready status, and `prisma.*.delete` on owner Delete. |
| Why it matters | Delete must keep history and never come back. Ready is unused product language. |
| Impact if ignored | Traders restore “deleted” stock; Ready chips confuse You. |
| Recommendation | `archived` = Deleted; reject `unarchive`; migrate `ready`→`draft`; Delete aliases archive. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- One General Collection per company (`kind=general`), seeded on company create and backfilled by kind.  
- Unassigned non-deleted designs (Draft or Published) belong in General Collection.  
- Catalogs as `kind=catalog` + `orderMode` (whole \| pick); owner-scoped exclusivity; stamp catalog rates on add.  
- You tabs Collections · Catalogs · Designs; General badge; no standalone Designs ＋.  
- Delete = soft `archived`, Deleted filter, no Restore. Also-delete-designs / also-draft-designs confirms.  
- Apply-to-all overwrites member rates. Orders snapshot `Product.rate`.  
- Duplicate-detection hook documented on media complete; no matcher.

## Explicitly deferred / rejected

- Photo-order → library design conversion UI (membership rule still applies if a design is created).  
- Perceptual image matching / auto-merge.  
- Global exclusivity that would block mill→trader catalog curate.  
- Auto-restamp every catalog member when the catalog rate is edited later (use Apply-to-all).  
- Physical row erase.  
- Collection Ready status.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
