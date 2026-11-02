# Feature Completeness Review — Direct Link Request share compact button

**Date:** 2026-10-31  
**Module / ask:** Direct Link **Request share** is a quiet accent word. Make it a small filled accent button (same h-8 chrome as Requests Allow) on the mill picker and on gray Direct Link rows. Select stays a quiet trailing word.  
**Anchors:** `docs/features/settings.md`, Completeness `2026-10-31-direct-link-share-gate-completeness.md`  
**Disposition:** Proceed (chrome only)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

No workflow, API, or copy change. Ask, Allow, gray-keep, and trio-at-first-order stay as shipped.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Request share is the mill-row job when Share is off. A filled compact control is easier to hit than a word next to Select. |
| UX Designer | Reuse Requests Allow density (`compactCta` + filled accent). Do not use kit Button (48px) — it would shout louder than Save and crowd names. Select stays quiet. |
| Solution Architect | Shared class in kit. Same button on picker `rowAction` and gray list. Requested = same button, disabled. |

---

## Platform consistency (required)

1. **Existing patterns?** Requests Allow (`h-8` filled accent). Chip is 32px foam — not a CTA. Kit Button is 48px — too large for a row trailing control.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — lift `compactCta` into kit; Allow/Decline keep it.  
4. **Naming matches the app?** **Request share** / **Requested**.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same tap → share-ask |
| Business rules | N/A | |
| Workflows | N/A | |
| Edge cases | OK | Requested disabled |
| Permissions | N/A | |
| User states | OK | Request share vs Requested vs Select |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Compact so names and red × stay readable (BM-07 N/A — no new sticky bar) |
| First glance (BM-11) | OK | Filled Request share is the mill-row job; Select stays quiet |
| Units | N/A | |
| Accessibility | OK | Real button; row still not nested buttons |
| Platform consistency | OK | Same compact CTA as Allow |

---

## Gaps

None. Quiet-word Request share was hard to see as the action; filled compact CTA closes it.

---

## Approved scope for this slice

- Export `compactCta` from kit; Requests Allow/Decline keep using it.
- Filled h-8 **Request share** / **Requested** on ConnectionPicker mill row and gray Direct Link row.
- Select / Selected stay quiet trailing words.

## Explicitly deferred / rejected

- Kit `Button` size (48px stays the page CTA).
- Changing Select into a button.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (web units + trader-eye; no new Playwright — behaviour unchanged)
