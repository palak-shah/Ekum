# Feature Completeness Review — Home avatar account menu

**Date:** 2026-09-29  
**Module / ask:** Remove You ⋯ (Network / Settings / Log out) and **Edit profile** on You. Home avatar (initials or logo) opens a menu: Profile, Network, My Collections, My Designs, Settings, Log out.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`, `docs/features/README.md`, ui-quality-bar (WhatsApp ⋯ judgment: everyday first, rare last)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Account lives on Home, where they already look. You is the library (Share stays). Profile is in the menu, not a second pill on You. |
| UX Designer | Same wide panel as current You ⋯. Logout last and danger. Home: Bell · avatar. You: Share only in the title row. |
| Solution Architect | Reuse `youShortcutItems` + portal menu. Destinations already exist. |

---

## Platform consistency (required)

1. **Existing patterns?** You ⋯ panel; Home header avatar; kit Avatar.  
2. **Duplicates another feature?** Replaces You ⋯ + Edit pill, not a third door.  
3. **Should reuse an existing workflow?** Profile = `/settings/profile`. Library = You tabs.  
4. **Naming matches the app?** **Profile** (not Edit profile). **Log out**. **My Collections** / **My Designs** as asked.

**Philosophy conflict?** No — fewer chrome on You; one account door on Home.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Six rows + logout |
| Business rules | OK | Logout still clears tokens |
| Workflows | OK | Share still on You |
| Edge cases | OK | No logo → initials |
| Permissions | OK | Same routes |
| User states | OK | Buyers still get library links |
| Notifications | N/A | Bell unchanged |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Menu below avatar, overlay |
| Accessibility | OK | aria-haspopup menu; Account |
| Platform consistency | OK | Same panel as You ⋯ was |

---

## Gaps

None Required.

---

## Approved scope for this slice

- You: no ⋯; no Edit profile pill. Header **Share** remains.
- Home avatar opens: **Profile** · **Network** · **My Collections** · **My Designs** · **Settings** · **Log out** (danger, last).
- Avatar tap no longer goes straight to You.

## Explicitly deferred / rejected

- Moving Share onto the Home menu.
- Removing the You identity card (name still shown).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
