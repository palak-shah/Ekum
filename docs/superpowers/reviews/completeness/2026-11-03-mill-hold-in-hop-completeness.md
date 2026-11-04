# Feature Completeness Review — Mill Hold in linked hop

**Date:** 2026-11-03  
**Module / ask:** Move Hold/Resume from Manage mill card ⋯ into the released mill hop’s existing top MoreActionsSheet; clarify Manage Notes = buyer↔trader.  
**Anchors:** `docs/features/orders.md`, `2026-11-03-ihandle-desk-html-parity-completeness`, pass-through `shouldPassThrough` / `passHeldAt`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

**Architecture lock:** Hold still pauses pass-through (`passHeldAt` on the mill hop). UI only moves: rare Hold/Resume last in mill hop **top** ⋯ (`order-more-sheet`). Manage parent shows Held cue only. Parent Notes remain buyer↔trader; mill hop Notes stay trader↔mill.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Hold is rare — belongs on the linked mill ticket, not the desk face. |
| UX Designer | Existing PageHeader ⋯; last item. Parent mill card stays quiet list-row open. Notes subtitle must not imply mills. |
| Solution Architect | Same `POST /orders/{parent}/mill-hold`. Expose `passHeld` on hop GET from `passHeldAt`. No schema. |

---

## Platform consistency

1. Existing patterns? Yes — MoreActionsSheet rare-last; millPassHold API.  
2. Duplicate? No.  
3. Reuse workflow? Yes.  
4. Naming? Hold / Resume plain.  
5. Units? N/A.

**Philosophy conflict?** No. Hold before Send / parent operate → Reject.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Hold still on parent card ⋯ |
| Business rules | OK | |
| Workflows | Gap | Relocate |
| Edge cases | OK | Held bounce unchanged |
| Permissions | OK | Seller Manage only on API |
| First glance (BM-11) | Gap | Notes “Both sides” vague on Manage |
| Units | N/A | |

---

## Gaps

### G-001 — Hold on Manage mill card

| Field | Content |
|-------|---------|
| Recommendation | Move to mill hop top ⋯ last; remove parent card Hold. |
| Priority | Required |

### G-002 — Manage Notes “Both sides”

| Field | Content |
|-------|---------|
| Recommendation | On Manage with mill desks: subtitle you and the buyer. |
| Priority | Required |

### G-003 — Hold before Send / You hop Hold

| Field | Content |
|-------|---------|
| Recommendation | **Reject**. |
| Priority | Reject |

---

## Approved scope

- Completeness + orders.md lock.  
- `passHeld` on released mill hop OrderView.  
- Hold/Resume last in hop `order-more-sheet`; remove parent mill Hold.  
- Manage Notes subtitle buyer↔trader when mill desks.  
- Unit + functional + BM-11.

## Explicitly deferred / rejected

- Hold before Send; You-hop Hold; merging note threads; schema.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
