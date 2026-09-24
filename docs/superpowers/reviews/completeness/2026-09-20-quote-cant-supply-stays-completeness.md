# Feature Completeness Review — Quote sheet keeps Can’t supply lines

**Date:** 2026-09-20  
**Module / ask:** Marking **Can’t supply** must not remove the design from Send quote. Reopening the sheet shows every still-quotable line; previously declined stay listed with Can’t supply checked (locked).  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

Today the sheet lists `open` only, and open resets checks. After a quote, declined lines vanish on reopen.

## Approved scope

- Sheet rows = open + declined (not confirmed/dispatched).
- Check Can’t supply: row stays; qty/rate show Can’t supply.
- Reopen: declined → checked + disabled. Unsent checks kept in session.
- Same for all still skips Can’t supply lines.
- API: do not resubmit declined ids (`LINE_DECLINED` unchanged).

## Sign-off

Yes · 2026-09-20
