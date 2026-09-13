# Design — Chat ＋ Camera alongside Photos

**Date:** 2026-09-12  
**Status:** Implemented  
**Problem:** Chat thread **＋** only offers **Photos**, which opens the device gallery. Traders expect a **Camera** option next to gallery, matching Add designs / Photo order. The Photos row also misuses `CameraIcon`, which reads as “camera” but opens gallery.

## Goal

From an open thread, **＋** offers peer **Camera** and **Photos**. Camera on phone uses the shared in-app continuous camera; Photos stays gallery multi-pick. Send path and message type stay today’s photo message.

## Approach

### Attach menu

Replace the single Photos row with two peers (keep Design / Collection / Order):

| Row | Subtitle | Icon | Action |
|-----|----------|------|--------|
| **Camera** | Take photos | `CameraIcon` | Phone: close sheet → `ContinuousCamera`. Desktop: gallery multi-pick (same as Photo order). |
| **Photos** | From your gallery | Distinct non-camera glyph (add `ImageIcon` or equivalent) | Close sheet → existing hidden `input[type=file]` multi-pick. |

**Menu order (locked):** Design → Collection → **Camera** → **Photos** → Order.

### Camera (phone)

1. Close attach sheet.
2. Open shared `ContinuousCamera` (reuse `mediaSession` permission soft-release).
3. **Done** → convert shots to files → same upload + `send` path as `onPhotoPicked` today (`type: 'photo'`, body = first URL, `metadata.urls` = all). **Never** one message per shot — multi photos stay **one WhatsApp-style album bubble**.
4. **Cancel** → close camera; return to thread; nothing sent.
5. **Gallery** on camera chrome → close camera → trigger the same gallery input as **Photos**.
6. **Unavailable** → toast (danger) + open gallery picker.

`maxShots`: **30** per open session (same magnitude as Photo order `CAMERA_BATCH`). One Done → **one** photo message.

### Thread look & open (WhatsApp)

Already shipped for photo messages — **keep and rely on** (no parallel album UI):

- **In thread:** `PhotoAlbum` collage (1 / 2 side-by-side / 3 L-layout / 4+ with `+N` on last cell), bubble-sized mosaic.
- **Open:** tap any cell → shared `PhotoViewer` (fullscreen dark, counter `n / total`, swipe between album URLs, pinch / double-tap zoom, swipe-down or Close → thread).

Camera + Photos both feed that path. If collage or viewer still feels unlike WhatsApp after ship, polish `PhotoAlbum` / `PhotoViewer` in a follow-up — not a second viewer.

### Desktop

No ContinuousCamera. **Camera** and **Photos** both open the gallery multi-pick (one input is fine). Prefer showing both labels so phone/desktop menus match; both paths identical on desktop.

### Out of scope

- Composer draft staging before send  
- New message types, video, PDF  
- Changing photo album / PhotoViewer  
- Redesigning ContinuousCamera chrome  

## Acceptance

- Phone: **＋ → Camera** opens continuous camera; Done sends **one** photo message with all shots (album collage in thread); Cancel sends nothing.
- Phone: **＋ → Photos** opens gallery; multi-select still **one** album message.
- Tap album cell → PhotoViewer over full album (swipe / pinch); Close returns to thread.
- Camera chrome **Gallery** reaches the same gallery path.
- Camera unavailable → toast + gallery fallback.
- Desktop: Camera / Photos open gallery (no crash / blank camera).
- Icons: Camera ≠ Photos glyph.
- Leave guard still covers in-flight photo upload.

## Docs / tests

- Update `docs/features/chat.md` Attach share line.
- Completeness sibling + gap-matrix row.
- Functional: extend chat journey or add a small `@functional @chat` step that opens attach and asserts Camera + Photos rows (`data-testid`s). Camera capture itself may stay unit/manual if Playwright cannot drive getUserMedia reliably — document that.
