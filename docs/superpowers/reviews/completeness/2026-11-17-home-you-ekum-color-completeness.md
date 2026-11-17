# Feature Completeness Review — Home + My collections Theme C color

**Date:** 2026-11-17  
**Module / ask:** Keep Theme C (charcoal go). Put intentional brand chrome on Home and My collections — lime tab underline + chip-on ink, accent icons, ink Business info titles — **not** chip-on field washes behind lists or action pills (reads accidental).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/home.md`, `docs/features/company.md`, `docs/features/collections.md`  
**Disposition:** Proceed (Redesign vs “Home chrome must stay neutral grey”)

> Completeness keeps Ekum coherent. Brand signal via existing tokens — not prototype teal CTAs or yellow nudge.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Home/You feel colorless vs Chats/Orders chips. Traders should see Ekum tint on the shop face and library tabs without changing jobs. |
| UX Designer | Brand on indicators/icons/titles only. No tinted list or pill fields. Lime underline on selected tab; ink Business info titles; accent icons. Cover stays hero. |
| Solution Architect | Class/token swaps only. No new APIs. Reuse `bg-chip-on` / `text-chip-on-ink` / `text-accent` / `text-ink`. |

---

## Platform consistency (required)

1. **Existing patterns?** Match selected `Chip` (`bg-chip-on text-chip-on-ink`).  
2. **Duplicates?** No.  
3. **Reuse?** Theme C tokens + kit Chip judgment.  
4. **Naming?** Unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** Older “quiet grey Home chrome” → **Redesign** to allow chip-on brand wash. Reject prototype green go buttons and yellow completeness nudge.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Presentation |
| Business rules | OK | Theme C locked |
| Workflows | OK | Destinations unchanged |
| Edge cases | OK | Preview wash only; full catalogue page stays white |
| Permissions | N/A | |
| User states | OK | Home / shop preview / You |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome |
| First glance (BM-11) | OK | Wash must not shout over cover |
| Units | N/A | |
| Accessibility | OK | Titles darker = better contrast |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Home/shop preview catalogue: selected tab = lime underline + chip-on ink; body stays surface.  
- Action pills: surface + accent icons (no chip-on fill).  
- Business info / Contacts / Team titles: `text-ink`; icons `text-accent`.  
- My collections kind tabs: same lime underline + chip-on ink.  
- Docs + units + trader-eye.

## Explicitly deferred / rejected

- Prototype teal/green CTAs.  
- Yellow completeness nudge.  
- Lime filled primary Home buttons.  
- Recoloring full You list background / catalogue Select page.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
