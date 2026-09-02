# Feature Completeness Review — chat membership

**Date:** 2026-09-01  
**Module / ask:** Owners-only default roster; mute; leave / rejoin; last owner on 1:1 cannot leave; remove/archive group; all owners notified on first reach; Ignore for all owners; no Private/Team labels; one 1:1; groups unique by shops + your people; Leave Team = archive.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/company.md`, lock `chat_membership_review_6d5e65a8`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Quiet chat = owners only until an owner adds staff. Do **not** name it Private. Do **not** open a second thread.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One shop, one order-home 1:1. Staff stay out until added. All owners hear first reach. Mute stays; Leave drops you; last owner on that 1:1 mutes. Network block already stops pings. |
| UX Designer | `＋` is one sheet (team + companies). Inbox/header = business name only. ⋯: Mute, Leave, Your people (owners), Remove group (groups). Clone → “That’s the same as [name]. Open that chat?” No Team/Private pills. |
| Solution Architect | Keep company `ThreadParticipant` (request / archive / pin / company inbox). Add user `ThreadMember` (who sees the thread, personal mute, leave). `findDirect` = pair only. Group fingerprint = other companies + counted people (left chat + archived Team still count; owner × does not). |

---

## Platform consistency (required)

1. **Existing patterns?** Chats `＋` sheet, ConnectionPicker rows, thread ⋯ portal, Open chat / Ignore (not Accept), Network block (silent).  
2. **Duplicates another feature?** No — this replaces Private/Team split; does not duplicate Network requests.  
3. **Should reuse an existing workflow?** Yes — Network **Block**; existing mute/leave APIs extended to people; Open/Ignore stay.  
4. **Naming matches the app?** Your people · Leave · Mute · Remove group · Open existing. No Private / Team on chats. No Seller/Buyer.

**Philosophy conflict?** No — still company ↔ company; counterpart sees business name only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Roster, mute, leave/rejoin, archive group, one `＋` sheet |
| Business rules | OK | Last owner 1:1 mute-only; group key includes left/archived people |
| Workflows | OK | First reach → all owners; Ignore company-wide; `＋` Open existing rejoins |
| Edge cases | OK | Blocked = no ping; archived group inbound = ping owners; clone stop |
| Permissions | OK | Owners add/× people; staff Leave/Mute; chats cap still required to send |
| User states | OK | Pending request; left member; archived Team; last owner |
| Notifications | OK | First reach + archived inbound → active owners; mute skips pings; pending no longer silent |
| Error handling | OK | Last-owner leave → tell them to mute; clone → open existing |
| Scalability | OK | Fingerprint lookup + member table |
| Mobile interactions | OK | Sheet + ⋯; Your people sheet must clear last row (BM-07) |
| Accessibility | OK | Menu items named Mute / Leave / Your people |
| Platform consistency | OK | Kit Sheet, accent rows, no checkboxes |

---

## Gaps

### G-001 — Existing Private threads

| Field | Content |
|-------|---------|
| Gap | Some pairs already have `owner_only` + `shared`. |
| Why it matters | Product is one 1:1. |
| Impact if ignored | Two rows for one shop. |
| Recommendation | Stop creating `owner_only`. `findDirect` prefers the shared/order-home thread. Leave leftover Private threads in place but unlabeled; do not merge histories (deferred). |
| Priority | Required before implementation (no new Private; prefer shared) |

### G-002 — Existing shared threads and staff

| Field | Content |
|-------|---------|
| Gap | Today every chats-cap staff sees shared threads. |
| Why it matters | Cutting them off overnight hides live order homes. |
| Impact if ignored | Staff lose chats they already use. |
| Recommendation | Backfill: shared → owners + staff with chats cap; owner_only → owners only. **New** threads = owners only. |
| Priority | Required before implementation |

### G-003 — Leave Team was hard-delete

| Field | Content |
|-------|---------|
| Gap | `removeMember` deletes `CompanyMembership`. |
| Why it matters | Dedup must still count Priya; work stays. |
| Impact if ignored | Leave Team creates a clone group. |
| Recommendation | Archive membership (`archivedAt`); JWT ignores archived; Team list hides them. |
| Priority | Required before implementation |

Required gaps closed in this slice.

---

## Approved scope for this slice

- User `ThreadMember` + company participant kept.
- New chats: seed **active owners** (+ staff the starter picks).
- Inbox/get/send: must be an active member (or owner on pending first-reach).
- One 1:1 per pair; no Private start; drop Team/Private labels and ⋯ Private message.
- Groups: find-or-open by companies + counted people; clone add/× blocked.
- Mute (per person), Leave, rejoin via `＋` Open existing, last owner on 1:1 cannot Leave.
- Remove group = archive our company participant; inbound write (if not blocked) pings owners.
- First reach: notify **active owners**; Ignore archives for the company.
- Leave Team = archive person; internal “left the team”; still in group fingerprint.
- Web: one `＋` sheet; ⋯ Mute/Leave/Your people/Remove group; docs + units + `@chat` / requests journeys updated.

## Explicitly deferred / rejected

- Who joins new chats / Manage chats / assignment board.
- Merge two thread histories.
- Second thread / Private or Team labels.
- Chat-only block list (use Network block).
- @mentions. Staff inviting.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
