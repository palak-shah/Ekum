# Feature Completeness Review — Request access (shop ask copy)

**Date:** 2026-10-22  
**Module / ask:** Rename shop/Explore follow idle CTA **Request catalog access** → **Request access** so Catalog is free for a later feature.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/explore.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same Follow ask (lock → Allow → look through). Only the idle words change. Pending **Requested**, allowed **Has access**, Explore pending **Asking…** stay. Catalog as a future product is not this slice. |
| UX Designer | One job on the shop action row. **Ask to see this collection** stays the album gate. Album helper is **Request access on their shop**. Find-on-Ekum Connect already says **Request access**; shop uses the same idle words with a lock and different after-states. Do not invent a third phrase. |
| Solution Architect | Copy and living docs only. Follow API, `/catalog` routes, CatalogTag, Catalog defaults, `data-testid="catalog-*"`, Prisma unchanged. |

---

## Platform consistency (required)

1. **Existing patterns?** Same shop lock/unlock row, Explore feed CTA, Requests inbox, I see theirs empty. Kit unchanged.  
2. **Duplicates another feature?** No. Connect remains **Access request** (Find **Request access** → pending chat). Follow remains look-through.  
3. **Should reuse an existing workflow?** Yes — existing Follow ask.  
4. **Naming matches the app?** **Request access** · **Requested** · **Has access**. Connect trust-ladder name stays **Access request**.  
5. **Units?** N/A.

**Philosophy conflict?** No. Frees Catalog for a later feature without renaming Collection, Category, or sell-as.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Idle string only. |
| Business rules | OK | Allow / Decline / cancel / unfollow unchanged. |
| Workflows | OK | Shop · Explore · album link · Following empty · Requests empty. |
| Edge cases | OK | Sell-only shops still show the ask. |
| Permissions | N/A | |
| User states | OK | Idle / pending / allowed labels unchanged except idle. |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new chrome; BM-07 N/A. |
| First glance (BM-11) | OK | Shop row still one compact CTA. |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Button accessible name becomes Request access. |
| Platform consistency | OK | Distinct from **Ask to see this collection**. |

---

## Gaps

None required for this slice.

---

## Approved scope for this slice

- Idle shop/Explore CTA **Request access**.
- Album gated link **Request access on their shop**.
- Following empty and Requests empty: drop “catalog access”.
- Living docs + unit / follow-ask functional asserts.
- Gap-matrix row labels for this CTA.

## Explicitly deferred / rejected

- Catalog defaults / sell-as rename.
- My Catalog → You retag.
- `/catalog` URLs, CatalogTag, share-sheet filenames, `data-testid="catalog-*"`.
- Find-on-Ekum / share-landing Connect copy (already **Request access**).
- Historical completeness/specs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
