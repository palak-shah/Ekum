# Design — Chat Document attach

**Date:** 2026-09-13  
**Status:** Approved (Completeness Proceed)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-13-chat-document-attach-completeness.md`

## Goal

Chat ＋ gains **Document** so traders can send PDF / Word / Excel / text and **original photos as files**, without mixing into Photos album UX.

**Muscle memory:** Document behaves like WhatsApp (one message per file, file card with name/type/size, image thumb for photo-as-file). Prefer WhatsApp/Instagram patterns unless Ekum has a clearly simpler path.

## Behaviour

| Path | Message | UI |
|------|---------|-----|
| Photos / Camera | `photo` | Album + PhotoViewer |
| Document | `document` | File card (name · type · tap open) |

- Multi-pick: sequential upload + send; no client count cap.  
- Per file 15MB; allowlist only; video out.  
- Images via Document use Image media upload, then `document` message metadata.

## Copy

- Row: **Document** · “PDF, Word, Excel, or original photo”  
- Type cues: PDF · Word · Excel · CSV · Text · Photo  
