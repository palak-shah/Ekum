# Feature Completeness Review — View designs lands on the set page

**Date:** 2026-10-01  
**Module / ask:** From chat, **View designs →** (and the collage tap) should open the Designs set page (Feed/Grid + Select). Do not jump straight into PhotoViewer.  
**Anchors:** `docs/features/chat.md`, `docs/features/explore.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The job after a clubbed Designs card is browse the set (pick, quote one, order). A full-screen photo strip hides Select, Feed/Grid, and names. Same page as 48h `designs` landing. |
| UX Designer | One job: see the set. Tap a design for photos; Quote stays on that viewer when opened from chat. Collage thumbs must not steal the tap into images. Complaints still open photos (no set page). |
| Solution Architect | Drop DesignSetPage auto-open. Catalog trade-card thumbs (`designs` / collection / product) are non-interactive so the card `onOpen` navigates. PhotoAlbum still opens PhotoViewer for photo messages and complaints. |

---

## Platform consistency (required)

1. **Existing patterns?** Shop / Saved / album: list first, photos on tap. Set page already has that chrome.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Reuse `/designs/set` + PhotoAlbum `interactive={false}` (same as forward select).  
4. **Naming matches the app?** Designs / View designs / Quote unchanged.

**Philosophy conflict?** No — auto-open fought “one job per screen” and hid the page the card promises.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Land on set; tap tile → viewer |
| Business rules | OK | Quote still from viewer after a tap; per-design access |
| Workflows | OK | Chat card / 48h → same page |
| Edge cases | OK | Empty / all locked stay on page |
| Permissions | N/A | Unchanged |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | No extra chrome; BM-07 unchanged |
| Accessibility | OK | Viewer no longer traps focus on entry |
| Platform consistency | OK | Matches shop browse |

---

## Gaps

None required.

---

## Approved scope for this slice

- DesignSetPage does not open PhotoViewer until the trader taps a design.
- Designs / collection / product card thumbs do not open PhotoViewer; tap follows **View designs →** / **View design →** / pack.
- Docs: Quote one design = set page → tap design → Quote.
- Tests: e2e no longer dismisses an auto viewer; card thumb tap calls `onOpen`.

## Explicitly deferred / rejected

- Changing DesignAlbumGrid (unused chat path leftover).
- Order / Ask rates on the viewer.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
