# Feature Completeness Review — Order ticket heading is id only

**Date:** 2026-10-21  
**Module / ask:** Page heading was `Order #BI6M · Ahmedabad Loo…` while the next card already says **supplier · Ahmedabad Loom Co**. Heading = order id only.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop belongs on the parties card (supplier / buyer). Repeating it in the sticky title truncates and wastes the one job of the heading (which ticket). |
| UX Designer | `PageHeader` title = `Order #id` / `Inquiry #id`. Status pill stays. ⋯ sheet title matches. Inquiry chip already marks inquiries. |
| Solution Architect | Copy only. |

---

## Platform consistency (required)

1. **Existing patterns?** Parties card already names the shop.  
2. **Duplicates another feature?** Removes a duplicate.  
3. **Should reuse an existing workflow?** `shortOrderLabel`.  
4. **Naming matches the app?** Order # / Inquiry #.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Display only |
| Business rules | N/A | |
| Workflows | OK | Back · ⋯ unchanged |
| Edge cases | OK | Inquiry uses Inquiry #; mill tickets still show mill on supplier line |
| Permissions | N/A | |
| User states | OK | Buying / selling / Shared |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Title no longer truncates mid-shop |
| First glance (BM-11) | OK | Id is loud; shop is the parties card |
| Accessibility | OK | h1 is the order id |
| Platform consistency | OK | |

---

## Gaps

None.

## Approved scope for this slice

- Order detail `PageHeader` title = `shortOrderLabel` only.
- More sheet title matches.

## Explicitly deferred / rejected

- Changing list row titles (list still uses shop + Order #).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes — copy; no new journey.
