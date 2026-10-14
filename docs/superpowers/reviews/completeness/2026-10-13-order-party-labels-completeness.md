# Feature Completeness Review — Order detail Purchase / Sales party labels

**Date:** 2026-10-13  
**Module / ask:** Correct order-detail party labels to classic trader books language: Purchase party = shop I buy from (supplier / `seller*`); Sales party = shop I sell to (customer / `buyer*`). Rename Selling party → Sales party.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Redesign (naming only) → Proceed after docs lock

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Prior labels inverted books language (Purchase showed buyer). Traders expect Purchase = supplier, Sales = customer. Visibility (one counterpart / both on trader desk) stays; only label↔role mapping changes. |
| UX Designer | Keep quiet party lines, no Parties header/(you). Buyer → Purchase party only; seller → Sales party only; trader / tri-visible → both in order Purchase then Sales. |
| Solution Architect | UI-only in `orderPartyLines`; API stays `buyer*` / `seller*`. No schema or DTO change. |

---

## Platform consistency (required)

1. **Existing patterns?** Same party card + `orderPartyLines` helper.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — only remap labels.  
4. **Naming matches the app?** Plain books language: Purchase party / Sales party (not Seller/Buyer jargon on the card).

**Philosophy conflict?** Yes (prior “Purchase = buyer” fought trader books sense) → **Redesign** naming; then Proceed.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Label + mapping swap |
| Business rules | OK | Absolute hop roles unchanged |
| Workflows | OK | Detail only |
| Edge cases | OK | Trader + tri-visible both lines |
| Permissions | N/A | |
| User states | OK | Buying / selling / manage / tri |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No chrome change (BM-07 N/A) |
| First glance (BM-11) | OK | Same quiet lines; verify names match books sense |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Docs lock prior Selling / Purchase mapping

| Field | Content |
|-------|---------|
| Gap | `orders.md` and 2026-10-07 completeness describe buyer ↔ Selling, seller ↔ Purchase |
| Why it matters | Silent drift |
| Impact if ignored | Spec/tests fight product |
| Recommendation | Update Clarity + gap matrix; leave 2026-10-07 as historical; this review supersedes party naming |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Remap: Purchase party → `seller*`; Sales party → `buyer*`
- Rename Selling party → Sales party
- Visibility: buying → Purchase only; selling → Sales only; trader/tri → both `[Purchase party, Sales party]`
- Unit + e2e string updates
- Lock `docs/features/orders.md` + gap matrix

## Explicitly deferred / rejected

- No API rename of buyer/seller fields
- No change to You buy / You sell list chrome

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
