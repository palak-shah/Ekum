# Feature Completeness Review — Same for all qty: cursor on open

**Date:** 2026-09-23  
**Module / ask:** Tap Same for all on How many each / order builder focuses the piece count and selects it so the next digit replaces.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | They opened the chip to change qty — a second tap on the box is waste. |
| UX Designer | Match Send quote rate field (`autoFocus`). Select the current number. Per-line steppers unchanged. |
| Solution Architect | `QtyStepper` optional `autoFocus` + `select()` on focus. Client-only. |

## Platform consistency

1. Existing patterns? Same for all chip + editor; quote rate already autofocuses.  
2. Duplicates? No.  
3. Reuse? QtyStepper on How many each / order builder.  
4. Naming? Same for all.

**Philosophy conflict?** No

## Approved scope

- Shared stepper only (`autoFocus`). Focus + select current qty.
- How many each + order builder.

## Sign-off

Yes · 2026-09-23
