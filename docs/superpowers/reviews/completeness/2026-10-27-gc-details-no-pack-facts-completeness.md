# Feature Completeness Review — General Collection details: save name/description, no pack rate/tags

**Date:** 2026-10-27  
**Module / ask:** Editing General Collection does not keep the info. The album details page still shows pack Rate and tags. GC is leftover storage — name + description only.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/catalog.md`, `2026-10-27-gc-no-pack-order-chrome-completeness.md`  
**Disposition:** Proceed (closes the deferred “design Rate per on GC album facts” item — those ₹ belong on the design, not the bouquet)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders rename the leftover pile and add a note. They do not sell that pile as a pack. Showing leftover design ₹ / tags under the album title looks like a collection rate. |
| UX Designer | Editor already hides category / tags / Rate. Album identity must match: description only. Design sheet still shows that design’s Rate per and tags. |
| Solution Architect | PATCH general must persist `name` + `description`. Reject tags/category/rate. Preview card for `kind=general` must not emit pack `rateMin` or `categories`. |

---

## Platform consistency (required)

1. **Existing patterns?** Same `kind=general` hide as editor product details / apply-all.  
2. **Duplicates another feature?** No. Design Rate per stays on the design editor and design sheet.  
3. **Should reuse an existing workflow?** Hide with `isGeneralCollection`.  
4. **Naming matches the app?** General Collection.  
5. **Units?** Whose = **not the pack** · which = Rate per stays on the **design** · surface = design sheet / editor. Album facts must not invent leftover min–max as pack ₹.

**Philosophy conflict?** No. Matches “GC is leftover home, not a sell-as pack.” The earlier deferral of album Rate per is withdrawn.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Persist name + description; omit pack facts |
| Business rules | OK | No tags/category/rate on GC |
| Workflows | OK | Edit details → Update → album shows name + note |
| Edge cases | OK | Empty description clears; leftover member ₹ ignored |
| Permissions | OK | Owner PATCH / album only |
| User states | OK | Rename still works |
| Notifications | N/A | |
| Error handling | OK | `GENERAL_COLLECTION_READONLY` when tags/rate posted |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bar |
| First glance (BM-11) | OK | Bouquet job is name + leftovers, not pack ₹ |
| Units (order / dispatch / Rate per) | OK | No pack ₹ string on GC album |
| Accessibility | OK | Facts omitted, not disabled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — GC PATCH dropped description

| Field | Content |
|-------|---------|
| Gap | Editor shows Description; save sent only `name`; API wrote only `name`. |
| Why it matters | “Updated” toast with the old note on the album. |
| Impact if ignored | Traders think edit is broken. |
| Recommendation | Persist `name` + `description` on general update. |
| Priority | Required before implementation |

### G-002 — GC album used leftover design ₹ as pack facts

| Field | Content |
|-------|---------|
| Gap | Explore preview `rateMin` is design min–max; album facts line showed it with collection tags. |
| Why it matters | Looks like they can sell the leftover pile as a collection. |
| Impact if ignored | Wrong money on the bouquet. |
| Recommendation | Omit pack Rate and tags on GC album / preview. Design sheet unchanged. |
| Priority | Required before implementation |

Closed by this slice.

---

## Approved scope for this slice

- GC PATCH: `name` + `description` only. Tags / category / rate still rejected.  
- GC album identity: description (more…) only — no Rate, no tags.  
- GC preview card: no `rateMin` / pack `categories`.  
- Regular / catalog album and design sheet unchanged.

## Explicitly deferred / rejected

- Hiding Select / Order on leftover **designs**.  
- Hiding Rate per / tags on the **opened design** (those are design identity).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
