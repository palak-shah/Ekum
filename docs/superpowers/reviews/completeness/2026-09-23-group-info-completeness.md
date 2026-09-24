# Feature Completeness Review — Group info

**Date:** 2026-09-23  
**Module / ask:** Opening a group should show members; or tap the group name for a WhatsApp-like page (name, description link, Share, Search, add members). Share sends a group invite.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/referrals.md`, `2026-09-01-chat-membership-completeness.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | A group is **businesses**, not other shops’ staff. Traders need to see who is on the group, add a connected shop, and share a join link. Stuffing the thread with a member list fights “one job per screen.” Tap the **title** → group page. |
| UX Designer | Reuse PageHeader, `ListSearchRow` (search + **＋**), ConnectionPicker sheet, existing Group photo/one-line sheet. Share is one secondary button — not three WhatsApp icon pills. Search filters **companies on this group**. Thread message search stays on the chat. |
| Solution Architect | `GET` thread already has `participants`. `POST /threads/:id/participants` already adds connected shops. New `inviteToken` on `Thread`; public `/g/:token` landing; join if connected to a shop already on the group. |

---

## Platform consistency (required)

1. **Existing patterns?** Company rows (avatar + name + city), ConnectionPicker, referral `/r/` landing, mute/⋯ stay on the thread.  
2. **Duplicates another feature?** Team on chat = **our staff**. Group page = **businesses**. Connect invite ≠ group invite.  
3. **Should reuse?** `addParticipants`, GroupProfileSheet, `shareOrCopyInvite`, Find on Ekum only if they need a new Connection first.  
4. **Naming?** **Businesses** · **Add a line** · **Share group** · **Add businesses**. No Members/Admin/Voice.

**Philosophy conflict?** No if we refuse other-shop staff lists, Voice chat, and Media/Settings tabs (message search + thread ⋯ already cover those).

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Title → info; list; search; add; share/join; description |
| Business rules | OK | Add/join = Connection to a shop on the group; no @everyone of staff |
| Workflows | OK | Chat → info → add sheet / share / edit line |
| Edge cases | OK | Already in → Open chat; not connected → connect with host first; 1:1 title still company |
| Permissions | OK | Photo/line = owners; add/share = anyone on the chat |
| User states | OK | Archived our-side restore on join |
| Notifications | OK | Join is silent except they appear in the list |
| Error handling | OK | In-sheet notice / danger toast |
| Scalability | OK | One token per group |
| Mobile interactions | OK | List padding above bottom nav (BM-07) |
| Accessibility | OK | Title is a link; list search labeled |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Other shops’ people on the group page

| Field | Content |
|-------|---------|
| Gap | WhatsApp lists people |
| Why it matters | Ekum never sends their roster |
| Impact if ignored | Philosophy break |
| Recommendation | List **businesses** only |
| Priority | Reject / Redesign |

---

## Approved scope for this slice

- Tap **group title** → `/chats/:id/info` (not a member strip on the thread).  
- Hero: photo, name, **N businesses**, blurb or owner **Add a line** (existing 80-char sheet).  
- **Share group** — OS share / copy `/g/:token`. Landing: join if connected to a shop on the group; else ask to connect with the host. Already in → Open chat.  
- **Search** filters companies on this page.  
- **＋ Add businesses** — ConnectionPicker, shops not already on the group.  
- Tap a company → `/company/:id`. Our row says **You**.

## Explicitly deferred / rejected

- Voice chat  
- Members / Media / Settings tabs → **shipped next** in `2026-09-23-group-info-media-settings-completeness.md` (Businesses · Media · Settings)  
- Other shops’ staff / Admin badges  
- Invite people who are not Connected (must connect first)  
- Editing the group **name** → shipped in `2026-09-23-group-identity-inline-completeness.md`

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
