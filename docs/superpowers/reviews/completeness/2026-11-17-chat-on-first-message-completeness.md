# Feature Completeness Review — Chat on first message

**Date:** 2026-11-17  
**Module / ask:** Sheet #13 — shop Message/Chat, album Message, and Chats ＋ must not create an empty Direct; create only when the first message is sent. Existing Direct still opens.  
**Anchors:** `docs/features/chat.md`, `docs/features/company.md`, Selection Message (already send-gated)  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Curiosity taps must not leave empty Pending/Active threads. First write creates the chat (with content). Connect Ask keeps its intro note. |
| UX Designer | Cold Message → compose sheet (To {shop} + text + Send), same family as Selection Message. Chat label when a Direct already exists → open that thread. |
| Solution Architect | Move `POST /threads/direct` from tap to Send; then `POST .../messages` text. Reuse Selection Message chrome for first text. No API change required. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Selection / Share create-on-Send.  
2. **Duplicates?** No — shop Message was empty-open; align with Selection.  
3. **Reuse?** `FirstMessageSheet` / StartChat compose step + kit Sheet.  
4. **Naming?** Message / Chat labels unchanged (`shopWriteLabel`).  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Create + first text on Send |
| Business rules | OK | Existing Direct opens; Connect Ask unchanged |
| Workflows | OK | Shop, album, Chats ＋ |
| Edge cases | OK | Block / CANNOT_MESSAGE; unconnected → Requests with body |
| Permissions | OK | |
| Notifications | OK | First real message notifies |
| Mobile / BM-07 | OK | Sheet above nav |
| First glance (BM-11) | OK | Compose, not empty thread |
| Units | N/A | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Empty Direct on Message tap

| Field | Content |
|-------|---------|
| Gap | `startDirect` on shop/album/Chats ＋ opens empty thread. |
| Why it matters | Inbox noise; Requests without content. |
| Recommendation | Compose until Send; open existing if present. |
| Priority | Required before implementation |

---

## Approved scope

- Completeness + feature doc lock.
- Shop / album Message: existing Direct → navigate; else FirstMessageSheet → Send creates + text.
- Chats ＋: after pick (and optional team), existing → open; else compose → Send.
- Connect Ask, Selection/Share, `ensureTradeThread` unchanged.
- Units + audit #13 Fixed.

## Explicitly deferred / rejected

- Draft route `/chats/new?company=` without sheet — Rejected (reuse sheet).
- Changing Connect Ask intro — Rejected.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
