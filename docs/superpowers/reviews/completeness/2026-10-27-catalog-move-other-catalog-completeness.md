# Feature Completeness Review — Move exclusive design into another catalog

**Date:** 2026-10-27  
**Module / ask:** Moving a catalog-exclusive design into another catalog toasts that it is already there.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `2026-10-27-catalog-move-exclusive-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Move already means leave this catalog and join the pick. Another catalog is a valid home. Rejecting that as “already exclusive” is the old home, not a second home. |
| UX Designer | Same Move sheet. Current catalog stays **Already in** (disabled). Other catalogs stay pickable. Toast **Moved to catalog** — not an exclusive error. |
| Solution Architect | `relocateExclusive` already unstamps and drops catalog joins in the write transaction. The **pre-check** still treats the source catalog join as `otherQualifying`, so catalog→catalog never reaches the write. Skip relocating ids in that check. Drop other qualifying joins for those ids when the dest is a catalog (XOR). Omit flag → still reject. |

---

## Platform consistency (required)

1. **Existing patterns?** Same `AddToPackSheet` + `PUT …/products` with `relocateExclusive`.  
2. **Duplicates another feature?** No — not Remove-to-General-Collection.  
3. **Should reuse an existing workflow?** Yes — existing Move.  
4. **Naming matches the app?** Keep **Move to catalog / collection**. Error copy unchanged for true dual-home attempts.  
5. **Units?** N/A.

**Philosophy conflict?** No. Exclusive stays one catalog XOR collections. Move relocates; it does not dual-home.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Catalog→catalog and catalog→collection both leave the source |
| Business rules | OK | One catalog; relocating is not “already in another catalog” |
| Workflows | OK | DesignSheet / select ⋯ Move; current catalog Already in |
| Edge cases | OK | Omit flag still CATALOG_EXCLUSIVE; mixed leftover+exclusive still omit |
| Permissions | OK | Owner only |
| User states | OK | Draft or published dest catalog |
| Notifications | N/A | Toast only |
| Error handling | OK | True clash still exclusive copy |
| Scalability | N/A | Same PUT |
| Mobile interactions | OK | Same sheet |
| Accessibility | OK | Already-in rows stay aria-disabled |
| Chrome / clip | N/A | No new sticky bar |

---

## Gaps found (Required / Nice / Later)

### G-001 — Source catalog join blocks relocate into another catalog

| Field | Content |
|-------|---------|
| Gap | `otherQualifyingIds` includes the current catalog membership. Catalog dest throws `CATALOG_EXCLUSIVE` even with `relocateExclusive`. |
| Why it matters | Traders pick another catalog and see “already there.” Completeness 2026-10-27-catalog-move-exclusive already approved this job. |
| Recommendation | Skip relocating ids in the catalog dest blocked check. In the same transaction, drop other qualifying joins for those ids, then stamp the dest. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `relocateExclusive` into a **catalog** is not blocked by the design’s current catalog membership.  
- After Move, the design is exclusive to the dest catalog only.  
- Catalog→collection path unchanged (already unstamps).  
- Without the flag, adding an exclusive design to another catalog still rejects.

## Explicitly deferred / rejected

- Dual-home own design (catalog + collections).  
- Changing Already in to hide the source catalog.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
