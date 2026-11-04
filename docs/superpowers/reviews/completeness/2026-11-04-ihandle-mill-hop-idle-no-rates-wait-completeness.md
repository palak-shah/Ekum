# Feature Completeness Review — Mill hop idle + no rates wait + Buy/Sell card

**Date:** 2026-11-04  
**Module / ask:** I-handle Manage mill card Buy≈/Sell + progress; no wait-for-rates; mill hop idle Chat + accept wait (+ qty Edit); platform rate/qty/mapping invariant.  
**Anchors:** `docs/features/orders.md`, `2026-11-04-ihandle-desk-goods-go-mill-wait-completeness`, ui-quality-bar, sell-as-units  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | No rate haggling on ticket. Supplier edits rate on Confirm; buyer qty until Confirm; supplier qty anytime. Buy≠Sell shown on mill card. |
| UX Designer | Open row: Buying # · waiting to confirm. Dock: Chat + wait + qty Edit. One wait place. Kit type/space. (Verb locked to confirm: `2026-11-04-mill-wait-confirm-verb`.) |
| Solution Architect | One DB rule: `OrderItem.rate` per ticket line; hop→parent via `sourceItemId` only. No buyRate/sellRate columns. |

## Platform consistency

1. **Existing patterns?** FulfilmentDeskCard, SellingDockChat, mill desks join, amend qty.  
2. **Duplicates?** Replaces From/To column grid with Buy≈/Sell line chrome.  
3. **Reuse?** Existing desk `millRate` / parent `item.rate`.  
4. **Naming?** Waiting to confirm / Waiting for {shop} to confirm.  
5. **Units?** Qty = order unit; ₹ = Rate per on design line; whose = pack member design on mill card.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Idle dock + Buy/Sell + no rates wait |
| Business rules | OK | Platform rate+mapping; qty windows |
| Workflows | OK | Send → wait accept → mill Confirm |
| Edge cases | OK | Equal rates → single ₹; Held cue |
| Permissions | OK | Buyer amend until confirm; supplier rate on Confirm |
| Notifications | N/A | |
| Errors | OK | Existing toast/sheet |
| Scalability | OK | N mill cards |
| Mobile | OK | BM-11; dock clearance |
| Accessibility | OK | Chat aria; Edit keeps label |

## Gaps

| ID | Gap | Severity | Disposition |
|----|-----|----------|-------------|
| — | — | — | — |

## Rejects

- Path-specific `buyRate`/`sellRate` columns  
- Accept-quote as rate-haggle on mill hop  
- Waiting-for-rates copy  
- Second mapping style beside `sourceItemId`

## Sign-off

Ready for implementation: Yes  
