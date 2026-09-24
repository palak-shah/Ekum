# Feature Completeness Review — Quote Can’t supply: gray declined, untick restores

**Date:** 2026-09-20  
**Module / ask:** Checked Can’t supply grays the row and shows Declined. Seller may untick; row returns to live qty/rate. Re-quote may restore a previously declined line.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

## Approved scope

- Checked → gray row, muted name, **Declined** + Can’t supply on.
- Untick → full colour, qty/rate editable again.
- Reopen: declined default checked; `prev` false (untick) wins so they can bring it back before send.
- API: allow a declined line in a later quote when it has a rate (re-open). Still skip auto-unavailable for already declined omitted lines.

## Sign-off

Yes · 2026-09-20
