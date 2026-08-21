# Feature Completeness Review — Photo viewer

**Date:** 2026-08-21  
**Module / ask:** WhatsApp-style shared photo viewer (pinch/zoom, swipe within set) across chat, album/Saved sheets, Explore design  
**Anchors:** `docs/features/media.md`, `collections.md`, `saved.md`, `chat.md`, `explore.md`, `docs/superpowers/specs/2026-08-21-photo-viewer-design.md`  
**Disposition:** Proceed

> View-only kit. Does not add a new trade path.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need to inspect cloth. Viewer must not steal Order/Ask rates or fight select mode. One swipe set per design/chat album keeps mental model small. |
| UX Designer | Match existing dark fullscreen chat pattern; upgrade with pinch. Drop sheet Prev/Next so one flip path. Safe-area chrome; z above Sheets. |
| Solution Architect | Shared `PhotoViewer` + pure gesture helpers. Replace `PhotoAlbum` private viewer. No API. No third-party zoom in v1. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — fullscreen over content; Sheets for design meta; select unchanged.  
2. **Duplicates?** Replaces ad-hoc chat viewer + sheet Prev/Next; does not duplicate trade CTAs.  
3. **Reuse?** One kit for chat + catalog surfaces.  
4. **Naming?** Close · `N / M` · no jargon.

**Philosophy conflict?** No. Rejected: trade CTAs in viewer; feed-tile → viewer; cross-design swipe; select opens viewer.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Open / swipe / zoom / close |
| Business rules | N/A | Visibility from parent object |
| Workflows | OK | Sheet + page CTAs unchanged |
| Edge cases | OK | 0/1/many urls; mid-zoom = pan |
| Permissions | N/A | Same as parent |
| User states | OK | Select mode blocks open |
| Notifications | N/A | |
| Error handling | OK | Missing url → empty/skip |
| Scalability | OK | urls array only |
| Mobile interactions | OK | BM-07 safe area; gesture rules locked |
| Accessibility | OK | Esc, ←→, dialog label; aria on Close |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Gesture conflict mid-zoom

| Field | Content |
|-------|---------|
| Gap | Horizontal drag while slightly zoomed |
| Why it matters | Accidental photo change while inspecting |
| Impact if ignored | Trader loses place / frustration |
| Recommendation | Spec rule: zoomed or mid-zoom → pan until ≈1 |
| Priority | Required before implementation |

### G-002 — Viewer under Sheet (wrong z)

| Field | Content |
|-------|---------|
| Gap | Portal z below Sheet |
| Why it matters | “Tap photo” appears broken |
| Impact if ignored | Blocking UX |
| Recommendation | z above Sheet; verify with sheet open |
| Priority | Required before implementation |

### G-003 — Functional e2e

| Field | Content |
|-------|---------|
| Gap | No `@functional` required in v1 |
| Why it matters | Journey proof |
| Impact if ignored | Relies on units + manual |
| Recommendation | Later if chat `@media` smoke can assert viewer |
| Priority | Future improvement |

---

## Approved scope for this slice

- `PhotoViewer` kit + gesture helpers + units  
- Wire: chat `PhotoAlbum`, album/Saved design sheet main photo, Explore design page image  
- Drop sheet Prev/Next after viewer  
- Docs: `media.md` / `chat.md` / `collections.md` / `saved.md` / `explore.md` one-liners at implement time  
- Completeness Required gaps G-001 / G-002 closed in implementation  

## Explicitly deferred / rejected

- Cross-design swipe · CTAs in viewer · feed-tile open · third-party zoom lib · camera zoom · My Catalog edit thumbs · required `@functional` for v1  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / plan: Yes — after user reviews the written spec  
