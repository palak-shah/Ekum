# Design — Chats visual polish (restrained teal)

**Date:** 2026-09-11  
**Status:** Implemented  

## Premium means

Sharper hierarchy · stronger photography · typography · spacing · **restrained teal**.  
Not: new colors, gradients, heavy shadows, glass, decorative effects.

## Cards (`ChatTradeCard`)

- Mine and theirs: white/`bg-surface` + hairline border + kind left rail (no solid `bg-accent` fill).  
- Teal: rail, KindIconBadge, View → links, Accept quote primary button only.  
- Primary title stronger; who / designs / time quieter.  
- Quote ₹ line: larger/bolder when present in details.  
- Drop `shadow-sm` on trade bubbles.

## Thumbs

Keep 2-cell + `+N` thumb layout; slightly larger cells for presence (no wash/blur on open images).

## Chat list

Company strongest; object label accent but not shouting; preview muted; time tertiary.

## Unchanged

APIs, CTAs, expand/collapse, Accept quote / View inquiry / View order behavior.
