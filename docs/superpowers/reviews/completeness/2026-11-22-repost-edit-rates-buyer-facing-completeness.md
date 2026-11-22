# Feature Completeness Review — `repost-edit-rates-buyer-facing`

**Date:** 2026-11-22  
**Module / ask:** Critical fix — Edit Repost hydrate + buyer-facing trader rates + from-pack OrderItem stamp  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/explore.md`, `docs/features/collections.md`, `docs/features/orders.md`  
**Disposition:** Proceed (with Clamp Redesign)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader Edit + Show rates is the selling quote for that child pack. Buyers and new Place must see that ₹. Mill `Product.rate` stays mill. Old OrderItems stay snapshotted. |
| UX Designer | Edit reopen must restore Show rates + mode + drafts. No-op Save must not flip to On Request or wipe calc — that reads as “rates are on request” / lost Edit. |
| Solution Architect | Audit: hydrate already restores stored detail. Defects are publish Same-wipe when rates off + Clamp forcing `on_request` from foreign Product.rateVisibility + fallbacks to Product.rate when mode null/Same. Preserve `editOwnBase` invalidation. |

---

## Platform consistency (required)

1. **Existing patterns?** Reuse RepostSheet, collection/member pricing fields, `resolvePackMemberBuyerRates`, `createFromPack` + `catalogWholePack` — no second config model.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — existing calc + Place stamp path.  
4. **Naming matches the app?** Show rates / Same / Edit / Margin; Edit repost.  
5. **Units?** Rate per unchanged; whose = trader pack for buyer-facing; mill Product.rate stays supplier.

**Philosophy conflict?** Partial — Slice A Clamp tied pack Visible to foreign Product.rateVisibility. That fights trader-owned selling quotes. **Redesign Clamp** (below), then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap → fix | Hydrate truth + buyer ₹ + OrderItem stamp |
| Business rules | OK + Redesign | Clamp Redesign; keep editOwnBase / Same/Margin disclosure |
| Workflows | OK | Edit reopen · browse · Place |
| Edge cases | OK | On Request hide; undisclosed no leak; historical immutable |
| Permissions | OK | No ceiling bypass |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | Sheet only |
| First glance (BM-11) | OK | Show rates ON + edited ₹ visible on reopen |
| Units | OK | Trader pack rate vs mill Product.rate |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Clamp forces On Request after trader Show rates

| Field | Content |
|-------|---------|
| Gap | `curatedPublishRateVisibility` stores `on_request` when any foreign member Product is on_request, even if trader requested Visible + calc. |
| Why it matters | Reopen looks On Request; rates-off Save then wipes Edit→Same; buyers never see trader ₹. |
| Impact if ignored | Release blocker — both reported defects. |
| Recommendation | **Redesign:** when publish DTO has a calc mode (Same/Edit/Margin) and curator requests `visible`, honor `visible`. Mill undisclosed still cannot leak through Same/Margin/`editOwnBase` rules in the resolver. |
| Priority | Required before implementation |

### G-002 — Rates-off publish wipes calc to Same

| Field | Content |
|-------|---------|
| Gap | RepostSheet `buildPublishDto` sends Same when Show rates OFF. |
| Why it matters | No-op Save after Clamp destroys Edit; Place stamps mill Product.rate. |
| Impact if ignored | Buyer/order show ₹100 instead of ₹125. |
| Recommendation | Omit pricing fields when rates off (match CollectionEditor). |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + docs lock (hydrate, Clamp Redesign, buyer surfaces, snapshot immutability)
- RepostSheet: omit pricing on rates-off; hydrate matrix tests; no-op Save preserves config
- `curatedPublishRateVisibility`: honor Visible when calc mode present
- Buyer Explore/shop/album/search already resolve when mode persists; fix product-via-pack Product.rate bypass where pack context exists
- `createFromPack` / `snapshotItems` stamp trader buyer-facing; mill hop unchanged; confirmedRate write-once
- Prisma-backed supplier→trader→buyer order journey (₹100 / ₹125 / immutable / ₹130)
- Preserve `editOwnBase` invalidation — do not force null ownBase

## Explicitly deferred / rejected

- Unrelated Repost (Remove, soft-unavailable, mesh UI)
- Recalculating historical OrderItems
- Rewriting Margin formulas or Ask-as-mode

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
