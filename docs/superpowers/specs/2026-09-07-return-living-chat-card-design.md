# Return → living order pulse (minimal)

**Date:** 2026-09-07  
**Status:** Shipped (revised)  
**Anchors:** `docs/features/orders.md`, living `order_card` pulses  

## Decision (revised)

No dedicated return card language. On **raise** only, update the existing living **order** card:

| Element | Content |
|---------|---------|
| Title | `Order #… Returned` |
| Note | Optional raise reason (text); voice stays on Timeline / return block |
| Action | **View order →** (same as other order pulses) |

Approve / partial / decline / resolve do **not** rewrite the chat card (notification + Timeline only).

## Explicitly out

- Return approved / partial / declined chat pulses  
- Separate return message type  
- Voice player on the pulse  

## Sign-off

Product chat: minimal order pulse 2026-09-07.
