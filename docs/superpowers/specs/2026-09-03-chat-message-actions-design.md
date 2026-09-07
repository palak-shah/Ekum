# Chat message actions — design

**Date:** 2026-09-03  
**Status:** Approved (plan)  
**Anchors:** [chat.md](../../features/chat.md), completeness 2026-09-03-chat-message-actions

## Problem

Chevron actions are incomplete: Forward only on catalog/photo; no Copy / Star / Edit / Delete; Select all enables spammy multi-forward. Order cards must not leak soft-hidden counterparties when forwarded.

## Product promise

1. Menu: **Reply · Forward · Copy · Star · Edit · Delete** (when applicable).  
2. Forward: **text, photo, design, collection, order card** (not payment/system).  
3. Order forward = **card**; open = party + hold/reveal. Non-party teaser **hard-stripped**.  
4. Edit: own **text**, **15 minutes**.  
5. Delete: **for me** always; **for everyone** own messages within **1 hour** → tombstone.  
6. Star: in-thread chip + **You → Starred**.  
7. No **Select all** on thread forward mode; batch cap **10**.

## Locked decisions

| Topic | Decision |
|-------|----------|
| Edit window | 15 minutes from `createdAt` |
| Delete everyone window | 1 hour from `createdAt` |
| Delete for me | `MessageHide` per company |
| Star | Per user (+ company scope for list) |
| Order teaser non-party | Unavailable; no names/thumbs/amounts |
| Forward path | Order **card**, not bare id |

## Out of scope

- Delete everyone on others’ messages  
- Edit non-text  
- Forward payment/system  
- Changing TradeLane product rules  

## Spec self-review

- No TBD. Windows explicit. Order probe threat addressed. Select all removed.  
