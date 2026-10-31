# Feature Completeness Review — Chat message-action popover chrome

**Date:** 2026-10-30  
**Module / ask:** Restyle the thread Reply / Forward / Copy popover so it matches Ink & Lime (not a bordered web dropdown). Keep it attached to the bubble.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior lock this slice **does not change:** popover (not `MoreActionsSheet`); chevron idle-hidden until hover / long-press; item order Reply · Forward · Copy · Star · Edit · Select · Delete; swipe-to-reply.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders open this on a lime bubble. A 1px boxed dropdown reads as admin software. Same verbs, quieter box. |
| UX Designer | Shell = bubble radius (`rounded-2xl`) + float shadow, no hairline. Rows = ⋯ sheet density. Reactions are a top foam rail, not a verb in the list. Chevron is a glyph, not a hover disc. |
| Solution Architect | Theme token `--ekum-shadow-menu` (not a page-local shadow). Placement stays `placeInboxRowMenu`. No new reaction control on the bubble. |

---

## Platform consistency (required)

1. **Existing patterns?** `MoreActionRow` density; bubble `rounded-2xl`; no all-around `border-line` on trade cards.  
2. **Duplicates another feature?** No — still the message popover.  
3. **Should reuse an existing workflow?** Same menu, same long-press / chevron.  
4. **Naming matches the app?** Reply / Forward / Copy unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** Yes — a bordered dropdown fights “no boxed chrome on chat.” Disposition is **Redesign**: restyle the popover, do not convert to a sheet (already deferred).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same actions; reactions still in this popover |
| Business rules | OK | Unchanged |
| Workflows | OK | Hover chevron / long-press / swipe reply |
| Edge cases | OK | No reactions → rail omitted; Delete last |
| Permissions | N/A | |
| User states | OK | Selecting still hides chevron |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Thumb rows `py-3.5`; flips above composer (unchanged). No new sticky bar (BM-07 N/A) |
| First glance (BM-11) | OK | No boxed rectangle on chat-out; emoji not mixed into Copy |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | `role="menu"` / menuitem; chevron `h-7 w-7` hit target |
| Platform consistency | OK | After chat.md lock |

---

## Gaps

### G-001 — Hairline box + tight rows

| Field | Content |
|-------|---------|
| Gap | `border border-line` + `py-2.5` + `min-w-[8.5rem]`; `--ekum-shadow-soft` too faint to float without a border |
| Why it matters | Looks like a default dropdown on a lime bubble |
| Impact if ignored | Clients screenshot “this doesn’t match the app” |
| Recommendation | `rounded-2xl bg-surface` + `--ekum-shadow-menu`; sheet-like rows; no border |
| Priority | Required before implementation |

### G-002 — Reactions in the verb list

| Field | Content |
|-------|---------|
| Gap | 👍❤️🙏 after Star, before Edit |
| Why it matters | Two jobs in one list |
| Impact if ignored | Copy / Star feel crowded; emoji look bolted on |
| Recommendation | First band of the same popover (foam wash). Not a second pill on the bubble |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Lock chat.md Message actions chrome line.
- `--ekum-shadow-menu` in `tokens.css`; map `--shadow-menu` in `index.css`.
- Restyle popover shell + rows; quiet chevron (no filled disc).
- Reactions as top foam rail in the same popover.
- Units + trader-eye on a chat-out bubble.

## Explicitly deferred / rejected

- Converting to `MoreActionsSheet` — **rejected** (placed-by Completeness).
- Bubble beak / attached caret — **deferred**.
- Separate reaction bar on the message — **rejected** (new control).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing `@chat` message-actions journeys; chrome units this slice)
