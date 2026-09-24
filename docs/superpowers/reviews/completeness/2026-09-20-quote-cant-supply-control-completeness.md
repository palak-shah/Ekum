# Feature Completeness Review — Quote Can’t supply stays clickable

**Date:** 2026-09-20  
**Module / ask:** Declined quote rows gray the design, not the Can’t supply control.  
**Anchors:** `docs/features/orders.md`  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Seller must see the line as declined and still know they can take it back. |
| UX Designer | Whole-row fade looks disabled. Mute photo/name/qty/rate; keep Can’t supply full contrast. One live control — drop duplicate “Can’t supply” in the rate cell. |
| Solution Architect | CSS split only; same checkbox + untick rules. |

## Platform consistency

1. Existing patterns? Same secondary checkbox on Send quote.  
2. Duplicates? No.  
3. Reuse workflow? Same sheet.  
4. Naming? Can’t supply / Declined.

**Philosophy conflict?** No

## Approved scope

- Design block (thumb, name, Declined, qty/rate dashes) muted.
- **Can’t supply** checkbox + label stay full colour and tappable.
- Rate cell is **—**, not a second Can’t supply string.

## Sign-off

Yes · 2026-09-20
