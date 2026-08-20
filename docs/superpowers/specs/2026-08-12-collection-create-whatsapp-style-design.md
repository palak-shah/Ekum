# Design: Collection create (WhatsApp-style) + Buyer groups + seasonality

**Date:** 2026-08-12  
**Status:** Slice 1 implementing; Slices 2–3 specified, deferred  
**Anchors:** `docs/features/00-concepts.md`, `collections.md`, `catalog.md`, `broadcast.md`

## Platform verdict

Proceed for Slice 1. Collections remain albums of designs; attach is WhatsApp-style (camera/gallery), not a Media tab. Buyer groups elevate broadcast lists (not chat rooms). `endsAt` = scheduled Hide.

See plan: `.cursor/plans/collection_create_whatsapp_d33edd13.plan.md` (platform consistency section).

## Slice 1 — New collection create

### Flow (kept deliberately thin)

1. **Photos** and/or **Designs** (library) → grid. Designs-only is allowed.
2. Auto name (editable).
3. One CTA: **Create** → draft album; first item = cover; new photos = draft designs.
4. Publish / Share / description live on the **edit** screen after create.

### Rules

- Photos always create draft `Product` rows + membership.
- Cover = first photo’s URL (reorder-by-remove is enough for v1).
- No same-for-all / My designs / Publish/Share on the create screen.

### Out of Slice 1

- Buyer group settings / no-forward enforcement  
- `endsAt`  
- Extracted global attach sheet for ＋ menu  

## Slice 2 — Buyer groups (deferred)

Elevate `BroadcastList` → Buyer groups with defaults (rates, allowForward). One CRUD under Buyers/Broadcast. Shared publish sheet pre-fills from group.

## Slice 3 — Evergreen / endsAt (deferred)

`Collection.endsAt` null = evergreen; on expiry → Hide to draft (not auto-archive).

## Reject

Top-level Media tab · Slack chat groups · orphan photos · trade without connection via group.
