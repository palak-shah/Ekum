# Feature Completeness Review — PWA select-swipe component

**Date:** 2026-10-27  
**Module / ask:** Shared row swipe in **select mode** (PWA Pointer Events): swipe right selects, swipe left deselects. First wire: chats inbox select row. No page-level swipe-back.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Once they are already Selecting, a directional flick is faster than tap. Tap still toggles. Idle row swipe (More · Archive) is unchanged. |
| UX Designer | WhatsApp-like only **in select mode**. Quiet follow (`translateX` snap-back). No Archive/More reveal while selecting. No full-page back swipe — iOS already owns the left edge. |
| Solution Architect | Pointer Events + axis lock (same as inbox swipe). `touch-pan-y` until X commits. Shared `selectSwipe` / `useSelectSwipe` in `ui/`. InboxThreadRow selecting branch is the only consumer this slice. |

---

## Platform consistency (required)

1. **Existing patterns?** Inbox swipe axis lock, long-press cancel, `touch-pan-y` (not `pan-x` alone).  
2. **Duplicates another feature?** No — idle swipe still More/Archive; select-mode swipe is on/off.  
3. **Should reuse an existing workflow?** Yes — Pointer capture + slop from `inboxRowSwipe`.  
4. **Naming matches the app?** Select / selected; no new jargon.  
5. **Units?** N/A

**Philosophy conflict?** No. Chat chrome copies WhatsApp *judgment* (everyday first). Page-back swipe would fight iOS and idle row swipe — rejected for this slice.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Right → select; left → deselect; tap toggles; idle swipe unchanged |
| Business rules | OK | Only while `selecting` |
| Workflows | OK | Component; first consumer InboxThreadRow |
| Edge cases | OK | Already selected + swipe right = no-op; off + swipe left = no-op; vertical scroll wins |
| Permissions | N/A | |
| User states | OK | selecting vs idle |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | Per-row hook |
| Mobile interactions | OK | pan-y + overscroll-x-contain; BM-07 N/A (no new chrome) |
| First glance (BM-11) | OK | No extra chrome; same row |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Tap/aria-pressed stay; swipe is extra |
| Platform consistency | OK | |

---

## Gaps

### G-001 — iOS edge-back vs custom back

| Field | Content |
|-------|---------|
| Gap | Full-page swipe-left = Back would double-pop with Safari / Home Screen edge-back and steal idle Archive swipe |
| Why it matters | PWA is not UIKit |
| Impact if ignored | Accidental Back / broken Archive |
| Recommendation | Defer page-back; select-mode row swipe only |
| Priority | Required before implementation (defer as Reject for this slice) |

---

## Approved scope for this slice

- `selectSwipe` + `useSelectSwipe` (Pointer Events, axis lock, threshold)
- Inbox select row: swipe right on, swipe left off; tap still toggles; snap-back nudge
- Units; no new Playwright (pointer flicks are weak; device pass is the gate)

## Explicitly deferred / rejected

- Page-level swipe-left = Back  
- Explore mosaic / Orders / Confirm sheet  
- Thread message bubbles  
- Restoring Chats list bulk-select chrome if the page currently passes `selecting={false}`

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units; no new `@functional` this slice)
