# Feature Completeness Review — Home title, Edit profile, Team roster, catalogue preview

**Date:** 2026-11-17  
**Module / ask:** Home shell title **Home**; account sheet **Edit profile** (opens edit); Home Team card lists members (tap → Invite / Edit team); Home catalogue shows a few Collections/Designs plus **View more…** to My collections. Visitor shop catalogue stays full.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/home.md`, `docs/features/company.md`, `docs/features/settings.md`  
**Disposition:** Proceed (with Redesign vs older locks below)

> Completeness keeps Ekum **coherent**. Home is the shop face; the library stays on You.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Home is already the profile. Account **Profile** is a no-op. Team as a lone word gives no names. Full library on Home duplicates You. |
| UX Designer | Tab name **Home**. Sheet **Edit profile**. Team = foam card of names (Contacts stays phones). Preview 3 packs / 4 designs + quiet **View more…**. |
| Solution Architect | No new APIs. Reuse `GET /team/members`, Team invite sheet (`?invite=1`), You tabs. Slice catalogue client-side on Home only. |

---

## Platform consistency (required)

1. **Existing patterns?** Foam cards + InfoRow / contact rows; MoreActionsSheet; You `?tab=collections` / `?tab=products`; Edit via `/settings/profile?edit=1`.  
2. **Duplicates another feature?** Home catalogue as a full Select library duplicated You — Redesign to preview. Team manage stays on `/team`.  
3. **Should reuse an existing workflow?** Yes — Team page invite/edit; You for the rest of the library.  
4. **Naming matches the app?** Home · Edit profile · Invite · Edit team · View more…  
5. **Units?** N/A.

**Philosophy conflict?** Older docs said account **Profile** and Home catalogue = full You listings. **Redesign** those locks; do not keep both a full Home library and You.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Title, menu, Team roster, preview |
| Business rules | OK | Home-only Team; published-only preview; visitor full shelf |
| Workflows | OK | Invite/edit on `/team`; View more → You |
| Edge cases | OK | Just-you still lists owner; no Team on visitor; omit catalogue if empty |
| Permissions | OK | Invite only owner/`team` cap |
| User states | OK | Home vs visitor vs stub |
| Notifications | N/A | |
| Error handling | OK | Members query empty → still Team card |
| Scalability | OK | Preview caps; You paginates the rest |
| Mobile interactions | OK | Sheet; no extra sticky bar |
| First glance (BM-11) | OK | Names not a lone Team word; View more quiet |
| Units | N/A | |
| Accessibility | OK | Sheet items; View more is a link |
| Platform consistency | OK | After Redesign |

---

## Gaps

None Required.

### Redesign vs older completeness

| Older lock | Now |
|------------|-----|
| 2026-09-29 account **Profile** (not Edit profile) | **Edit profile** → `?edit=1` |
| 2026-11-17 profile catalogue = full You listings + Select on Home | Home: 3 / 4 + **View more…**; visitor unchanged |

---

## Approved scope for this slice

- `shellTitle('/')` = **Home**.  
- Account first row **Edit profile** → `/settings/profile?edit=1`.  
- Home Team card: `GET /team/members`; tap → Invite (if allowed) / Edit team.  
- Team page opens invite when `?invite=1`.  
- Home catalogue preview + **View more…** to You. Visitor full catalogue.

## Explicitly deferred / rejected

- Visitor Team roster.  
- Capping visitor catalogue.  
- Removing the face **Edit** pill.  
- You `/more` account avatar.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
