# Feature Completeness Review — Shelf From + supplier credit trust ladder

**Date:** 2026-11-18  
**Module / ask:** Own shop shelf mill From; visitor shelf/credit respects Show supplier + hop ceiling (no S1 leak)  
**Anchors:** `docs/features/collections.md`, `docs/features/explore.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Owner must tell curated vs own via From S1 on own shelf. Visitors must not learn hidden mills. Re-curate Show-on credits prior hop (Trader), not end mill. |
| UX Designer | Same From meta language as You library for owner; visitor shelf From only when Show supplier on, using ceiling-safe names. No Curated chip. |
| Solution Architect | Today `collectionSourceShopNames` uses raw `product.companyId` — leaks S1 on Buyer pack. Fix pure credit helper + wire cards/album; own shelf joins library `memberShops`. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse `collectionOwnerSourceLine` / `showSourceShops` / `sourceShopNames`; trust ladder (cannot outrun source).  
2. **Duplicates another feature?** No — aligns shelf with existing mill credit gate.  
3. **Should reuse an existing workflow?** Yes — Show supplier publish toggle.  
4. **Naming matches the app?** From {shop}; Show supplier name.  
5. **Units?** N/A.

**Philosophy conflict?** No — strengthens trust ladder.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Owner From; visitor From iff show + ceiling |
| Business rules | OK | Matrix locked in plan |
| Workflows | OK | Display only; Order/Message unchanged |
| Edge cases | OK | Named below |
| Permissions | OK | No new grants |
| User states | OK | Owner vs visitor |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | One source-hop load per card batch where needed |
| Mobile interactions | OK | Meta line only; no sticky chrome change |
| First glance (BM-11) | OK | From line quiet like You |
| Units | N/A | |
| Accessibility | OK | Text meta |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Visitor credit uses raw mill companyId

| Field | Content |
|-------|---------|
| Gap | `collectionSourceShopNames` / album design `companyName` when show on lists S1 even if upstream hop hid mills |
| Why it matters | Trust ladder — Buyer cannot unmask S1 |
| Impact if ignored | Buyer show-on profile leaks Supplier |
| Recommendation | Ceiling-safe credit helper; wire cards + album |
| Priority | Required before implementation |

### G-002 — Own shelf hides mill From

| Field | Content |
|-------|---------|
| Gap | `hideLibraryMeta` always; no `memberShops` on shop rows |
| Why it matters | Owner cannot distinguish curated vs own on profile |
| Impact if ignored | Confusion continues |
| Recommendation | Own: library memberShops; visitor: ceiling sourceShopNames when show on |
| Priority | Required before implementation |

---

## Edge cases (locked)

- No `repostSourceCollectionId`: foreign members → credit product shops when show on (direct mill curate).
- Upstream show off → visitor credit = source pack company name only.
- Upstream show on → may credit mills (walk one+ hops: stop at first hop that hides).
- Mixed own + foreign: own omitted from From; foreign follow ceiling.
- Auto-repost forced show on: credit mill as today when that hop reveals.
- Trader later toggles show: Buyer’s ceiling re-reads source pack at serialize time.
- Empty lineage + show on: product companies (cannot invent Trader).
- **`repostSourceCollectionId` set but source row unloadable:** visitor credit must **not** list the mill — pack owner / empty names (never raw S1).
- **Visitor `product.companyId`:** remains the real mill id (SKU owner). Required for Place / Direct stamps, shortlist, DesignSheet handler, curated detection. Privacy boundary is **display credit** (`sourceShopNames`, `companyName`, From lines)—not stripping ownership ids on the wire.

## Verification addendum (2026-11-18)

| Item | Disposition |
|------|-------------|
| G-001 hop ceiling helpers | Shipped in `source-shop-credit.ts` |
| G-002 own shelf From | Shipped |
| Lineage integration + negative S1 asserts | Required follow-up (this slice) |
| Mask visitor `companyId` | **Reject** — breaks routing; keep mill id |

## Approved scope for this slice

- Completeness + docs (collections / explore mill credit).
- Own shelf From via `/collections` memberShops when `isOwn`.
- Visitor shelf From iff `showSourceShops`, names from ceiling-safe API `sourceShopNames`.
- API: ceiling-safe `sourceShopNames` + album visitor design credit company names.
- Units + profile tests; no commit/deploy.

## Explicitly deferred / rejected

- Curated chip / Mine-only filter.
- Order/Message routing changes.
- GC / remove membership.
- Rewriting visitor `product.companyId` to the credit hop.
