# Feature Completeness Review — Presentable invite to connect

**Date:** 2026-09-11  
**Module / ask:** Invite-to-connect WhatsApp share + `/r/:token` landing feel trustworthy and worth joining (Ekum brand, company name, no bare double URL).  
**Anchors:** `docs/features/referrals.md`, `docs/features/collections.md` (48h OG pattern), `shareInvite.ts`, ShareLinkLandingPage  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders share invites on WhatsApp. Double URL + generic OG + shell “Connect” card kill trust for new users. |
| UX Designer | Same door language as 48h share: Ekum mark, company hero, one why-line, one CTA. Focused surface — no bottom nav. |
| Solution Architect | Reuse share-link OG HTML pattern for `/r/:token`; fix `navigator.share` duplicate URL; move landing outside AppShell. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — `/s/:token` OG card + focused guest chrome; catalog share copy.  
2. **Duplicates another feature?** No — polish of existing invite.  
3. **Should reuse an existing workflow?** Yes — `shareLinkOgHtml` pattern; `shareMessageText`; invite return stash.  
4. **Naming matches the app?** Connect / Request to connect / Ekum — no Seller/Buyer jargon.

**Philosophy conflict?** No — invite is a door-in surface; brand + one job is correct.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Share + land + redeem unchanged in meaning |
| Business rules | OK | Still access request → approve on Buyers |
| Workflows | OK | Guest → login → `/r/` → request |
| Edge cases | OK | Invalid token; self-redeem; vouch vs open |
| Permissions | OK | Public card HTML; redeem still authed |
| User states | OK | Guest / onboard / ready |
| Notifications | N/A | |
| Error handling | OK | Expired/invalid on focused page |
| Scalability | OK | |
| Mobile interactions | OK | No sticky bar clip (no bottom nav) |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required for this slice.

---

## Approved scope

- WhatsApp: `{Business} invites you…` + URL once; share without duplicate `url` field  
- Public OG card for `/r/:token` (Ekum icon / logo + title/description)  
- Focused `/r/:token` landing outside AppShell (no bottom nav)  
- Docs: referrals.md  

## Explicitly deferred

- Custom generated invite PNG attachment  
- Redesign of You → Invites list chrome  
- Team `/t/` landing visual parity (optional follow-up)

## Sign-off

Proceed — implement approved scope only after design spec review.
