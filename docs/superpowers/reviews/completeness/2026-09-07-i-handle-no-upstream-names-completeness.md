# Feature Completeness Review — `orders` / I-handle no upstream names

**Date:** 2026-09-07  
**Module / ask:** Close mill-name disclosure on buyer↔trader parent ticket (trail + chat). Approach A.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-i-handle-no-upstream-names-design.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Soft-hide is a trust invariant across multi-hop chains. One leak = crime-level trust failure. |
| UX Designer | Parent timeline stays trader-attributed; mill detail stays on subset cards. |
| Solution Architect | Fix writes + scrub reads; never rely on UI-only hide. |

---

## Platform consistency (required)

1. **Existing patterns?** Soft-hide on relatedOrders already nulls upstream names for end buyer.  
2. **Duplicates?** No.  
3. **Reuse?** Same Manage / soft-hide philosophy.  
4. **Naming?** Plain Confirmed / Dispatched — no Seller/Buyer jargon.

**Philosophy conflict?** No — ask restores philosophy.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Pass-through still updates qty/status |
| Business rules | OK | Zero upstream names on parent surface |
| Workflows | OK | Trader uses mill cards |
| Edge cases | OK | Legacy poisoned trail/chat scrubbed |
| Permissions | OK | Scrub by viewer role |
| User states | OK | Buyer / trader / mill |
| Notifications | OK | Chat body buyer-safe |
| Error handling | N/A | |
| Scalability | OK | Chain-safe |
| Mobile interactions | N/A | |
| Accessibility | N/A | |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

---

## Approved scope

- Buyer-safe pass-through trail + chat writes  
- listForViewer / message scrub for end buyers on Manage parents  
- Units proving mill name never appears on buyer parent view  
- Docs + gap matrix  

## Explicitly deferred

- DB rewrite migration of historical trail rows (scrub on read is enough)  
- Reveal-on group UX  

## Sign-off

Proceed.
