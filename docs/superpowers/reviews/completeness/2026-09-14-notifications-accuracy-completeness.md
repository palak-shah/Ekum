# Feature Completeness Review — Notifications accuracy

**Date:** 2026-09-14  
**Module / ask:** Make the notifications bell accurate end-to-end — mark-read + badge sync, trader-plain who/what copy, deep links (incl. push) that land on the right screen.  
**Anchors:** `docs/features/notifications.md`, `docs/features/00-concepts.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Bell is the alert log. Open → unread drops; copy names who/what; tap lands on the trade/chat/pack. Anonymous “A buyer placed…” and wrong links break trust. |
| UX Designer | One job: skim and open. Tap = mark that row read then navigate. Badge matches visible list (user-scoped rows). No new chrome; reuse list + × delete. |
| Solution Architect | Listeners enrich copy via Prisma name lookups (Notifications stays a consumer). Shared client `notificationDeepLink`; returns deep-link via `refType: order` + orderId. Push payload carries path; SW opens it. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — header bell, `/notifications` list, kit EmptyState, existing `POST /:id/read`.  
2. **Duplicates another feature?** No — Home Needs is actions; bell is alert log.  
3. **Should reuse an existing workflow?** Yes — existing mark-read / clear APIs; domain events already emitted.  
4. **Naming matches the app?** Plain trader language with company names and order labels — no Seller/Buyer jargon in titles.

**Philosophy conflict?** No — accuracy of an existing surface, not a new alert product.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap → OK | Tap mark-read; deep-link map; push path |
| Business rules | Gap → OK | Unread badge = list visibility scope |
| Workflows | OK | Bell → list → open detail |
| Edge cases | OK | Missing name → fallback; unknown refType → inbox |
| Permissions | OK | Company-scoped rows; user-scoped when set |
| User states | OK | |
| Notifications | OK | This slice |
| Error handling | OK | Mark-read failure still navigates (best effort) |
| Scalability | OK | Listener lookups by id; no N+1 fan-out beyond event |
| Mobile interactions | OK | List clearance unchanged (BM-07 N/A for new sticky) |
| Accessibility | OK | Row links remain actionable |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Tap does not mark read / badge stale

| Field | Content |
|-------|---------|
| Gap | Opening a row does not call mark-read; clear/mark-all may leave badge wrong vs visible feed |
| Why it matters | Seed walkthrough promises unread drops on open |
| Impact if ignored | Badge lies; traders ignore the bell |
| Recommendation | Tap → POST read then navigate; align unreadCount with list visibility; invalidate unread-count |
| Priority | Required before implementation |

### G-002 — Anonymous copy

| Field | Content |
|-------|---------|
| Gap | Titles/bodies say “A buyer…” without company / order label |
| Why it matters | Traders need who/what at a glance |
| Impact if ignored | Inbox is noise |
| Recommendation | Enrich in listeners with name/label lookups |
| Priority | Required before implementation |

### G-003 — Incomplete deep links + push opens `/`

| Field | Content |
|-------|---------|
| Gap | collection/product/broadcast fall through; returns → `/orders` not ticket; push click → `/` |
| Why it matters | Open must land on the related screen |
| Impact if ignored | Dead ends; push useless |
| Recommendation | Full `refType` map; returns → order id; push JSON `url` + SW open |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Tap item → mark that notification read → navigate deep link  
- Unread badge count uses same visibility as list (`recipientUserId` null or current user)  
- Invalidate unread-count on mark-all / clear / delete / mark-one  
- Listener copy with who/what (company name, order label, status)  
- Deep-link map for order / thread / company / collection / product / broadcast; returns via order ref  
- Push payload includes path; service worker opens that path  
- Units + `@notifications` e2e + gap matrix  

## Explicitly deferred / rejected

- New emitters for sample / complaint / “New drop” for followers  
- Per-type mute settings UI  
- Facilitator order notifications  

## Sign-off

Proceed — implement approved scope only.
