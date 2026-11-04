# Feature Completeness Review — Confirm sheet + type ladder parity

**Date:** 2026-11-04  
**Module / ask:** Confirm list chrome closer to Accept prototype (no tally / no Order-in; hairline rows) while keeping live Title+circle i and equal Decline|Confirm. Shared type ladder (title name · muted cue · emphasis qty) on ticket Designs, Confirm, and Dispatch cues. Ticket Notes Send always visible, grayed when empty.  
**Anchors:** `docs/features/orders.md`, `2026-11-04-confirm-dispatch-prototype-chrome-completeness`, `designLineChrome.ts`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Confirm job = tick + qty/rate. Tally chip fought the CTA. Type ladder is shared chrome, not a new workflow. |
| UX Designer | Keep Title+i and equal footer (live locks). Hairline decide rows. Send always present so Notes is a composer, not a textbox. Settle strip deferred. |
| Solution Architect | Shared `designQtyClass` / `designSubtextClass`; Confirm-only list chrome; no Send on sheet hop composers. |

---

## Platform consistency (required)

1. **Existing patterns?** `OrderDesignTitle`, `designLineChrome`, ticket Notes composer, kit Sheet InfoHint.  
2. **Duplicates?** No.  
3. **Reuse?** Same type tokens on ticket / Confirm / Dispatch.  
4. **Naming?** Confirm (not Accept); Decline all; Asked.  
5. **Units?** Unchanged — Asked / qty / Rate per still design-line order qty and Rate per.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Empty Confirm list still shows notice |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 dock/sheet unchanged |
| First glance (BM-11) | OK | No tally; Asked quieter than steppers; grayed Send |
| Units | OK | No ₹/qty string invent |
| Accessibility | OK | Send disabled when empty; InfoHint stays |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope

- `designQtyClass`; ticket qty + Confirm Asked + Dispatch progress via shared classes
- Confirm: remove tally; `hideHeadings`; hairline decide rows; Title+i; equal Decline|Confirm
- Ticket Notes: Send always visible; muted disabled when empty
- Docs + unit/e2e

## Explicitly deferred

- Settle Ordered · Shipped · Final redesign
- Fake Send on Confirm / Dispatch / Settle hop composers
- Dispatch This LR / prior-LR job chrome changes

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
