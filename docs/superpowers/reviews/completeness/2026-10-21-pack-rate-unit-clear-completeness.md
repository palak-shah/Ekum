# Feature Completeness Review — Pack Rate per + clear set size

**Date:** 2026-10-21  
**Module / ask:** Pack **Rate per** must be the Explore rate unit (₹91/mtr, not leftover /pc). Empty or **0** in **1 set contains** must clear pack size so How many Total does not convert or invent ₹.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/orders.md`, `2026-10-21-order-unit-chrome-completeness`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Rate per on the pack is the price unit traders see on Explore. A leftover /pc after they chose mtr is a lie. Typing 0 to empty “1 set contains” must mean no set — not keep 39 mtrs and bill 3×39×91. Same lock as order-unit chrome: no conversion / no ₹ without a defined set. |
| UX Designer | No new chrome. Apply to all stays for MOQ / notes / pack size. Rate amount already follows pack-rate designs; Rate per (unit + dispatch) must follow the same path so album and Explore match. How many Total already withholds `=` and ₹ when pack is null — clearing must actually PATCH null. |
| Solution Architect | Collection stores rupee only (`Collection.rate`). Explore infers `rateUnit` from members (`collectionCardRateFields`). Stamp `unit` + `dispatchUnit` onto `designFollowsPackRate` own designs whenever pack rate / Rate per saves — not only Apply to all. Empty/`0` → `piecesPerPack: null` (Zod already allows null). No Collection.rateUnit column this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Pack rate follower (`designFollowsPackRate`); Apply to all for units/MOQ/pack size; Explore `formatCatalogRate` via member `rateUnit`; How many Total withhold when pack unknown.  
2. **Duplicates another feature?** No — closes the gap between pack Rate per and Explore inference.  
3. **Should reuse an existing workflow?** Yes — same follower path as the rupee; same Total withhold as order-unit chrome.  
4. **Naming matches the app?** Rate per · 1 set contains · No pcs in a set.

**Philosophy conflict?** No — Explore must match what they typed; invented money is already rejected.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Stamp Rate per on followers; clear pack |
| Business rules | OK | Followers = no own rate or still on previous pack rate; Apply to all for pack size |
| Workflows | OK | Create/edit pack save; member sheet Done |
| Edge cases | OK | 0 vs blank; Apply off keeps design pack size; mixed member units omit Explore unit |
| Permissions | OK | Own-company designs only |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Zod rejects 0; client sends null |
| Scalability | N/A | Same per-member PATCH loop |
| Mobile interactions | OK | No new chrome; BM-07 N/A |
| First glance (BM-11) | OK | Explore vs album Rate per; How many after clear — trader-eye required |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred in writing below.

---

## Approved scope for this slice

- Pack Rate per is the Explore unit: saving pack rate / Rate per stamps `unit` + `dispatchUnit` onto own designs that follow the pack rate (same path as the rupee). Apply to all still stamps MOQ / notes / pack size onto everyone.
- Empty or `0` in **1 set contains** → `piecesPerPack: null`. Apply-to-all and member save both send null.
- How many Total with a cleared pack: `N sets` + **No pcs in a set**, no `=`, no ₹.
- Specs: pack 91 + Rate per mtr → Explore `₹91/mtr`; 0/blank PATCH null; footer does not convert.
- Trader-eye: Picasso-style pack on Explore vs album; How many after clearing set size.

## Explicitly deferred / rejected

- Storing pack `rateUnit` on Collection.
- Per-line `1 set = N` (except existing mixed-size cue).
- TEST deploy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
