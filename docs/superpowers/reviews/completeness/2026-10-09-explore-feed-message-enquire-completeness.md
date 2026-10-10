# Feature Completeness Review — Explore feed Message enquire

**Date:** 2026-10-09  
**Module / ask:** Explore feed icon **Message** — quick enquire on that pack/design while scrolling (compose + cards, stay on feed), same as selection Message.  
**Anchors:** `docs/features/explore.md`, `docs/features/chat.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Feed Message = ask about **this** post without leaving Explore. Not cold open chat. Same send path as selection Message. |
| UX Designer | Lead icons: **Repost · Message · Share** (Bookmark right). Reuse SelectionMessageSheet. Own posts: no Message. |
| Solution Architect | Reuse SelectionMessageSheet with one collection or product. |

---

## Platform consistency

1. Existing patterns? ExploreFeedActions icons; SelectionMessageSheet.  
2. Duplicates selection Message? Same sheet, single-post target.  
3. Reuse? Yes.  
4. Naming? Message.

**Philosophy conflict?** No — fewer hops than opening Chats mid-scroll.

---

## Approved scope

- Message icon on Explore feed (not own)  
- Compose → Send cards + note → toast; stay on feed  
- Docs + units  

## Deferred

- Shop header Message still opens chat (different job: first-chat / Chat)  
- Album ⋯ Message  

## Sign-off

Required gaps closed: Yes  
Ready: Yes  
