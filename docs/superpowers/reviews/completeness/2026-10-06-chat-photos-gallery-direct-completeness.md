# Feature Completeness Review — Chat Photos opens gallery (not camera first)

**Date:** 2026-10-06  
**Module / ask:** Chat ＋ **Photos** must open the OS gallery immediately — not a black ContinuousCamera shell that then falls through to gallery. Keep **Camera** as a peer for take-photos.  
**Anchors:** `docs/features/chat.md`, `docs/features/media.md`, prior `2026-09-12-chat-attach-camera-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | “Photos” means gallery. Camera-first then gallery feels broken (black screen). Restore peer **Camera** · **Photos** (WhatsApp muscle memory). |
| UX Designer | Photos → file picker in the same gesture after sheet close. Camera → ContinuousCamera (Gallery still on chrome). Subtitles: From your gallery / Take photos. |
| Solution Architect | ThreadPage attach menu only; reuse existing ContinuousCamera + photo input. Complaint **Add photos** keeps phone→camera (different job). |

---

## Platform consistency (required)

1. **Existing patterns?** Matches original Sept-12 attach Camera + Photos peers; Add designs stays camera-first (not this ask).  
2. **Duplicates another feature?** No — undoes the one-row merge that caused the flash.  
3. **Should reuse an existing workflow?** Yes — gallery input + ContinuousCamera.  
4. **Naming matches the app?** **Camera** · **Photos** — plain.

**Philosophy conflict?** No — fewer wrong taps; matches WhatsApp.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Photos = gallery; Camera = ContinuousCamera |
| Workflows | OK | Same album send path |
| Edge cases | OK | Camera unavailable → toast + gallery (only from Camera) |
| Mobile interactions | OK | No black shell on Photos |
| First glance (BM-11) | OK | Photos never flashes camera |
| Platform consistency | OK | |

---

## Approved scope

- Attach: Design · Collection · **Camera** · **Photos** · (Photo order) · Document · Order · Complaint  
- Photos → gallery only: sync file click in the same tap (before sheet close); accept without `image/*`  
- Camera → acquire stream first, then ContinuousCamera (no black shell on failure); desktop gallery  
- Collection: Photos = gallery; Camera peer on empty/dock/source menu (same no-flash rule)  
- Lock chat.md + collections.md; functional cover attach-camera + attach-photos  

## Explicitly deferred

- Add designs batch Photos door (separate surface)
