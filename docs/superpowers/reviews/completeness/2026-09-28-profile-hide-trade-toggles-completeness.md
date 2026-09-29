# Feature Completeness Review — Remove Trade on Ekum from Profile

**Date:** 2026-09-28  
**Module / ask:** Edit / Business profile: drop the **Trade on Ekum** card (I buy / I sell / I trade).  
**Anchors:** `docs/features/settings.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Profile is identity (name, photo, city, types). Buy/sell/trade switches are platform plumbing, not everyday Edit. Creating a design still turns selling on. |
| UX Designer | Remove the whole card. No replacement toggles on You or Settings this slice. |
| Solution Architect | API `buyingEnabled` / `sellingEnabled` / `tradingEnabled` stay. Seed and `ensureSellingEnabled` still set them. No Profile `PUT /settings` for presence. |

---

## Platform consistency (required)

1. **Existing patterns?** Edit = business identity. Settings = configure Ekum (paths, catalog defaults).  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Selling-on via catalog create already exists.  
4. **Naming matches the app?** Profile copy no longer says I buy/sell/trade.

**Philosophy conflict?** No. Flags remain; traders no longer pick a “side” on Edit.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Hide only |
| Business rules | OK | Flags unchanged |
| Workflows | OK | Explore still `?focus=sell` for sell categories |
| Edge cases | OK | Curate when trading off: no Profile toggle instruction |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Approved scope

- Remove Trade on Ekum card + TradeToggle from Profile.
- Curate-not-trading copy: no “turn on in Profile”.
- Docs: presence not on Edit.
- E2E: profile does not show I trade on Ekum.

## Explicitly deferred

- A Settings home for buy/sell/trade toggles.
- Forcing every company to trading on.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
