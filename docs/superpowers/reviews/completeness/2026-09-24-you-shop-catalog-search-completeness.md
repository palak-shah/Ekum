# Feature Completeness Review — You / shop catalog find

**Date:** 2026-09-24  
**Module / ask:** Find designs and collections on **You** and on a **company shop**  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/settings.md`, `docs/features/company.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already hunt by name on Chats / Orders / Explore. Own library and someone else’s shop are the two places they stand in a pile of designs/packs. Find is the same job: **narrow this list**, not open a third Search home. Status chips (Published / Draft / …) and shop visibility stay. |
| UX Designer | Kit `SearchInput` in place. Keep the current tab’s feed until they type (no jump to `/search`). Placeholder **Find designs** / **Find collections**. No-match is “nothing matches,” not “you have no published work.” One field; no second path. |
| Solution Architect | Client filter of lists already loaded (`GET /products`, `/collections`, shop first page). Name + SKU + tags + pack names (own library); name (+ shop on Saved). No new API this slice. Shop remains first page (limit 20) — server `q=` when that list paginates. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Chats / Orders / Explore list find (`SearchInput`). Same Designs · Collections job on You and shop.  
2. **Duplicates another feature?** No. Explore `/search` is the market. This is **this shop / this library**.  
3. **Should reuse an existing workflow?** Reuse `SearchInput` + shared match helper. Do not invent a search page or native-only filter.  
4. **Naming matches the app?** **Find designs** / **Find collections**. Not “query,” “filter catalog,” Seller/Buyer.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | In-page find on You (own + Saved) and shop, current tab only |
| Business rules | OK | Does not change publish / audience / Saved meaning |
| Workflows | OK | Type → list shrinks; clear field → full chip/tab list |
| Edge cases | OK | Empty list vs no match; chips still apply first |
| Permissions | N/A | Same visibility as the list already shown |
| User states | OK | Own library, Saved, visitor shop, own shop |
| Notifications | N/A | |
| Error handling | OK | Load error stays ErrorState; find only runs on loaded rows |
| Scalability | Later | Shop/company lists are first page only until paginated find |
| Mobile interactions | OK | No new sticky bar; field is in the scroll (BM-07 unchanged) |
| Accessibility | OK | `type=search`, labelled Find designs / Find collections |
| Platform consistency | OK | Kit field; not a fake search that navigates away |

---

## Gaps

### G-001 — Shop find is first page only

| Field | Content |
|-------|---------|
| Gap | Shop `GET /companies/:id/designs|collections` uses `limit: 20` with no `q`. |
| Why it matters | A huge shop cannot find a design that is not on the first page. |
| Impact if ignored | Rare on seed / early shops; bites large catalogs. |
| Recommendation | When shop pagination exists, add server `q=` (or load-more then find). |
| Priority | Future improvement |

---

## Approved scope for this slice

- `SearchInput` on **You** (below status chips) and **shop** (below Designs · Collections).  
- Filter the **current** tab after status / Saved. Own designs: name, SKU, tags, pack names. Packs: name, tags, member shop names. Saved / shop: name (Saved also shop name).  
- Query is local (not URL). Same text kept when switching Designs ↔ Collections or Saved.  
- No-match copy; Select all / dock still follow **visible** rows for add; shop dock membership stays “this seller’s pile,” not “only matches.”  
- Unit match helper + `@functional` type-and-see on You (Ravi) and shop (Meena → Surat).

## Explicitly deferred / rejected

- Global Explore search from You / shop.  
- Server-side shop `q=` / paging (G-001).  
- Searching Draft + Published in one box (chips stay).  
- SKU find for buyers on shop (shop cards may omit SKU).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
