# Feature Completeness Review — Company team

**Date:** 2026-08-23  
**Module / ask:** Several employees under one company, different caps, shared company chats, owner-only chats.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, spec `2026-08-23-company-team-design.md`  
**Disposition:** Proceed

> The company trades. People log in under it. The client still sees the business name.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Owner invites by phone. Staff skip creating a shop. Caps stop the wrong person from paying or adding team. Last owner stays. |
| UX Designer | **You → Team** list + Invite sheet (name + phone, same as off-app buyer). Chat ＋ stays company/group; owner gets **Team can see** / **Only you**. No sixth tab. |
| Solution Architect | Schema already has membership caps + `Thread.visibility`. JWT must load caps. Invite token `/t/:token`. `findDirect` must include visibility so trade threads stay shared. |

---

## Platform consistency (required)

1. **Existing patterns?** You menu, ConnectionPicker rows, referral-style Copy / WhatsApp, Chats ＋ sheet.  
2. **Duplicates?** No — Network is other companies; Team is people inside this company.  
3. **Reuse?** OTP, `CompanyMembership`, thread `owner_only` (already 404s staff), StartChatSheet group.  
4. **Naming?** **Team** · **Invite** · **Staff** · **Team can see** · **Only you**. Not employees / admin / DM.

**Philosophy conflict?** No — still one company account, no OTP Trader/Buyer role.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Invite, caps, shared + owner-only |
| Business rules | OK | Phone-bound; no join if they already have a business |
| Workflows | OK | You → Team; Chat ＋ |
| Edge cases | OK | Last owner; already member; create-company-first |
| Permissions | OK | Five caps + owner_only |
| User states | OK | Owner vs staff; no-chats hides Chats work |
| Notifications | Later | Optional “joined” later; not required |
| Error handling | OK | Sheet + toast |
| Scalability | OK | One company, small team |
| Mobile interactions | OK | Sheets; last row clears chrome (BM-07) |
| Accessibility | OK | Button names |
| Platform consistency | OK | Company-facing chat |

---

## Gaps

### G-001 — Multi-company on one phone

| Field | Content |
|-------|---------|
| Gap | Schema allows many memberships; create-company and JWT use the first / reject a second shop. |
| Recommendation | **Reject this slice:** invite only if that phone has **no** company. Switcher later. |
| Priority | Reject / Redesign |

### G-002 — JWT does not carry caps

| Field | Content |
|-------|---------|
| Gap | Guard loads `role` only. Staff with `canChats: false` can still hit chat APIs. |
| Recommendation | Load five booleans on `AuthPrincipal`; `requirePermission`. |
| Priority | Required before implementation |

### G-003 — findDirect ignores visibility

| Field | Content |
|-------|---------|
| Gap | Starting Only you would reopen the shared trade thread. |
| Recommendation | Match pair **and** visibility. `ensureTradeThread` stays shared. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- You → Team: list, Invite (name + phone + `/t/:token`), edit caps, remove staff.  
- Phone with no company joins as staff; skip onboarding.  
- Enforce five caps on API + hide chrome.  
- Owner: Team can see / Only you on new 1:1. Staff cannot see owner_only.  
- Groups stay shared.

## Explicitly deferred / rejected

- Company switcher; second membership on a phone that already owns a shop  
- People tab; personal DMs; public staff phones  
- Owner-only groups; SMS send  
- How many each company search (separate ask)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes (after living docs in Task 0)  
