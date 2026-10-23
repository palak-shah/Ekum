# Feature Completeness Review — Rate per independent of Dispatch

**Date:** 2026-10-22  
**Module / ask:** Rate per unit and Dispatch unit must be able to differ (collection / design / Catalog defaults).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/settings.md`, `.cursor/rules/sell-as-units.mdc`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Three units already exist: order taken in, dispatch (what they send), Rate per (what ₹ is per). Encoding Rate per on `dispatchUnit` made Dispatch flip to mtr when they priced /mtr. Traders send sets and bill metres. |
| UX Designer | No new chrome. Rate per select writes Rate per only. Order and dispatch accordion keeps its own Dispatch unit. **1 set contains** suffix stays the Rate per unit. |
| Solution Architect | Add `catalogRateUnit` on Collection, Product, OrderItem. Infer from dispatch≠order when null (legacy). `catalogRateUnit()` prefers the stored value. Stamp members with Rate per without rewriting dispatch. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Rate per select + Order and dispatch accordion.  
2. **Duplicates another feature?** No — undoes the 2026-10-10 “syncs dispatch” encoding.  
3. **Should reuse an existing workflow?** Collection / design / Catalog defaults already show both controls.  
4. **Naming matches the app?** Rate per · Dispatch unit · Order taken in.  
5. **Units?** Pack: whose = collection, then stamped own designs. Which: Rate per = `catalogRateUnit`; dispatch = `dispatchUnit`; order = `unit`. Explore ₹ uses Rate per. Blank pack size still no invented ₹.

**Philosophy conflict?** No — current coupling fights the three-unit model.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Rate per change must not write Dispatch; Dispatch change must not write Rate per |
| Business rules | OK | Legacy: dispatch≠order still infers Rate per until saved |
| Workflows | OK | Collection Update, design save, Catalog defaults |
| Edge cases | OK | Fabric coerce pc→offered unit writes Rate per only |
| Permissions | N/A | |
| User states | OK | Hydrate stored Rate per even when dispatch is set |
| Notifications | N/A | |
| Error handling | OK | Failed Update still toasts |
| Scalability | OK | One nullable text column |
| Mobile interactions | OK | No new sticky chrome |
| First glance (BM-11) | OK | Rate per mtr + Dispatch set must both show after reload |
| Units (order / dispatch / Rate per) | OK | Three fields; Explore pack = collection Rate per |
| Accessibility | OK | Existing labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Rate per stored on dispatch

| Field | Content |
|-------|---------|
| Gap | Changing Rate per mtr sets Dispatch to mtr |
| Why it matters | Order/dispatch journey is sets; ₹ is often /mtr or /pc |
| Impact if ignored | Traders cannot describe send-in-sets / bill-in-metres |
| Recommendation | `catalogRateUnit` column + stop writing Rate per onto dispatch |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Persist `catalogRateUnit` on Collection, Product, OrderItem (snapshot at order).
- Rate per select writes `catalogRateUnit` only.
- Dispatch unit stays independent.
- Infer Rate per from legacy dispatch≠order when the column is null.
- Catalog defaults Rate per does not write Dispatch.
- Docs + units; trader-eye on Live pack (Rate per mtr, Dispatch set).

## Explicitly deferred / rejected

- Converting historical OrderItems (they keep inference).
- Separate Rate per vs order unit on the native (non-pack) path beyond keeping dispatch.
