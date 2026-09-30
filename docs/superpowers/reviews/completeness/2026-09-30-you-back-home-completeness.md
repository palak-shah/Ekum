# Feature Completeness Review — You Back to Home

**Date:** 2026-09-30  
**Module / ask:** You (`/more`) needs a top-left **Back** that returns to **Home**.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You is reached from the Home avatar (My Designs / My Collections), not a bottom tab. Traders expect Back to the place they came from — Home. Bottom Home tab still works; Back is the thumb path on this screen. |
| UX Designer | Same chevron as PageHeader, left of the **You** shell title. One chrome row. Do not add a second PageHeader. Landing is `/` (not history −1) so deep links and tab hops still go Home. |
| Solution Architect | Gate on `pathname === '/more'` in AppShell. Helper `shellShowsHomeBack`. No nav hide. |

---

## Platform consistency (required)

1. **Existing patterns?** PageHeader Back on Network, Profile, Settings. Shell title stays for tab-like roots. You is a Home destination, not a peer tab.  
2. **Duplicates another feature?** No — bottom Home tab remains.  
3. **Should reuse an existing workflow?** Reuse BackIcon + aria-label Back.  
4. **Naming matches the app?** **Back** → Home. Title stays **You**.

**Philosophy conflict?** No — earlier “no Back” treated You as a tab peer. Entry is Home. This matches WhatsApp-style back-from-profile.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Back → `/`. |
| Business rules | N/A | |
| Workflows | OK | Home avatar → You → Back → Home. |
| Edge cases | OK | `?tab=` / Saved query kept until leave; Back ignores history. |
| Permissions | N/A | |
| User states | OK | Same for buyer and seller You. |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | One sticky row; no extra bar (BM-07 unchanged). |
| Accessibility | OK | `aria-label="Back"`. |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Shell on `/more`: Back (left) · You. Shop Share is on Business profile.  
- Tap Back → `/`.

## Explicitly deferred / rejected

- Back on Chats / Explore / Orders (those stay tab roots).  
- History −1 (would strand deep links).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
