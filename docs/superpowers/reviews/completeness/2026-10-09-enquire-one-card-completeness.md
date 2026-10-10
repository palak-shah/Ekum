# Feature Completeness Review — enquire as one catalog card

**Date:** 2026-10-09  
**Module / ask:** Selection/Explore Message sends **one** catalog card with the typed note on that card (not a Reply bubble). Tap View designs/collection opens the lot.  
**Anchors:** `docs/features/chat.md`, `docs/features/explore.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One bubble = lot + ask. Reply chrome felt like two messages. |
| UX Designer | Reuse trade-card `note` slot; metadata `enquireNote`. |
| Solution Architect | No new MessageType; postCatalogCardsToThread accepts enquireNote on last card. |

**Philosophy conflict?** No.

## Approved scope

- Drop text+replyToMessageId enquire path  
- metadata.enquireNote on catalog card; render as card note  
- Tap View designs/collection unchanged  
- Docs + units  

## Sign-off

Ready: Yes  
