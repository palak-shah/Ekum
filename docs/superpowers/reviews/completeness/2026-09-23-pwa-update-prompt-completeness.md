# Feature Completeness Review — PWA new-version Load

**Date:** 2026-09-23  
**Module / ask:** After a server deploy, ask the trader to load the new build — one tap. Do not reload by itself.  
**Anchors:** `docs/features/settings.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Silent swap leaves a half-old tab; the next screen can miss JS. They stay on the job until they tap **Load**. |
| UX Designer | Quiet top pill (same language as toast): **New version** + **Load**. No dismiss × — skipping the update is how the app “fails.” |
| Solution Architect | `registerType: 'prompt'` + `useRegisterSW`. Tap calls `updateServiceWorker(true)`. Check again when the tab is shown, and every 30 minutes. |

---

## Platform consistency (required)

1. **Existing patterns?** Toast pill + action word (not a new sheet or settings toggle).  
2. **Duplicates another feature?** No — replaces silent `autoUpdate`.  
3. **Should reuse an existing workflow?** Reuse toast chrome; do not auto-dismiss.  
4. **Naming matches the app?** **New version** · **Load** — plain words.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Bar when a new worker waits; tap reloads into it |
| Business rules | OK | Never auto-reload (quote / order mid-type) |
| Workflows | OK | Appear on any route, signed in or not |
| Edge cases | Later | Chunk 404 after deploy (second bar) deferred |
| Permissions | N/A | |
| User states | OK | Hidden until an update is waiting; SW off in `vite dev` |
| Notifications | N/A | Not a push |
| Error handling | OK | No bar if no worker (dev) |
| Scalability | OK | One worker check; no extra API |
| Mobile interactions | OK | Top pill — does not stack on bottom nav (BM-07) |
| Accessibility | OK | `role="status"` + tappable **Load** |
| Platform consistency | OK | Toast-like pill |

---

## Gaps

### G-001 — Recover when a chunk already 404s

| Field | Content |
|-------|---------|
| Gap | After deploy, a tap that loads a missing JS file still fails until they refresh. |
| Why it matters | That is the “PWA failed” they see today. |
| Impact if ignored | Bar helps only if the worker found the update first. |
| Recommendation | Same **Load** bar on chunk load failure — next slice. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Stop silent auto-reload (`prompt`, no injected auto register).
- Persistent **New version · Load** when a new service worker waits.
- Recheck on tab visible + every 30 minutes.
- Unit tests for the bar; SW itself is off in local Vite.

## Explicitly deferred / rejected

- Auto reload.
- Dismiss without loading.
- Chunk-404 recovery (G-001).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit only — no SW in Playwright / Vite dev)
