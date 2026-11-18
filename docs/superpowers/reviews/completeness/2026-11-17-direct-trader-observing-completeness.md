# Feature Completeness Review — Direct trader role + Observing

**Date:** 2026-11-17  
**Module / ask:** Sheet #23–#25 — Direct Link facilitator: show trader role + trio; pre-accept amend/Cancel; after mill accept **Observing** (hide seller Needs-you / CTAs).  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`, Completeness `2026-09-20-direct-shared-seller-ctas`  
**Disposition:** Proceed (Redesign of Shared watch-only for pre-accept amend/Cancel only)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Direct = mill sells to buyer; trader facilitates. Pre-accept: amend + Cancel + Handle myself. Post-accept: Observing — not Dispatch. I-handle stays middleman masking (separate path). |
| UX Designer | Party line **trader**; Open group chat → trio; accent **Observing** after mill progress; no new Orders tab. |
| Solution Architect | Gate Needs you / seller docks on real seller; widen amend/cancel to facilitator in `canTakeControl` window. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — facilitator, trio `threadId`, Handle myself, kit party lines.  
2. **Duplicates another feature?** No — Observing is Direct-only cue, not I-handle.  
3. **Should reuse an existing workflow?** Yes — amend/cancel windows mirror buyer pre-progress; Confirm/Dispatch stay mill.  
4. **Naming matches the app?** **Observing** (not Shared); **trader** party label; Handle myself unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No — Redesign only expands pre-accept amend/Cancel; mill still owns Confirm/quote/dispatch on Direct.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Role + trio + amend/Cancel + Observing |
| Business rules | OK | Same window as `canTakeControl` for edit/Cancel |
| Workflows | OK | Handle myself → I-handle middleman (mask); not mill proxy |
| Edge cases | OK | Gray DL / true mill / buyer unchanged |
| Permissions | OK | Seller CTAs still `sellerCompanyId === actor` |
| User states | OK | Pre-accept vs Observing |
| Notifications | N/A | |
| Error handling | OK | API deny after mill progress |
| Scalability | N/A | |
| Mobile interactions | OK | Fewer fake CTAs (BM-07) |
| First glance (BM-11) | OK | Observing quieter than Dispatch |
| Units | N/A | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice. Deferred: late take-over when mill silent after confirm; soft-hide copy on I-handle parents.

---

## Approved scope for this slice

- Party line **trader** + Open group chat to trio on Direct.  
- Facilitator amend qty/rates + Cancel while `requested` and no mill progress.  
- After mill progress: accent **Observing**; hide Confirm/Dispatch/Needs you for facilitator; notes + trio stay.  
- Docs: replace Shared watch-only with Observing + pre-accept edit.  
- Units + trader-eye.

## Explicitly deferred / rejected

- Trader Confirm / Decline / quote / Dispatch on Direct (use Handle myself → I-handle middleman).  
- Observing tab / move off Selling.  
- Late Handle myself after mill confirm (adoption follow-on).  
- Soft-hide / via-trader on I-handle parents (# separate).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
