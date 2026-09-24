# Feature Completeness Review — Confirm / decline lines (dispatch-style cards)

**Date:** 2026-09-21  
**Module / ask:** Confirm/decline sheet: dispatch-style cards; every open line is confirm or decline (no skip).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, dispatch sheet  
**Disposition:** Proceed

> Existing `POST /orders/:id/lines/decide`. Chrome matches Dispatch cards. Untick = **decline**, not pending. Partial qty stays on Dispatch.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | This screen must not leave lines open. Tick = confirm, off = decline. Leftover pieces are a later LR, not an undecided line. |
| UX Designer | Same tight card as Dispatch (tick, accent wash). No qty. Off card names **Decline**. Tally confirm count · decline count. Footer **Confirm** (needs ≥1 tick) and **Decline** (all open lines). |
| Solution Architect | Confirm payload: every open id with action from ticks. Decline payload: every open id `decline`. Same API. |

---

## Platform consistency (required)

1. **Existing patterns?** Dispatch cards + Raise a return tick; quote “all Can’t supply → Decline order” (Confirm disabled when 0 ticks).  
2. **Duplicates another feature?** **Confirm all open** remains the no-sheet shortcut. **Decline order** still kills the ticket from the page.  
3. **Should reuse an existing workflow?** Yes — decide lines. Do not merge with Dispatch.  
4. **Naming matches the app?** Confirm / Decline. Not Skip, Later, or pending.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Every open line decided on save |
| Business rules | OK | ≥1 confirm to Confirm; else Decline |
| Workflows | OK | Partial qty at Dispatch |
| Edge cases | OK | All off → Decline only |
| Permissions | OK | Seller, requested |
| User states | OK | Inquiry firms on confirm |
| Notifications | N/A | Existing chat pulse |
| Error handling | OK | In-sheet |
| Scalability | OK | Same 200-line cap |
| Mobile interactions | OK | Footer CTAs; note above |
| Accessibility | OK | Row `aria-pressed`; Decline named |
| Platform consistency | OK | Dispatch look, different verb |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Dispatch-style cards; default all on; tap off = decline.
- Footer **Confirm** / **Decline**; note + voice in body.
- Docs: Line outcomes — no skip; leftover at Dispatch.

## Explicitly deferred / rejected

- Qty on this sheet.
- Skip / leave open.
- Merging Confirm into Dispatch.

## Sign-off

Proceed.
