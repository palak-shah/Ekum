# Feature Completeness Review — Easy + trustworthy no-forward

**Date:** 2026-08-13  
**Verdict:** Proceed  
**Scope:** Company usual publish defaults; optional buyer-group inherit; pack/design `allowForward` snapshot; hard chat enforce + hide Forward; honest post-publish confirmation.

## Product decisions

| Topic | Decision |
|-------|----------|
| Mental model | Usually allow; lock per group or this pack; if locked, buyers cannot send it on |
| Layers | Company usual (remember last) → optional group override → Publish sheet |
| Knobs | Show rates + Buyers can forward only |
| Owner | Supplier can always publish / Explore / first share into chat |
| Non-owner | API `FORWARD_NOT_ALLOWED`; Forward hidden (not disabled tease) |
| Copy | Toast “Buyers can’t forward this.” — no false “exclusive” without gate |

## Reject

| Item | Why |
|------|-----|
| Who can / can’t forward lists | Permissions matrix; use separate packs per tier |
| Soft “please don’t forward” | Not trustworthy without API block |
| Multi-group divergent rules on one live item | Out of scope |

## Verification

- Unit: `publish-policy`, message forward reject/owner share, `canForwardMessage`, serializer `allowForward`
- Docs: concepts, broadcast, collections, chat
