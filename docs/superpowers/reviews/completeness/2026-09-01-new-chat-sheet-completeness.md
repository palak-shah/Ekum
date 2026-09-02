# Feature Completeness Review — New chat sheet (Chats +)

**Date:** 2026-09-01  
**Module / ask:** Chats ＋ sheet: title **New chat**; Your team search + Select all / Clear; drop helper copy; Find on Ekum as a **link** after business search (immediate if no connections); invite via OS share; **Create** for groups.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/features/access-and-connections.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. One ＋ sheet. Do **not** sync the phone address book. Other pickers keep the Find on Ekum **field**.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Start a 1:1 or group from one sheet. Need at least one other business. Team optional. Find shops not already in Connections; invite is a connect link they share off-app. |
| UX Designer | Title **New chat**. No why-lines. Side-by-side **Businesses** / **Your team** pills (same case as Chats inbox). One list at a time. Team: search + Select all / Clear. Find on Ekum is a link. Footer: Pick a business / Open chat / **Create**. |
| Solution Architect | Scope `StartChatSheet` + `findOnEkum="link"` on ConnectionPicker. Reuse `GET /search`, access request, `POST /referrals` + `shareOrCopyInvite`. Field variant unchanged for Order-for-buyer and other pickers. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet, accent-border rows, attach-style Select all / Clear, Find on Ekum results + Request access / Message, referral share.  
2. **Duplicates another feature?** No — same Find / invite, different chrome on this sheet only.  
3. **Should reuse an existing workflow?** Yes — search, access request, open invite share. No WhatsApp composer.  
4. **Naming matches the app?** New chat · Your team · Find on Ekum · Send invite · Open chat · Create. No Private / Team.

**Philosophy conflict?** No — still company ↔ company; invite is connect-with-me, not address-book upload.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Title, team multi-select, Find link, share invite, Create |
| Business rules | OK | One other business min; 1:1 vs group unchanged; Find results exclude connection list |
| Workflows | OK | Empty network → Find link immediately; typed search → link; tap → platform hits |
| Edge cases | OK | Empty query + no connections → field after tap; field pickers still phone-miss invite only |
| Permissions | OK | chats cap; team list owners only |
| User states | OK | No staff; no connections; already requested |
| Notifications | N/A | No new pings |
| Error handling | OK | Search fail + share abort; start errors stay in-sheet |
| Scalability | OK | Same /search limit |
| Mobile interactions | OK | Sheet + sticky footer; body padding already; BM-07 |
| Accessibility | OK | Named heading, Find on Ekum control, Select all / Clear |
| Platform consistency | OK | Link mode is Chats ＋ only |

---

## Gaps

### G-001 — Phone address book match

| Field | Content |
|-------|---------|
| Gap | Ask to map device contact names to phones. |
| Why it matters | Web cannot reliably read the address book (especially iOS). Upload is a new privacy product. |
| Impact if ignored | Traders still invite via OS share (WhatsApp / Messages / email). |
| Recommendation | **Defer.** Invite = `shareOrCopyInvite`. Contact Picker later. |
| Priority | Future improvement |

### G-002 — Empty query + no connections

| Field | Content |
|-------|---------|
| Gap | Link is visible with nothing typed. |
| Why it matters | Need a query for /search. |
| Impact if ignored | Tap does nothing useful. |
| Recommendation | After tap with empty query, show name / mobile / GST field (same as today’s Find). |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Chats ＋ sheet copy and team search / Select all / Clear.
- `findOnEkum="link"` on this sheet only: link after 2+ characters, or immediately if no connections; results exclude listed connections; invite always under opened results (create + share).
- Footer **Create** when two or more businesses; **Open chat** for one; **Pick a business** for none.
- Docs + units + `@chat` heading / Create.

## Explicitly deferred / rejected

- Device contact sync / Contact Picker.
- Changing Find on Ekum **field** on other pickers (phone-miss invite only stays).
- Renaming **Open chat** or **Pick a business**.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
