# Feature Completeness Review — `orders` / part shipped main status

**Date:** 2026-09-07  
**Module / ask:** Partial dispatch should show **Part shipped** as the main StatusPill / list status, not **Confirmed** with a secondary cue.  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-06-settle-order-and-order-trail-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already say “Part shipped”; keeping Confirmed as the pill while a secondary cue says Part shipped is misleading. One status token for the open part-ship window matches Settle / Dispatch more. |
| UX Designer | Drop redundant subtitle when the pill is Part shipped. Progress/Needs filters must still include these tickets. |
| Solution Architect | Add `OrderStatus.PartShipped` (`part_shipped`). Write on partial dispatch; allow further dispatch + settle from it; full remaining → `dispatched`. Serializer remaps legacy `confirmed` + shipments to view status `part_shipped`. Trail type already `part_shipped`. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — StatusPill + plain trader labels; trail already uses Part shipped.  
2. **Duplicates another feature?** No — replaces derived cue with canonical status.  
3. **Should reuse an existing workflow?** Yes — same Dispatch more / Settle paths.  
4. **Naming matches the app?** **Part shipped** (already used in copy/trail).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Partial → `part_shipped`; full → `dispatched`; settle → `settled` |
| Business rules | OK | Dispatch from confirmed \| part_shipped; settle only when shipped & remaining |
| Workflows | OK | No new screens |
| Edge cases | OK | Legacy confirmed+shipments remapped on read |
| Permissions | OK | Seller-only dispatch/settle unchanged |
| User states | OK | Progress includes part_shipped |
| Notifications | OK | Chat card metadata status = part_shipped |
| Error handling | OK | Invalid transition messages |
| Scalability | N/A | |
| Mobile interactions | N/A | No chrome change |
| Accessibility | OK | Pill text clearer |
| Platform consistency | OK | |

---

## Gaps

None Required. Deferred: backfill DB rows from confirmed+shipments (view remap is enough for this slice).

---

## Approved scope for this slice

- `OrderStatus.PartShipped` + labels/tones/filters/cues/attention  
- Partial dispatch writes `part_shipped`; mill→parent status update when applicable  
- Settle / Ask payment / further dispatch accept `part_shipped`  
- Docs + unit coverage  

## Explicitly deferred / rejected

- DB backfill migration for historical confirmed+partial rows  
- Buyer cancel from `part_shipped`  

## Sign-off

Proceed — implement approved scope only.
