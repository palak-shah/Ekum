# Feature Completeness Review — Edit design Save or Discard

**Date:** 2026-10-04  
**Module / ask:** Leaving Edit design with unsaved changes should offer **Save** (people miss Update) or **Discard**, not only Leave.  
**Anchors:** `docs/features/catalog.md`, discard guard completeness 2026-08-24  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Sticky Update is easy to miss; Back should still protect work and offer to keep it. |
| UX Designer | Edit-only sheet: **Save changes?** · Save · Discard. Chat/orders keep **Leave the page?**. Dirty only. |
| Solution Architect | Reuse discard guard + save mutation; optional Save on sheet or thin SaveOrDiscardSheet. |

## Platform consistency (required)

1. **Existing patterns?** Discard guard + Sheet kit.  
2. **Duplicates another feature?** No — intentional other way for Edit design only.  
3. **Should reuse an existing workflow?** Yes — `useDiscardGuard` + existing `save` mutation.  
4. **Naming matches the app?** Plain trader copy.

**Philosophy conflict?** No — Save is the everyday job; Discard last (danger).

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Dirty leave → Save then leave / Discard / stay |
| Business rules | OK | Clean form: no prompt |
| Workflows | OK | Back + route change |
| Edge cases | OK | Save fail → stay + toast |
| Permissions | N/A | |
| User states | OK | Edit only (not create batch leave) |
| Notifications | N/A | |
| Error handling | OK | Mutation error keeps sheet / page |
| Scalability | N/A | |
| Mobile / chrome | OK | Sheet above dock |
| First glance (BM-11) | OK | Save primary; Discard last |
| Accessibility | OK | |
| Platform consistency | OK | Chat/orders leave copy unchanged |

## Approved scope for this slice

- Edit design dirty leave: Save / Discard / cancel stay.
- Do not change chat / photo-order / collection DiscardChangesSheet copy.

## Explicitly deferred / rejected

- Auto-save on every keystroke.
- Prompt when form is clean.

## Disposition rationale

Traders miss Update; Save on leave completes the edit job without changing global leave copy.
