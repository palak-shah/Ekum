# Feature Completeness Review — Ship progress bars (Dispatch mockup)

**Date:** 2026-11-05  
**Module / ask:** Replace pale-green fully-shipped row wash with green track progress bars under “N of M sent” (Dispatch sheet summary + lines; ticket Designs / mill / You; Settle).  
**Anchors:** `docs/features/orders.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Already-dispatched progress should read as a bar, not a green box. Same language on Dispatch and ticket. |
| UX Designer | Mockup: summary card + under-cue green bars (partial and full). Over-ship keeps warning-soft. |
| Solution Architect | Shared `OrderLineShipProgressBar` + pct helper; Dispatch aggregate helper; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — track matches ticket progress chrome; fill uses success token for ship-done meaning.  
2. **Duplicates another feature?** No — replaces wash chrome.  
3. **Should reuse an existing workflow?** Reuse ship facts / balance tones.  
4. **Naming matches the app?** `N of M {noun} sent` unchanged.  
5. **Units?** Order unit noun on summary; qty is order unit. N/A for Rate per.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Bar under already-shipped cues |
| Business rules | OK | No qty math change |
| Workflows | OK | Dispatch / ticket / Settle |
| Edge cases | OK | Zero ordered → no bar; declined omitted from Dispatch aggregate |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | |
| First glance (BM-11) | OK | No green box; full bar when 10/10 |
| Units | OK | |
| Accessibility | OK | progressbar aria on line bars |
| Platform consistency | OK | Shared component |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Drop `bg-success-soft` for done; keep warning-soft for over.  
- Shared green progress bar; Dispatch summary card; mount on Dispatch lines, ticket Designs/mill/You (via ticket facts / mill caption), Settle.  
- Docs + units.

## Explicitly deferred / rejected

- Orders list strip / ticket header progress stay accent.  
- Send dispatch button color stays kit accent.
