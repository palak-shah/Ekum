# Feature Completeness Review — Chat trade-card direction consistency

**Date:** 2026-09-11  
**Module / ask:** Outgoing business-object cards must not use solid teal fill  
**Anchors:** `docs/features/chat.md`, chats visual polish  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Alignment stays; fill language unified. Plain text bubbles keep teal. |
| UX Designer | One card system for Inquiry/Order/Quote in and out. |
| Solution Architect | ThreadPage: `actionsOnAccent=false` on trade cards; fallback shell matches surface+rail. |

## Approved scope

- Trade MessageChrome chevron not on-accent  
- Reply quote above trade cards uses light surface chrome  
- Legacy attachment fallback: surface + left rail (no `bg-accent`)  

## Explicitly deferred

- Changing plain text bubble colors  

## Sign-off

Required gaps closed: Yes · Ready: Yes
