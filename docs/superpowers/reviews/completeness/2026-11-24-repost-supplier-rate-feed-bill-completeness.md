# Feature Completeness Review — Repost supplier rate, feed, Place rates, bill/conversion

**Date:** 2026-11-24  
**Module / ask:** Client Repost sheet #7–#10 + #12 — trader-only supplier rate cue; done icon + toast; feed activity verify; Place pack rates immutable; How many ₹ + sets=pcs behind Show bill total (default OFF).  
**Anchors:** `docs/features/explore.md`, `docs/features/orders.md`, `docs/features/settings.md`, `sell-as-units`  
**Disposition:** Proceed (Clamp Redesign for #12 How many footer conversion gate)

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader needs mill ₹ next to own quote on own curated album only. Place must stamp that pack’s buyer-facing; edits later never rewrite OrderItems. Bill total OFF must hide money **and** sets=pcs conversion on How many. |
| UX Designer | Quiet Supplier ₹ under owner rate / DesignSheet. Done repost icon = accent ink (not lime). Toast: readable ink pill, wrap 2 lines. |
| Solution Architect | `memberPricing.sourceRate` already on owner GET. Feed bump already on live published member add — verify. Gate conversion via existing `showBillTotalOnOrders` + `packConversion` on footer helper. |

---

## Platform consistency (required)

1. **Existing patterns?** Owner album detail, ExploreFeedActions done state, exploreActivityAt, createFromPack buyer-facing stamp, Settings bill chip.
2. **Duplicates?** No.
3. **Reuse?** Yes — same Settings chip for ₹ and conversion display.
4. **Naming?** Supplier ₹…; Reposted toast; Show bill total on orders (behaviour expanded).
5. **Units?** Whose = pack Rate per for Supplier line and Place stamp. Which = Rate per. Surface = owner album / DesignSheet (#7); OrderItem (#10); How many footer (#12). Pack Explore = collection.

**Philosophy conflict?** No for #7–#10. **#12:** Redesign of Nov 17 “keep conversion always visible on How many” — conversion display now settings-gated; sell-as math when ON unchanged.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Place pack-scoped; OrderItem immutable |
| Workflows | OK | |
| Edge cases | OK | Undisclosed source → no Supplier line |
| Permissions | OK | Trader-only cue |
| User states | OK | |
| Notifications | N/A | Toast only |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Toast BM-11 |
| First glance (BM-11) | OK | Active icon + toast |
| Units | OK | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — How many callers omit seller showBillTotal

| Field | Content |
|-------|---------|
| Gap | Callers often omit `showBillTotal`; conversion always shown |
| Why it matters | Default OFF still shows sets=pcs |
| Recommendation | Wire seller flag; `packConversion: billTotalAllowed` |
| Priority | Required before implementation |

---

## Approved scope

- #7 Owner curated: Supplier ₹ from `memberPricing.sourceRate` (album + DesignSheet); not Explore feed.
- #8 Done icon accent + readable Reposted toast.
- #9 Live verify feed bump; fix only if broken.
- #10 Two-pack different margin Place + immutability assert; docs lock.
- #12 How many/Amend: ₹ and pack conversion only when seller `showBillTotalOnOrders`; default OFF.

## Explicitly deferred

- #6 Repost-only ⋯ menu
- Avatar letter mismatch (#9 second half)
- Historical client order `#5H9H`

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
