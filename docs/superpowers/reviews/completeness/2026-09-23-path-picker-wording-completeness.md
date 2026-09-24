# Feature Completeness Review — Path picker wording

**Date:** 2026-09-23  
**Module / ask:** I-handle **This order is with** two cards confuse traders (sounds like “show supplier”). Show **only the selected** path; tap opens the other choice like a dropdown. Clearer words. Same chrome on Your paths.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same two outcomes (You vs mills; group On/Off). No new path. Traders need one selected line, not a lecture. |
| UX Designer | Two stacked cards waste space and look like a switch. Closed row + menu matches mill ⋯. Words: **Buyer talks to** / **You** / shop or **These mills**; mill row **Share a group**. |
| Solution Architect | Live flip + Your paths PATCH unchanged. Testids stay on menu items (`order-ticket-me` / `order-ticket-mill`). |

---

## Platform consistency (required)

1. **Existing patterns?** Closed row + small menu (mill card ⋯). Accent-border selected. Kit Sheet not needed for two choices.  
2. **Duplicates another feature?** No — same TradeLane.  
3. **Should reuse an existing workflow?** Your paths uses the same words and closed picker.  
4. **Naming matches the app?** **You** not Me/With me; **Share a group** not “See each other” (that sounded like show-supplier).

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Flip + reveal APIs unchanged |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | 1 mill = shop name; 2+ = These mills + quiet names |
| Permissions | N/A | |
| User states | OK | `canFlipTicket` still gates the pick |
| Notifications | N/A | |
| Error handling | OK | Existing flip toast |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome |
| Accessibility | OK | summary + aria-label; ? pop unchanged |
| Platform consistency | OK | User asked for dropdown; mill ⋯ menu |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Order desk: one selected **Buyer talks to** row; tap opens You / mill.  
- Mill card: **Share a group** · ? · On/Off.  
- Your paths: same words + closed ticket pick.  
- Docs + units + e2e copy/testids.

## Explicitly deferred / rejected

- Moving path off the desk (Your paths only).  
- Changing flip / reveal rules.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
