# Feature Completeness Review — shop + Requests plain copy

**Date:** 2026-09-26  
**Module / ask:** Shop chrome (Share, See new packs, write/chat) and Chats Requests follow-ask buttons  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Copy change only — same Follow / Message / Connection rules.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders who are new to phones and English cannot parse Asked, Message vs Chat, Allow look, Share packs. Keep two jobs: see packs vs write. Share is not a shop job. |
| UX Designer | Share → header icon (with Find / Feed·Grid). Row = See new packs / Waiting / Seeing packs + Write them / Open chat. Requests asks reuse Followers verbs, even plainer. Feed/Grid stays in the header (same as Saved / You). |
| Solution Architect | No API change. Labels from `seePacksCopy`. Open chat = active Connection. Write them = not connected (same `POST /threads/direct`). |

---

## Platform consistency (required)

1. **Existing patterns?** Header icon cluster (Find). Kit buttons on the row. Followers decide copy shared with Chats Requests.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Follow decide + startDirect.  
4. **Naming matches the app?** Plain trader words: they can see / they can put in a pack; Write them / Open chat.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Labels + Share placement only |
| Business rules | OK | Unchanged |
| Workflows | OK | |
| Edge cases | OK | From 1:1 still hide write button |
| Permissions | N/A | |
| User states | OK | Waiting / Seeing packs / Write them / Open chat |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Two row buttons; Share not a third peer (BM-07 n/a) |
| Accessibility | OK | Share `aria-label="Share"` |
| Platform consistency | OK | |

---

## Approved scope for this slice

- Shop: Share icon in header; row See new packs · **Waiting** · Seeing packs + **Write them** / **Open chat**.
- Requests follow ask: **Wants to see your new packs** · **They can see** · **They can put in a pack** (same words on Followers).
- Docs + units.

## Explicitly deferred / rejected

- Deny on Chats Requests (stays on Followers).
- Third shop label for “message sent, not approved yet” (Write them still opens that pending chat).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
