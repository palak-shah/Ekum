# Feature Completeness Review — Chat

**Date:** 2026-08-11  
**Module / ask:** Chat functional verification + gap inventory (existing Phase 1 chat)  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Core messaging + living order cards + Requests language are coherent. Pin/mute/groups correctly Later. Functional proof of search scopes is Required for this slice; Requests inbox is Recommended. |
| UX Designer | Search band inside header matches “no always-on rail.” Empty Chats → Explore is clear. Accessibility of search stepper (↑↓) needs keyboard/focus care — Recommended. |
| Solution Architect | Reuse thread message APIs and living order upsert; do not invent a second filter system. Source masking stays server-side. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — Chats/New tabs, living order cards, You/business name, Requests vs order Accept.  
2. **Duplicates another feature?** No — not a second notifications surface.  
3. **Should reuse an existing workflow?** Yes — order CTAs stay on living cards; search owns scopes.  
4. **Naming matches the app?** Yes if we keep Requests/Open chat/Ignore (not Accept/Decline for threads).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | Search UI unproven by e2e; Requests unproven |
| Business rules | OK | Living card + actor rules documented |
| Workflows | Gap | Unconnected → Requests not in functional suite |
| Edge cases | OK | Block silent; empty states documented |
| Permissions | OK | Connection/block via access domain |
| User states | Gap | pending vs active journey untested |
| Notifications | Recommended | Unread badge clear on open — unit/e2e thin |
| Error handling | Recommended | Send failure UX |
| Scalability | OK | Cursor paging for messages |
| Mobile interactions | OK | Composer + long-press/chevron |
| Accessibility | Recommended | Search stepper labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — In-thread search scopes + stepper unproven

| Field | Content |
|-------|---------|
| Gap | All/Media/Orders browse + typed N of M stepper not covered by `@functional` e2e |
| Why it matters | Documented Phase 1 behaviour; traders rely on finding orders/photos in long threads |
| Impact if ignored | Silent UX regressions (empty All listing whole thread, broken scopes) |
| Recommendation | Add `@functional @chat` journey |
| Priority | Required before implementation |

### G-002 — Requests inbox (unconnected first contact)

| Field | Content |
|-------|---------|
| Gap | Seed walkthrough §3 not automated |
| Why it matters | Trust-safe first contact is core philosophy |
| Impact if ignored | May confuse with order Accept language if UI drifts |
| Recommendation | Functional journey in a later slice; keep naming locked |
| Priority | Recommended enhancement |

### G-003 — Pin / mute / leave / groups

| Field | Content |
|-------|---------|
| Gap | Doc says “as supported later” |
| Why it matters | Avoid shipping half-groups that fight 1:1 trade model |
| Impact if ignored | Premature multi-party complexity |
| Recommendation | Keep Later; Reject inventing Slack-like groups in Phase 1 |
| Priority | Future improvement · Reject / Redesign if asked as full groups now |

### G-004 — Share design/collection cards from thread

| Field | Content |
|-------|---------|
| Gap | Forward/share cards not in functional suite |
| Why it matters | Trade discovery via chat |
| Impact if ignored | Less confidence in card masking |
| Recommendation | Defer; API already posts cards from other flows |
| Priority | Recommended enhancement |

---

## Approved scope for this slice

- Seeded thread text send (regression + functional).  
- In-thread search: open band, Orders/Media empty browse, typed query stepper.  
- Do **not** build pin/mute/groups.

## Explicitly deferred / rejected

- Requests inbox journey → Recommended later.  
- Full groups → Reject for Phase 1 if proposed as Slack clone.

## Readiness for journeys

Required gaps deferred/in-scope: G-001 in journey scope. Sign-off: **Yes** for Chat `@functional` journey as approved.
