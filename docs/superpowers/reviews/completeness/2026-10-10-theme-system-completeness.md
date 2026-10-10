# Feature Completeness Review — Theme system (Slice 1)

**Date:** 2026-10-10  
**Module / ask:** Master light/dark CSS tokens; Settings Appearance (Light / Dark / System); kit/forms/badges remapped to semantic tokens  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/settings.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need one quiet Appearance control under Settings — not a wallpaper shop. Default follows the phone (System). Choice sticks per person on this device. |
| UX Designer | Active actions use brighter prototype green; incomplete CTAs use muted seafoam (screenshot 6); inputs sit on subtle cool fill; count badges use badge green. Match Chip / FilterRail for the three-way pick — no one-off chrome. |
| Solution Architect | CSS custom properties (`--ekum-*`) author once; `@theme` maps Tailwind `--color-*`. `html.dark` / `html.light` from ThemeProvider + FOUC script. Storage `ekum.theme.${userId}` — no server sync. |

---

## Platform consistency (required)

1. **Existing patterns?** Settings domain groups + Chip/FilterRail; kit Button / TextInput; `ekum.*` localStorage like browse layout.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Appearance lives on Settings (account menu → Settings), not a new tab.  
4. **Naming matches the app?** **Appearance** · Light · Dark · System — plain words.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Preference + resolve + apply |
| Business rules | OK | Per userId device-local; default System |
| Workflows | OK | Settings → Appearance → immediate apply |
| Edge cases | OK | Anonymous / private mode → System; OS change while System |
| Permissions | N/A | |
| User states | OK | Re-bind when userId changes |
| Notifications | N/A | Bell stays tangerine (alert ≠ count badge) |
| Error handling | OK | try/catch localStorage |
| Scalability | OK | CSS vars only |
| Mobile interactions | OK | No sticky chrome change |
| First glance (BM-11) | OK | One Appearance row; chips quiet until selected |
| Accessibility | OK | `color-scheme`; visible focus via accent token |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Chat surfaces

| Field | Content |
|-------|---------|
| Gap | Chat wallpaper / bubbles / trade-card layout |
| Why it matters | Separate visual job; depends on these tokens |
| Impact if ignored | Slice 1 still ships app chrome |
| Recommendation | Slice 2 Completeness + implementation |
| Priority | Future improvement (this review) · Required in Slice 2 |

### G-002 — Server sync

| Field | Content |
|-------|---------|
| Gap | Theme not synced across devices |
| Why it matters | Same person on two phones |
| Impact if ignored | Each device remembers its own pick |
| Recommendation | Defer — plan out of scope |
| Priority | Future improvement |

---

## Approved scope for this slice

- Master `:root` / `html.dark` `--ekum-*` tokens + `@theme` mappings (`accent`, `accent-muted`, `badge`, `input`, chat tokens reserved for Slice 2).
- ThemePreference + ThemeProvider + FOUC; Settings Appearance Light / Dark / System.
- Kit primary disabled → `accent-muted`; form fields → `bg-input`; nav count badges → `bg-badge`.
- Docs: `settings.md` Appearance rules; gap matrix row.

## Explicitly deferred / rejected

- User chat wallpaper picker — Rejected (theme token only in Slice 2).
- Server-synced theme — Deferred.
- Redesigning status lifecycle hues — Deferred (readability only).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit + trader-eye; no new `@functional` journey required for device-local theme)
