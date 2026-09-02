# Feature Completeness Review — Find on Ekum (connection pickers)

**Date:** 2026-08-27  
**Module / ask:** Find a business by name, mobile, or GST inside Chats **＋ → Chat with a company** and other ConnectionPicker lists; connect without going to Explore first.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/chat.md`, `docs/features/referrals.md`  
**Disposition:** Proceed

> Targeted lookup when the trader already has a shop name or number. Trust ladder unchanged — no auto-connect. Invite link only when a **phone-like** query finds nobody.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Cold-start Chats was Explore-only. Name/phone/GST lookup matches how traders identify counterparties. Invite is for “this number is not on Ekum,” not a name typo. |
| UX Designer | One **Find on Ekum** field under Connections. Results show business name + city. **Request access** / **Message**; connected → pick. Keep **Find in Explore**. |
| Solution Architect | Reuse `GET /search?type=company`. Client phone-like helper for empty CTA. No new directory API. |

---

## Platform consistency (required)

1. **Existing patterns?** ConnectionPicker rows; kit input; Request access / Message as on company profile.  
2. **Duplicates?** Explore search stays for browsing. This is lookup in a picker.  
3. **Reuse?** Search API, access-requests, `POST /threads/direct`, `/referrals/new`.  
4. **Naming?** **Find on Ekum** — not Team invite, not WhatsApp “add contact.”

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Search + request / message / pick |
| Business rules | OK | No auto-connect; no login phone on cards |
| Workflows | OK | Chats, broadcast, buyer groups via picker |
| Edge cases | OK | Phone-like empty → invite; name empty → no match |
| Permissions | OK | Chats cap still gates start-chat |
| User states | OK | Connected / pending / stranger |
| Notifications | N/A | Existing access-request notify |
| Error handling | OK | Inline / toast via existing API errors |
| Scalability | OK | Existing search + debounce |
| Mobile interactions | OK | Sheet body; no extra sticky chrome |
| Accessibility | OK | Labeled input; buttons |
| Platform consistency | OK | |

---

## Approved scope for this slice

- `FindOnEkumBlock` in ConnectionPicker (embedded + sheet).
- Chats: Request access / Message; connected → existing start-chat path.
- Broadcast + buyer groups: connected → Add/Select; stranger → Request access.
- Docs + unit tests.

## Explicitly deferred

- CatalogShareSheet phone/name find.
- Dedicated `GET /companies/by-phone` / opt-in discoverability.
- Request access on Followers list rows.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
