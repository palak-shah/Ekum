# Feature Completeness Review — Chat Open = access approve

**Date:** 2026-09-16  
**Module / ask:** When the other party requested access and the chat sits in Requests, **Open chat** should grant mutual Connection — no second Network Approve.  
**Anchors:** `docs/features/chat.md`, `docs/features/access-and-connections.md`, mutual connection design  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Access request already opens a pending chat. Two gates (Open chat + Network Approve) force a second approval. One Open should finish trust when they asked for access. |
| UX Designer | Chats Requests: Open chat / Ignore only. No new chrome. After Open, Connected — no “Request access again”. |
| Solution Architect | On `POST /threads/:id/accept`, if counterpart has pending incoming access to me → run same approve path (mutual connection + events). Network Approve still activates chat (existing). |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Open chat / Ignore; mutual Connection after one Approve.  
2. **Duplicates another feature?** No — collapses dual gate.  
3. **Should reuse an existing workflow?** Yes — `AccessService.approve` path.  
4. **Naming matches the app?** Open chat (not Accept); Connected.

**Philosophy conflict?** No — matches “one Approve creates mutual pair.”

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap → OK | Open chat approves pending access from counterpart |
| Business rules | OK | Block still blocks approve; Ignore does not decline access |
| Workflows | OK | Network Approve still activates chat |
| Edge cases | OK | No pending access → Open chat only (unchanged) |
| Permissions | OK | Same decide gate as today |
| User states | OK | |
| Notifications | OK | Existing access.approved event |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Dual approve in chats

| Field | Content |
|-------|---------|
| Gap | Access request leaves chat pending; Open chat does not Connect; Network Approve is a second step |
| Why it matters | Traders think they already approved in chat |
| Impact if ignored | Forced second Request/Approve |
| Recommendation | Open chat → approve pending incoming access from that shop |
| Priority | Required before implementation |

---

## Approved scope for this slice

- `ThreadService.accept`: if direct thread counterpart has pending access request **to me**, approve it (mutual Connection + notify).  
- Client: after Open chat / Network Approve, invalidate threads + connections + access-requests.  
- Docs: chat.md + access-and-connections.md one-gate wording.  
- Unit + functional coverage.

## Explicitly deferred / rejected

- Ignore chat auto-declining access  
- Auto-connect from cold Message with no access request  

## Sign-off

Proceed — implement approved scope only.
