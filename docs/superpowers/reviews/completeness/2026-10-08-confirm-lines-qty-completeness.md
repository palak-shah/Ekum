# Feature Completeness Review — Confirm lines editable qty

**Date:** 2026-10-08  
**Module / ask:** Seller may lower quantity on **Confirm / decline lines**; price stays read-only. Send quote remains for rate changes.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Confirm is yes/no + how much I can supply. Lowering qty locks without a quote round. Price changes stay on Send quote (buyer Accept). |
| UX Designer | Same sheet cards; Qty becomes a compact number field; Price stays a quiet fact. Row tick stays selection; qty input is not the decline tap. |
| Solution Architect | `decideOrderLinesSchema` already has optional `quantity`. Enforce ≤ current line qty (lower only). Wire UI payload. |

---

## Platform consistency (required)

1. **Existing patterns?** Compact sheet number input (quote offer qty / dispatch This LR).  
2. **Duplicates?** No — Confirm lowers at lock; Quote still counters rates.  
3. **Reuse?** `decideLinesPayload` + kit `TextInput`.  
4. **Naming?** Qty · Price facts; Confirm / Decline all unchanged.

**Philosophy conflict?** No — less to-and-fro without silent price change.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Optional qty on confirm action |
| Business rules | OK | Cap at current line qty; min 1; decline ignores qty |
| Workflows | OK | Confirm sheet only |
| Edge cases | OK | Empty/invalid → keep line qty; over-cap clamped / rejected |
| Permissions | OK | Seller while requested |
| Mobile / BM-11 | OK | Input not inside decline toggle hit target |
| Platform consistency | OK | |

---

## Approved scope

- Completeness + `orders.md` + gap matrix.  
- Confirm sheet: editable Qty, read-only Price.  
- Payload sends qty on confirm lines; API lower-only cap on current quantity.  
- Units for payload + clamp.

## Explicitly deferred

- Editable price on Confirm.  
- Removing / optionalizing Send quote.

## Sign-off

Required gaps closed or deferred: Yes  
Ready for implementation: Yes  
