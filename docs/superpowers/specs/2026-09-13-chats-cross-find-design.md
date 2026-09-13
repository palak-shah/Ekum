# Design — Chats cross-chat find

**Date:** 2026-09-13  
**Status:** Approved (Completeness Proceed)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-13-chats-cross-find-completeness.md`

## Goal

From Chats list search (empty query), find Photos / Documents / Collections / Designs **across chats**, WhatsApp-style. Orders stay on Orders.

## Entry

1. Chats → focus search, query empty → section **In chats** with four rows.  
2. Typing query → existing chat name / deep message hits (no category required).  
3. Tap category → `/chats/find?kind=…` with pill in search chrome; Back returns to Chats.

## Results

| Kind | Layout | Tap |
|------|--------|-----|
| Photos | 3-col grid, month headers | Thread at message |
| Documents | List: chat · filename · type | Thread at message |
| Collections / Designs | List: chat · card name · thumb | Thread at message |

## Copy

Empty: “No photos in chats yet” / “No documents in chats yet” / etc.
