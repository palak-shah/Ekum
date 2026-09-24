# Feature Completeness Review — Buyer action dock

**Date:** 2026-09-23  
**Module / ask:** Same sticky dock for the buyer as the seller (unified ticket). Edit / Cancel were page-only.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

One desk, one chrome. Buyer verbs belong in the same row above the nav.

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Edit / Cancel / Accept quote / Raise a return are the buyer job. Sticky like seller Confirm / quote. |
| UX Designer | Same dock: ghost left · secondary middle · teal right. Not two fat page outlines. |
| Solution Architect | Extend `orderActionDock`; reuse existing sheets. No API change. |

## Platform consistency

1. Same `order-action-dock` as seller.  
2. Does not duplicate seller verbs.  
3. Reuse Edit / Cancel / Accept quote handlers.  
4. **Edit order** / **Cancel order** / **Accept quote** / **Raise a return**. Inquiry: Edit inquiry / Cancel inquiry.

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Logged ticket: Decline + Accept, not Cancel+Decline |
| Workflows | OK | |
| Edge cases | OK | Confirmed = Cancel only; after ship = Raise a return |
| Permissions | OK | Buyer only |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Existing sheets / toasts |
| Scalability | N/A | |
| Mobile interactions | OK | Same dock height, existing `pb-24` (BM-07) |
| Accessibility | OK | |
| Platform consistency | OK | |

## Approved scope

- Buyer requested: ghost **Cancel** · **Edit** (if amend) · teal **Accept quote** (if quoted).  
- Logged ticket: ghost **Decline** · **Edit** · teal **Accept**.  
- Confirmed: ghost **Cancel**.  
- Dispatched / settled / delivered: teal **Raise a return**.  
- Remove those page buttons. Handle myself stays on the page.

## Explicitly deferred / rejected

- Handle myself in the dock  
- Buyer verbs on the seller dock  

## Sign-off

Proceed.
