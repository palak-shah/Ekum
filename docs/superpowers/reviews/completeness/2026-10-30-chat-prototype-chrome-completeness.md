# Feature Completeness Review — Chat prototype chrome

**Date:** 2026-10-30  
**Module / ask:** Map remaining Chats list + thread-card gaps to the look-and-feel prototype via **shared kit classes** (not artifact page-local CSS). Selected Chip tint; inbox kind weight; group no-photo glyph; one EmptyState type; trade cards without incoming rail.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/settings.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): Completeness 2026-10-29-ekum-ink-lime G-002 Chip selected = ink weight (not tint); chat.md incoming **left accent rail**. SearchInput, Chip idle foam/no-border, two-line Chats preview, and charcoal go stay.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Prototype mock pages used different classes (`.fchip`, `.empty`, `.bub.ord`). Traders still need one Chip, one EmptyState, one SearchInput. Selected All looking lime is a kit Chip change, not a Chats-only paint. Thread cards drop the incoming rail; direction stays fill (`chat-out` / `chat-in`). |
| UX Designer | Same job → kit class. Chip selected = C `--tint` `#EFF1D6` + `--c-pri` `#3F4A12` (not badge lime). Empty titles 15px `font-title` on kit EmptyState. Inbox kind is 12px title + chip-on ink; preview stays `text-meta`. Group no-photo = Avatar `fallback="group"`. Trade cards share `ChatTradeCardView` + `chatBubbleCorners` with text (no card-only 8px). |
| Solution Architect | Add `--ekum-chip-on` / `--ekum-chip-on-ink` in `tokens.css` (dark C tint `#2C2F14` / c-pri `#E8E28A`). Do not copy prototype search, pill Chip radius, 14px inbox preview, or doodle wallpaper. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Chip`, `EmptyState`, `Avatar`, `SearchInput`, `ChatTradeCardView`. Filter rails stay FilterRail.  
2. **Duplicates another feature?** No — restyles existing chrome.  
3. **Should reuse an existing workflow?** Yes — tokens + kit. No page-local Chip/EmptyState.  
4. **Naming matches the app?** `No requests` copy unchanged. No Seller/Buyer. 1:1 cards omit shop `who`.  
5. **Units?** N/A — no ₹ or qty string change. Design **count** on cards stays (“2 designs”).

**Philosophy conflict?** G-002 Chip ink-weight and incoming rail fight the agreed prototype look **and** kit uniformity. Disposition is **Redesign**: update concepts + chat.md first, then build. Photos-lead and one class per job still hold.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual + copy omit (`logged an order`, 1:1 who). Decline/View stay. |
| Business rules | OK | Lime badge still needs-you counts; chip-on is selected-filter wash, not go. |
| Workflows | OK | Same taps |
| Edge cases | OK | Dark chip-on from C dark; group with photo still uses photo |
| Permissions | N/A | |
| User states | OK | Light / Dark / System |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | CSS vars + kit |
| Mobile interactions | OK | Chip stays 32; card min 262px capped by 85% wrap. BM-07: time must not sit under chevron unreadably |
| First glance (BM-11) | OK | Selected All is the loud filter; kind tag must read vs preview; cards must not look like empty-banded list tiles |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Chip-on ink `#3F4A12` on `#EFF1D6`. Badge lime on chip-on still contrast. Empty title 15px not 700 (bold reserved). |
| Platform consistency | OK | After concepts / chat.md update |

---

## Gaps

### G-001 — Chip selected still ink-weight

| Field | Content |
|-------|---------|
| Gap | Concepts + G-002 lock selected Chip as foam + ink weight; prototype `.fchip.on` is tint wash |
| Why it matters | All chip on All does not read as selected |
| Impact if ignored | Chats (and Orders/Settings) look idle when they are on |
| Recommendation | Kit Chip selected = `bg-chip-on text-chip-on-ink font-title`. Idle stays foam. SearchInput unchanged |
| Priority | Required before implementation |

### G-002 — Incoming left rail + card bands

| Field | Content |
|-------|---------|
| Gap | chat.md: theirs = chat-in + left accent rail; header and footer both hairlined; thumbs 2×56px; reserved time band |
| Why it matters | Cards look unlike the prototype and waste height between photo and time |
| Impact if ignored | Traders screenshot “line in front of card” / empty band |
| Recommendation | Drop rail and all-around `border-line`. One footer rule. Time hugs thumbs (2–4px, 11px). 3×60 thumbs. Shared `chatBubbleCorners` |
| Priority | Required before implementation |

### G-003 — Artifact page-local classes

| Field | Content |
|-------|---------|
| Gap | Prototype used `.empty`, `.fchip`, `.crow`, `.bub.ord`, a unique Chats search |
| Why it matters | Copying page-local CSS splits Chip / EmptyState / Search |
| Impact if ignored | Requests empty looks different from Orders empty; Chats search fights Explore |
| Recommendation | One EmptyState (15px title). One Chip. SearchInput stays. Kind weight is inbox row only |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Tokens `--ekum-chip-on` / `--ekum-chip-on-ink`; kit Chip selected tint; kit EmptyState 15px `font-title`.
- Inbox: kind span 12px title chip-on-ink; preview `text-meta`. Group Avatar `fallback="group"` when no photo.
- Trade cards: no rail/outer border/header hairline; min 262px; 22px tint KindIconBadge; indented subtitle; drop `logged an order`; 1:1 no shop who; group sender above header in chip-on-ink; 3×60 thumbs +count on last; View order + Decline one row; time 11px hugging content; View order 14px `font-title`.
- Docs: concepts Chip, chat.md card bands, gap matrix, ui-quality-bar Chip line.

## Explicitly deferred / rejected

- Prototype Chats search pill (keep SearchInput).
- Chip `border-radius: 999px` (keep 32px `rounded-lg`).
- Inbox preview 14px (keep `text-meta` 13px).
- Trade-card-only 8px corners (keep shared `chatBubbleCorners`).
- Thread doodle wallpaper, outgoing ticks on cards, clock timestamps.
- Theme C plan file — do not edit.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (visual; no new `@functional` journey)
