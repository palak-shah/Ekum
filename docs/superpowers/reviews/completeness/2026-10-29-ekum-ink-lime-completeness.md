# Feature Completeness Review — Ink & Lime theme (Theme C)

**Date:** 2026-10-29  
**Module / ask:** Adopt Theme C (Ink & Lime) as app chrome: charcoal actions, lime needs-you counts, kit Chip gray with no border, one SearchInput, hairline+foam on flat lists, two-line Chats inbox preview.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/settings.md`  
**Disposition:** Redesign (chrome F → C), then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior lock this slice **replaces** (historical, not deleted): Completeness 2026-10-29-ekum-leaf-theme (Theme F). Density (48 / 32 Chip / 32 nav wells), Noto Sans, and Light/Dark/System stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Client chose C over F. Charcoal is go (buttons, links, FAB). Lime is still “needs you” counts only. No new screens. Search stays one kit field — the look-and-feel prototype’s Chats search is a one-off and is not copied. |
| UX Designer | Compare-then-share. Same job → kit class. Chip gray `#F5F5F5`, no border, selected = ink weight: Chats All/Unread/Groups/Requests, Orders Pending/Completed, Settings Light/Dark/System (other FilterRail chips inherit). Story rings stay rings. Orders trade rows and Home needs-you stay cards. Two-line name + kind-on-preview is Chats listing only. |
| Solution Architect | Author hex in `tokens.css` only from artifact C (`--teal` `#1F2A30`, `--lime` `#DFD76B`, `--bub-out` `#EEF2C8`). Chip/nav use foam, not C’s yellow `--tint`. SearchInput stays TextInput chrome. Dark is invented so Appearance still works (charcoal inverted, not D’s lime buttons). |

---

## Platform consistency (required)

1. **Existing patterns?** Same kit (`Button`, `Chip`, `SearchInput`, `FilterRail`). Same IA. Appearance stays Light / Dark / System.  
2. **Duplicates another feature?** No — replaces F leaf chrome, does not add a second theme picker.  
3. **Should reuse an existing workflow?** Yes — token file + kit classes. Do not paint page-local Chip or search fills.  
4. **Naming matches the app?** No copy change.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** Theme F leaf-as-go conflicts with client C. Disposition is **Redesign**: update concepts first, then build this mapping. Photos-lead, one-job screens, and one class per job still hold.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual only |
| Business rules | OK | Lime ≠ success ≠ kind-order; Chip is filter chrome not a new filter |
| Workflows | OK | Same taps |
| Edge cases | OK | Dark invented; SearchInput must not lose its border |
| Permissions | N/A | |
| User states | OK | Light / Dark / System unchanged |
| Notifications | OK | Bell stays tangerine; counts stay lime |
| Error handling | N/A | |
| Scalability | OK | CSS vars |
| Mobile interactions | OK | Chip stays 32; nav wells 32 so `pb-28` holds. BM-07 if a rail grows. |
| First glance (BM-11) | OK | Charcoal CTA and lime counts are the loud jobs. Chats search must match Orders/Explore, not the prototype Chats field. |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Badge ink `#1F2406` on lime `#DFD76B`. Primary on-accent white on charcoal. Field type stays 16px. |
| Platform consistency | OK | After concepts update |

---

## Gaps

### G-001 — Theme F leaf lock

| Field | Content |
|-------|---------|
| Gap | Concepts, chat.md, settings, gap matrix, and `ui-quality-bar` still name Theme F leaf as go |
| Why it matters | Shipping C without a Redesign is silent drift |
| Impact if ignored | Docs say leaf; app is charcoal |
| Recommendation | Update `00-concepts.md`, `chat.md`, `settings.md`, gap matrix, `ui-quality-bar` §4, then implement |
| Priority | Required before implementation |

### G-002 — Artifact C vs six Chats notes

| Field | Content |
|-------|---------|
| Gap | Artifact C paints selected chips with `--tint` `#EFF1D6` and a unique Chats search; the six notes + page compare lock Chip gray/no-border and one SearchInput |
| Why it matters | Copying the prototype Chats search would make Orders/Explore look different from Chats |
| Impact if ignored | Non-uniform find fields; yellow selected chips fight the named gray Chip |
| Recommendation | Artifact wins **action / count / bubble** hexes. Chip = foam, no border, selected = ink weight. SearchInput unchanged (TextInput chrome). |
| Priority | Required before implementation |

### G-003 — Dark mode unspecified for C

| Field | Content |
|-------|---------|
| Gap | Artifact C dark uses lime buttons (`--teal` `#DFD76B`) — that is D’s job in light |
| Why it matters | Settings Appearance Dark/System must keep C’s charcoal-go + lime-counts jobs |
| Impact if ignored | Dark looks like Lime Fresh |
| Recommendation | Invent dark: invert charcoal for primary (`on-accent` ink on a light ink fill); lime stays counts; chat-out from C dark `#3A4020` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Light actions: charcoal accent `#1F2A30`, hover `#161E23`, muted `#8A969C`, on-accent `#FFFFFF`.
- Counts: lime `#DFD76B` + ink `#1F2406` (artifact C `--lime` / `--lime-ink`).
- Chip / nav well / row press: foam `#F5F5F5`; Chip has **no border**; selected Chip = ink weight, not a tint fill.
- Chat-out `#EEF2C8` (artifact C `--bub-out`). Wallpaper stays grey token. Ticks stay `#34B7F1`.
- Surfaces: white cards; foam/line unchanged greys. Kind / status hues unchanged.
- SearchInput: **no shape change** (still TextInput 48px, border + `FIELD_IDLE_FILL`).
- `listRowClass`: hairline + `hover:bg-foam` for InboxThreadRow, Chats In-chats, Home Followed, SettingsDomainCard, Group media. **Not** Orders cards, Home NeedCard, You library, Explore feed.
- InboxThreadRow only: two-line name + preview; object kind prefixes the preview line. Drop extra name tracking.
- Primary Button: `bg-accent` + `text-on-accent`. Login gradient and Chats **+** shadow retint off leftover leaf hex.
- Dark companion tokens (G-003). Noto Sans and 48/32 density stay.

## Explicitly deferred / rejected

- User wallpaper picker — still Rejected.
- Server-synced theme — still Deferred.
- Prototype Chats search chrome — Rejected (G-002).
- Copying artifact C `--tint` onto selected chips — Rejected (named gray Chip).
- Converting Orders / Home NeedCard / You tiles / Explore stories into hairline lists — Rejected.
- Two-line preview on Orders or You — Rejected (Chats listing only).
- Redesigning status lifecycle hues or kind colours — Rejected.
- 48px chips / nav wells / qty steppers — still Rejected (F G-003).
- New `@functional` journey — not required (visual). Trader-eye on Home, Chats, Explore, Orders, You, Settings, one sheet, and dark is required.

## Sign-off

Required gaps closed or deferred in writing: Yes (G-001 docs in this slice; G-002 and G-003 are the approved mapping)  
Ready for implementation / `@functional` journeys: Yes (unit + trader-eye; no new `@functional` journey)
