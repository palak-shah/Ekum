# Feature Completeness Review — Home avatar drop My Designs

**Date:** 2026-10-06  
**Module / ask:** Remove **My Designs** from the Home avatar account menu; Designs stay as a tab on You next to Collections.  
**Anchors:** `docs/features/settings.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Two doors to the same library fight collections-first: avatar **My Designs** and You **Designs** tab. Keep one entry: **My Collections** → You (Collections rest tab; Designs beside it). |
| UX Designer | Shorter menu; Designs is already a peer tab under My Collections. No new chrome. |
| Solution Architect | Drop one `youShortcuts` row; `?tab=products` deep link can stay for bookmarks / old links. |

---

## Platform consistency (required)

1. **Existing patterns?** Matches Collections · Designs on You; Home avatar is account, not a second library chrome.  
2. **Duplicates another feature?** Yes today — removing the duplicate.  
3. **Should reuse an existing workflow?** Yes — You tabs.  
4. **Naming matches the app?** **My Collections** stays; Designs is the You tab label.

**Philosophy conflict?** No — aligns with one job / fewer taps.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Menu omits My Designs |
| Business rules | OK | Library unchanged |
| Workflows | OK | Avatar → My Collections → Designs tab |
| Edge cases | OK | `?tab=products` still opens Designs |
| Permissions | N/A | |
| User states | OK | Buyers still get My Collections → You |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No sticky chrome change |
| First glance (BM-11) | OK | Shorter menu; Designs not a second peer |
| Accessibility | OK | One fewer menuitem |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Remove **My Designs** from Home avatar / `youShortcuts`.
- Lock docs: menu is Profile · Network · My Collections · Settings · Log out.
- Update unit specs for shortcuts + HomeAccountMenu.

## Explicitly deferred / rejected

- Renaming **My Collections** to **You** in the menu (not asked).
- Removing `?tab=products` deep link support.
