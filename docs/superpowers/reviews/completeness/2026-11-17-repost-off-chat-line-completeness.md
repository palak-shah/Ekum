# Feature Completeness Review — Repost-off chat system line

**Date:** 2026-11-17  
**Module / ask:** Sheet #9 — mill turns off Repost (Pack → Look) must post a grey centered system line only in mill↔trader Direct, with viewer-relative wording. Client said “Share off”; product name is **Repost**. Forward/Share stays ungated.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`, Completeness `2026-11-14-look-only-blocks-repost`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mill revoke of Repost is a trust event between mill and trader only. Buyer has no grant in that hop. Copy must say who did what. Forward/Share is not this permission. |
| UX Designer | WhatsApp-style grey centered pill — not a typed bubble. Trader: `{Mill} turned off Repost for you · Request`. Mill: `You turned off Repost for {Trader}`. “Request” is plain text cue (existing Request flows), not a CTA in the pill. |
| Solution Architect | Trigger = `setAccess` Pack→Look only. Drop notify on unfollow and Stop/deny. Target = exact 2-party Direct. Persist `share_revoked` metadata with names; UI centers via `isChatSystemNotice` + viewer-relative helper. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — system pills (`CHAT_SYSTEM_PILL_CLASS`, leave notices); viewer-relative order tags.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — `notifyShareOff` + Direct thread, hardened.  
4. **Naming matches the app?** **Repost** (not Share). Share/Forward remains open.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One system line on mill Pack→Look |
| Business rules | OK | Mill↔trader only; Forward ungated |
| Workflows | OK | setAccess only |
| Edge cases | OK | No exact Direct → skip; unfollow/Stop silent; legacy body fallback |
| Permissions | OK | Repost revoke only |
| User states | OK | Viewer-relative copy |
| Notifications | OK | Chat line only in that Direct |
| Error handling | N/A | Silent skip if no thread |
| Scalability | N/A | |
| Mobile interactions | OK | Pill chrome; no sticky bar change |
| First glance (BM-11) | OK | Grey centered, not bubble |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Text notice |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Wrong thread / wrong people

| Field | Content |
|-------|---------|
| Gap | `findDirectThreadId` does not require exactly two participants; Buyer can see the line. Unfollow/Stop also call `notifyShareOff`. |
| Why it matters | Buyer unrelated to mill Repost toggle gets a false trust message. |
| Impact if ignored | Client bug #9 continues. |
| Recommendation | Exact 2-party Direct; notify only on `setAccess` Pack→Look. |
| Priority | Required before implementation |

### G-002 — Bubble + flat copy

| Field | Content |
|-------|---------|
| Gap | `share_revoked` not treated as centered notice; body does not name who acted. |
| Why it matters | Looks like a person typed; neither side knows who revoked. |
| Impact if ignored | Trust confusion. |
| Recommendation | Center `share_revoked`; viewer-relative Repost copy. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Completeness + feature doc lock for viewer-relative Repost-off line.
- API: `setAccess` Pack→Look only; exact 2-party Direct; metadata with mill/trader ids + names; remove notify from unfollow and Stop/deny.
- Web: `isChatSystemNotice` + `shareRevokedNoticeText`; Thread + inbox preview; units.
- Audit #9 + gap matrix update.

## Explicitly deferred / rejected

- Tappable “Request” inside the pill — Rejected (plain text cue only).
- Changing Forward/Share gates — Rejected (ungated).
- Auto-create Direct solely to host the line — Rejected (skip if no exact pair Direct).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
