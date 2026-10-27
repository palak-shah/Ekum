# Feature Completeness Review — Move catalog designs to another pack

**Date:** 2026-10-27  
**Module / ask:** When a design is exclusive to a catalog, do not hide Add. Offer **Move to catalog / collection**: leave the current catalog and join the picked pack. Catalog exclusivity: one catalog, no extra collections.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `2026-10-24-catalog-land-exclusive-add-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Exclusive still means one home. Traders need to re-home a catalog design without Remove-then-Add through General Collection. Move is that job. Mixed leftover + exclusive stays one job — omit. |
| UX Designer | Same destination sheet as Add (Find, Already in, Collections, Catalogs, accent rows). Title and CTA say **Move**. Catalog pick still wipes collection picks (and the reverse). Catalog album ⋯ keeps Remove last-ish; Move sits where Add sits on a regular album. |
| Solution Architect | Reuse `AddToPackSheet` + `addToPackToggle`. `PUT /collections/:id/products` with `relocateExclusive` unstamps the old catalog and writes the new membership in one transaction. Catalog create picker stays General Collection leftovers. |

---

## Platform consistency (required)

1. **Existing patterns?** AddToPackSheet; catalog vs collection exclusive toggle already in `addToPackToggle`.  
2. **Duplicates another feature?** No — not Remove (that returns to General Collection).  
3. **Should reuse an existing workflow?** Same sheet; verb and API flag differ.  
4. **Naming matches the app?** **Move to catalog / collection** (source is a catalog). Confirm **Move**. Toasts **Moved to catalog** / **Moved to collection**.  
5. **Units?** N/A.

**Philosophy conflict?** No. Exclusive is still exclusive. Move relocates; it does not dual-home an own design.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Move leaves current catalog; joins selected pack(s) |
| Business rules | OK | One catalog XOR collections; mixed leftover+exclusive omit |
| Workflows | OK | You Designs ⋯ / select ⋯; catalog album DesignSheet + select ⋯ when every pick is exclusive |
| Edge cases | OK | Current catalog is Already in; mill-only catalog select does not grow a new Add |
| Permissions | OK | Owner + uploads |
| User states | OK | Draft and published packs stay destinations |
| Notifications | N/A | Toast only |
| Error handling | OK | Without relocate flag, `CATALOG_EXCLUSIVE` unchanged |
| Scalability | N/A | |
| Mobile interactions | OK | Same sheet chrome; dock clear already |
| First glance (BM-11) | OK | Move is the job; Already in is quiet |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Same rows / listbox patterns |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Exclusive designs omit Add

| Field | Content |
|-------|---------|
| Gap | `addToPackCanOffer` hides the door. Traders cannot re-home without Remove. |
| Why it matters | Remove dumps them in General Collection; they wanted another pack. |
| Impact if ignored | Dead end on catalog designs. |
| Recommendation | All-exclusive picks: offer **Move to catalog / collection**. Mixed leftover + exclusive: still omit. |
| Priority | Required before implementation |

### G-002 — setProducts rejects exclusive members

| Field | Content |
|-------|---------|
| Gap | `CATALOG_EXCLUSIVE` on add. Client cannot append then hope. |
| Why it matters | Two-step remove+add can leave the design in General Collection if the second PUT fails. |
| Recommendation | Optional `relocateExclusive`: unstamp + drop old catalog membership, then write the destination, one transaction. Omit flag → still reject. |
| Priority | Required before implementation |

### G-003 — Catalog album has no Move

| Field | Content |
|-------|---------|
| Gap | Catalog album select ⋯ has no Add/Move; DesignSheet hides Add when exclusive. |
| Recommendation | DesignSheet Move for exclusive own. Select ⋯ Move only when every selected design is exclusive (not mill-only Add). |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Exclusive own designs: **Move to catalog / collection** on You Designs (⋯ and select ⋯) and catalog album (DesignSheet; select ⋯ when every pick is exclusive).  
- Confirm **Move**. Leaves current catalog. Destination: other collections (multi) **or** one other catalog, not both. Current catalog is Already in.  
- API `relocateExclusive` on `PUT /collections/:id/products`.  
- Mixed leftover + exclusive: still no door. Catalog create/album picker stays leftovers. Mill-only catalog select does not gain Add.

## Explicitly deferred / rejected

- Add mill designs from a catalog album select ⋯.  
- Visitor Move.  
- Changing catalog create picker to include exclusive designs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
