# Feature Completeness Review — Order action dock

**Date:** 2026-09-23  
**Module / ask:** Sticky one-row desk CTAs above the bottom nav; order stays in the shell.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

Same chrome as Explore **Order / Ask for rates**. Not three stacked full-width buttons. Not a fullscreen takeover (create collection may hide tabs; this ticket does not).

## Approved scope

- One row, `fixed` above nav (`bottom-20`).  
- Requested (seller): ghost **Decline** · **Send quote** · **Send all** (teal when 2+ mills waiting; else quote is teal).  
- Confirmed / part shipped (seller): **Dispatch** (teal) · **Settle** only if `canSettle`.  
- Extra page padding so the last card clears dock + nav (BM-07).  
- Per-card mill Send / Decline unchanged. Confirm still off I-handle.

## Rejected

- Three equal fat buttons  
- Hiding the five-tab nav  
- Buyer Accept / Cancel / Raise return in this dock (stay on the page)  
