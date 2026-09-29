# Feature Completeness Review — Fold Network Requests into Chats Requests

**Date:** 2026-09-28  
**Module / ask:** Drop **You → Network → Requests** as a daily desk. Incoming access Approve lives only in **Chats → Requests**. Outgoing “I asked them” is not a second Requests home.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Network Incoming is a second Approve desk for the same Connection as Chats first-write Approve. Invite/Find-on-Ekum already opens a pending thread. One list: Chats Requests. |
| UX Designer | Reuse inbox chips + thread Approve/Ignore + see-packs Allow/Decline. No new chrome. Deep link `/chats?inbox=requests`. Home Requests chip and `/network/requests` / `/buyers` land there. |
| Solution Architect | API `GET /access-requests/*` stays. No new endpoints. Web: remove Network Requests screen; stop composing incoming access as a separate Home Need (pending thread already is the need). Connections roster stays for Pause/Resume/Unblock. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Chats Requests is the Approve desk; Home Needs already has chat_request rows.  
2. **Duplicates another feature?** Yes — Network Requests Incoming duplicates Chats Requests. This slice removes the duplicate.  
3. **Should reuse an existing workflow?** Yes — pending thread + `POST /threads/:id/accept` (already grants Connection).  
4. **Naming matches the app?** Requests stays on Chats. Network no longer has a peer Requests row.

**Philosophy conflict?** No — fewer paths, same Connection model.

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Incoming still Approve via chat; invite note is the first message |
| Business rules | OK | Mutual Connection unchanged; Decline on Network list goes away — Ignore on chat stays |
| Workflows | OK | Home / old URLs → Chats Requests |
| Edge cases | Later | Outgoing pending/approved list (no chat yet from their side) |
| Permissions | OK | Same chats cap |
| User states | OK | Empty Chats Requests copy covers first write + packs + connect |
| Notifications | OK | Existing access/chat notifications; tap should land Chats |
| Error handling | N/A | No new mutations |
| Scalability | N/A | Same lists |
| Mobile interactions | OK | No extra sticky bar |
| Accessibility | OK | Same chips / rows |
| Platform consistency | OK | One Requests desk |

---

## Gaps

### G-001 — Outgoing “I asked them”

| Field | Content |
|-------|---------|
| Gap | Network Outgoing Pending/Approved has no Chats equivalent if they never opened the thread. |
| Why it matters | Rare after Message-first shop; invite still creates a thread on their side. |
| Impact if ignored | Asker uses shop “Asked” / Find-on-Ekum, not a second Requests home. |
| Recommendation | Defer. No outgoing Requests screen. |
| Priority | Future improvement |

### G-002 — Connections roster

| Field | Content |
|-------|---------|
| Gap | Pause / Resume / Unblock still live on Network → Connections. |
| Why it matters | Block is on chat More; Pause is not. |
| Impact if ignored | Traders keep one Network list for those verbs. |
| Recommendation | Keep Connections this slice. Do not fold Pause into Chats without a later Completeness. |
| Priority | Future improvement |

---

## Approved scope for this slice

- Remove **Requests** from You → Network hub. Keep Connections, I see theirs, They see mine, Invites.
- Redirect `/network/requests` and `/buyers` to `/chats?inbox=requests`.
- Chats reads `inbox=requests` (and unread/groups) so Home / deep links open the right chip.
- Home Needs: do not add a separate Access request row; Requests metric = pending chats + follow asks; Requests chip → Chats Requests.
- Connections header: drop the Requests link.
- Docs: access, chat, home, gap matrix.

## Explicitly deferred / rejected

- Outgoing access-request list / shop “Asked” line.
- Removing Connections (Pause/Resume/Unblock).
- Inbox-row Approve buttons (still in-thread Approve · Ignore as today).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
