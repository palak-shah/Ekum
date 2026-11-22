# Feature Completeness Review — `how-many-separators-bill-total`

**Date:** 2026-11-22  
**Module / ask:** How many sheet — shop·pack separators (no “N orders” banner); footer ₹ gated by Settings  
**Anchors:** `docs/features/orders.md`, `docs/features/settings.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mixed baskets need honest shop+pack sections without a scary “This becomes N orders” header. Billing ₹ stays Settings-default-off. |
| UX Designer | Separators are **subtle** — muted text, not foam banners or loud rules. Repeat shop name when shops differ. |
| Solution Architect | Reuse `showBillTotalOnOrders` (tickets already); group key = shop + collection; Place batching unchanged. |

---

## Platform consistency

1. Existing patterns? Kit muted meta; Settings chip under Billing.  
2. Duplicates? No.  
3. Reuse workflow? How many / Place.  
4. Naming? Shop business name · pack name — no Supplier/Trader labels.  
5. Units? N/A (chrome only; ₹ gate only).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Separators + bill gate |
| Business rules | OK | Place still multi-ticket |
| Workflows | OK | |
| Edge cases | OK | Multi-shop: money only if every seller flag on |
| First glance (BM-11) | OK | Subtle separators; no loud N-orders banner |
| Units | N/A | |

---

## Approved scope

- Drop `This becomes N orders` banner on How many
- Subtle `{shop} · {pack}` section headings (repeat shop when different)
- How many / Amend footer `money` only when `showBillTotalOnOrders` true for relevant seller(s)
- Docs lock + tests

## Explicitly deferred

- Pack-only Edit rate (separate)
- Merging multi-shop into one Order
- Changing Direct/I-handle waves

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes  
