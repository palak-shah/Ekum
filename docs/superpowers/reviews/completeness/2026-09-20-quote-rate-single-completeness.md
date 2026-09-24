# Feature Completeness Review — Quote rates are a single rupee (no range)

**Date:** 2026-09-20  
**Module / ask:** Send quote Same for all + line Rate: one number only (not catalog `1200-1400`). Digits must not clip in the pill.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

Quote is a firm ₹ per piece. Range belongs on catalog publish, not this sheet.

## Approved scope

- Parse/Apply a single positive rate (commas ok). Hyphen rejected.
- Same for all + line Rate: decimal keypad, no catalog range placeholder.
- Wider rate column / padding so values like `2450` / `12500` stay fully visible.

## Deferred

- Order-line `rateMax`.

## Sign-off

Yes · 2026-09-20
