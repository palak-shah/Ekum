# Design — Collection same-for-all + photos-first create

**Date:** 2026-09-18  
**Status:** Approved for implementation  
**Problem:** Collection create/edit forced a fields-only member sheet, no Same for all, and no way to add more photos to a design. WhatsApp-trained suppliers often want photo dump only; others want shared rates.

## Goal

One photos-first path: dump designs → optional Same for all → pack name → Save/Publish. Tap a design for details or unlimited more photos. Rate may be a single number or a range.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Same for all UI | Compact summary row under design grid → sheet (not always-open form) |
| Required before save | Pack name only; rates/details optional |
| Inheritance | **Done** sets shared defaults for **new photos** (pending + later camera/gallery). Library designs keep their rates/tags — never bulk-PATCH from this sheet. |
| Per design | Overrides + **Diff** badge + accent ring when they differ from shared; tap → edit or **Use same as all designs** |
| Sheet CTA | Single **Done** (toast clarifies saved / cleared) |
| Photos per design | **No cap** (collection + Add designs) |
| Rate range | `rate` + optional `rateMax`; text input `1200` or `1200-1400` |
| Orders | Snapshot `rate` only (low/single); quote remains firm |
| Foreign curated | No Add photos / no force apply |

## Screen layout

```text
[ Design grid · Designs CTA ]
  Tip: Tap a design to edit or add photos
[ Same for all designs › ]   optional dashed when empty
[ Name · Description · Tags ]
[ Create & Publish / Save ]
```

## Member sheet

1. Photo strip + Add photos (camera/gallery append)  
2. Name / tags / rate / unit / MOQ / notes  
3. Done · Use same as all designs (when shared + >1 design)

## Out of scope

Order range math; Collection DB column for same-for-all; forcing details before publish; bulk overwrite of library from Same for all.
