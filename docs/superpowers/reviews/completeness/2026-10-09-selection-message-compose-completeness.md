# Feature Completeness Review — selection Message compose

**Date:** 2026-10-09  
**Module / ask:** Selection dock order **Message · Share · Order**. Message opens a compose sheet (typed text + pile cards), sends to the owning shop, **stays on the browse page** (no forced Chats).  
**Anchors:** `docs/features/explore.md`, `docs/features/chat.md`, `docs/features/saved.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Message = ask about these designs without leaving the lot. Share = forward to others. Order = buy. No yank to Chats — toast confirms send; trader can keep Selecting / Order. |
| UX Designer | Dock **Message · Share · Order** (Order right). Kit Sheet + TextArea + Send. Quiet “N designs” cue. Text optional; cards always go. |
| Solution Architect | Reuse `postCatalogCardsToThread` + text `MessageType.Text`. Stay; keep pile. |

---

## Platform consistency

1. Existing patterns? Kit Sheet / TextArea / Button; catalog cards.  
2. Duplicates Share? No — Share picks recipients; Message is owning shop + optional text.  
3. Reuse? Yes — post helper.  
4. Naming? Message.

**Philosophy conflict?** No.

---

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Compose → send cards + text |
| Business rules | OK | Single-shop only |
| Workflows | OK | Stay on page; pile stays |
| Edge cases | OK | Empty text still sends cards |
| Error handling | OK | Toast |
| Mobile / BM-11 | OK | Sheet over dock |
| Platform consistency | OK | |

---

## Approved scope

- Dock Message · Share · Order  
- Compose sheet; send text + cards; stay; keep pile  
- Docs + units (+ e2e adjust)  

## Deferred

- Deep-link open chat after send  
- Multi-shop Message  

## Sign-off

Required gaps closed: Yes  
Ready for implementation: Yes  
