# Feature Completeness Review — Ekum Leaf theme (Theme F)

**Date:** 2026-10-29  
**Module / ask:** Adopt Theme F (Ekum Leaf) as the app chrome: leaf green for go, lime only for needs-you counts, white screens, untinted greys, Noto Sans, 20/18/16 type, 48px kit targets.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/settings.md`  
**Disposition:** Redesign (chrome), then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): 2026-09-26 kit density (40px / 28px Chip) and 2026-10-17 typography (Inter; no size rollout). Colour jobs from 2026-10-10 theme system stay (one token file, Light/Dark/System).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders already know green as go (WhatsApp). Lime means “needs you” only, so counts do not look like a finished order. Photos stay on white with no warm tint. No new screens, wallpaper picker, or Appearance options. |
| UX Designer | Leaf `#2B7A1F` on buttons, links, selected underlines. Selected chips and the nav well use leaf tint `#ECF6E2` + ink `#24661A`, not a solid green pill. Lime `#B5EB5A` + `#13240A` is count pills only — never text on white. Kit buttons/fields/list squares grow to 48px. Chips stay 32px and nav wells 32px so rails and the bottom bar do not eat the list (BM-07). |
| Solution Architect | Author hex in `tokens.css` only. New tokens: `accent-soft`, `accent-ink`, `badge-ink`, `tick`. Dark mode is invented (F has no dark spec) so Appearance still works. Kind colours stay separate from brand. |

---

## Platform consistency (required)

1. **Existing patterns?** Same kit (`Button`, `Chip`, `TextInput`, list square, `Sheet`). Same IA. Appearance stays Light / Dark / System.  
2. **Duplicates another feature?** No — replaces the teal/Inter chrome, does not add a second theme picker.  
3. **Should reuse an existing workflow?** Yes — token file + kit classes. Do not paint page-local fills.  
4. **Naming matches the app?** No copy change. “Seen” stays the accessible name; the glyph becomes blue ticks.  
5. **Units?** N/A — no ₹ or qty string change. How many numbers move from 14px to 16px type only.

**Philosophy conflict?** The old “WhatsApp-tight 40px / do not jump type” lock conflicts with Theme F. Disposition is **Redesign**: update concepts first, then build this mapping. Photos-lead and one-job screens still hold.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual only |
| Business rules | OK | Lime ≠ success ≠ kind-order |
| Workflows | OK | Same taps |
| Edge cases | OK | Dark invented; disabled primary uses muted leaf |
| Permissions | N/A | |
| User states | OK | Light / Dark / System unchanged |
| Notifications | OK | Bell stays tangerine |
| Error handling | N/A | |
| Scalability | OK | CSS vars |
| Mobile interactions | OK | Nav wells stay 32 so `pb-28` holds. Fields 48. Recheck sheet Close pad. BM-07 if a rail grows. |
| First glance (BM-11) | OK | Leaf CTA and lime counts are the loud jobs. Lime must not become body text. |
| Units (order / dispatch / Rate per) | N/A | Type size only |
| Accessibility | OK | Badge ink `#13240A` on lime. Tick has name “Seen”. Field type stays 16px. |
| Platform consistency | OK | After concepts update |

---

## Gaps

### G-001 — 40px kit and Inter sizes

| Field | Content |
|-------|---------|
| Gap | Concepts and 2026-09-26 / 2026-10-17 lock 40px buttons, 28px chips, Inter, page 17 / body 15 / buttons 14 |
| Why it matters | Shipping F without a Redesign is silent drift |
| Impact if ignored | Two chromes in docs vs app |
| Recommendation | Update `00-concepts.md`, `ui-quality-bar` §4, gap matrix, then implement |
| Priority | Required before implementation |

### G-002 — Dark mode unspecified

| Field | Content |
|-------|---------|
| Gap | Theme F is light-only |
| Why it matters | Settings Appearance Dark/System must keep working |
| Impact if ignored | Dark stays teal and fights the new brand |
| Recommendation | Invent a brighter leaf on the existing dark canvas; lime pill ink stays `#13240A` |
| Priority | Required before implementation |

### G-003 — 48px on every control

| Field | Content |
|-------|---------|
| Gap | F says 48px minimum; its own Home keeps small chips, nav wells, and count pills |
| Why it matters | 48px chips and tab wells clip lists (BM-07) |
| Impact if ignored | Filter rails and bottom nav eat the job |
| Recommendation | 48px on Button, fields, list squares, Back, InfoHint, send. Chip 32. Nav wells 32. Qty stepper stays compact beside 48 thumbs; value type 16. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Light tokens: leaf accent `#2B7A1F`, hover `#24661A`, muted `#95C38E`, badge `#B5EB5A`, ink `#1B1B1B`, muted text `#6B6B6B`, slate `#3D3D3D`, line `#E6E6E6`, foam/linen/stage/input/chat-bg `#F5F5F5`, chat-out `#E2F3D2`, warning `#8F5400` on `#FFF3DF`.
- New: `accent-soft` `#ECF6E2`, `accent-ink` `#24661A`, `badge-ink` `#13240A`, `tick` `#34B7F1`.
- Keep: surface/canvas/chat-in white; success, danger, tangerine, placed, confirmed, part, resolved; kind order/collection/design. `info-ink` moves off old accent `#007a5e` to kind-order teal `#1a6a6f`.
- Selected chips and tint tabs: `bg-accent-soft text-accent-ink`. Underline tabs (Orders Selling/Buying/Others, You) stay leaf text + underline. Primary buttons stay solid leaf + white.
- Count pills: `bg-badge text-badge-ink` (nav, inbox, Explore cart, dock, chip counts). Chip `inverted` no longer assumes a solid green chip.
- Selected nav well: `bg-accent-soft`.
- Noto Sans. Body 16. Page and tab titles 20 semibold. Sheet titles 18. Badges 11 bold. Meta/time/nav labels 13. Names 16. Buttons 16 emphasis. Tabular nums on body. Placeholders stay 14. Onboarding splash stays 24.
- Density: kit 48 as in G-003. Login gradient retints to leaf. Chats header shadow retints to leaf.
- Chat: grey wallpaper via token. Last outgoing **Seen** becomes blue double ticks (`--ekum-tick`); accessible name stays Seen. No grey delivered state unless one already exists.
- Dark companion tokens (G-002).

## Explicitly deferred / rejected

- User wallpaper picker — still Rejected.
- Server-synced theme — still Deferred.
- Redesigning status lifecycle hues or kind colours — Rejected for this slice.
- 48px chips, 48px nav wells, 48px qty steppers — Rejected (G-003).
- New `@functional` journey — not required (visual). Unit specs that lock old sizes must be rewritten. Trader-eye on Home, Chats, thread, Explore, Orders, one sheet, and dark is required.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 docs in this slice; G-002 and G-003 are the approved mapping)  
Ready for implementation / `@functional` journeys: Yes (unit + trader-eye; no new `@functional` journey)
