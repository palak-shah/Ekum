# Feature Completeness Review — Send all waiting mills

**Date:** 2026-09-23  
**Module / ask:** Send all mills without a per-shop tap; send remaining after Decline; vs a confirm/decline-lines sheet.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two+ mills is busy. Send all waiting lots in one tap. Decline one shop, then Send all = the rest. |
| UX Designer | **Not** a mill picker sheet — cards already have qty/rate. One compact **Send all** above the mill cards when 2+ still waiting. Per-card **Send · Decline** stay for one shop. |
| Solution Architect | `POST send-up` without `upstreamOrderId` already releases every Requested held hop. Skip declined. Patch qty/rate from all held cards. |

---

## Platform consistency (required)

1. **Existing patterns?** Mill card Send; kit chip-sized CTA.  
2. **Duplicates?** A confirm/decline-lines sheet for mills would redraw the same shops. Reject that.  
3. **Reuse?** Existing send-up all-waiting.  
4. **Naming?** **Send all**. After one Decline, same control = remaining.

**Philosophy conflict?** No.

---

## Approved scope

- **Send all** when 2+ mill cards are still waiting (held).  
- Uses qty/rate already on those cards.  
- After Decline, remaining held mills still Send / Send all.  
- Shorter Send / Decline (override kit `min-h-12`).  

## Explicitly deferred / rejected

- Mill picker sheet (confirm/decline lines for shops)  
- Send all when only one mill is waiting  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
