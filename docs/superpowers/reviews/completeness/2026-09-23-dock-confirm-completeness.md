# Feature Completeness Review — Dock Confirm (one button)

**Date:** 2026-09-23  
**Module / ask:** Merge **Confirm / decline lines** + **Confirm all open** into one dock button, middle of the sticky row.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

Two page buttons for the same job (lock lines vs lock every open line). Sheet already defaults all on — **Confirm** in the sheet is confirm-all. One dock **Confirm** opens that sheet. I-handle still has no Confirm (Send first).

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One path. Drop the extra tap. |
| UX Designer | Dock: ghost Decline · **Confirm** (secondary) · Send quote (teal). Not a third teal. Mills desk unchanged. |
| Solution Architect | Reuse `orderActionDock` + existing lines sheet. No API change. |

## Platform consistency

1. Same dock chrome as Send quote / Dispatch.  
2. Drops the Confirm-all shortcut (duplicate of sheet defaults).  
3. Reuse Confirm / decline lines sheet.  
4. Label **Confirm** — short; sheet title stays **Confirm / decline lines**.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Opens existing sheet |
| Business rules | OK | I-handle Confirm stays off |
| Workflows | OK | |
| Edge cases | OK | Dock shows if Confirm and no quote |
| Permissions | OK | Seller + requested only |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | In-sheet |
| Scalability | N/A | |
| Mobile interactions | OK | Same dock height (BM-07) |
| Accessibility | OK | Named button |
| Platform consistency | OK | |

## Approved scope

- One **Confirm** in the requested seller dock when there are no mill desks.  
- Before a quote: **Decline · Confirm · Send quote** (quote teal). After a quote: **Decline · Send quote · Confirm** (Confirm teal).  
- Opens the existing lines sheet. Remove the two page buttons.  
- Remove **Confirm all open**.

## Explicitly deferred / rejected

- Confirm on I-handle desk  
- Teal Confirm (quote / Send all stay the primary)

## Sign-off

Proceed.
