# Feature Completeness Review — They see mine: Asked inline + chip

**Date:** 2026-09-28  
**Module / ask:** Do not tap through to a separate Asked screen. Asks sit on **They see mine**, newest first. Optional **All / Asked** chips (kit FilterRail).  
**Anchors:** `docs/features/access-and-connections.md`  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One job: who sees you, plus who just asked. A second page is extra. Newest ask first. Home Needs still deep-links `?tab=asked` — that is the Asked chip, not a new screen. |
| UX Designer | ListSearchRow, then chips only when there is at least one ask (All + Asked · N). Default All: asks on top, then seeing/stopped. Asked chip: only pending. Same Allow / Decline cards. No Asked · N chevron row. |
| Solution Architect | No API change. Sort asks by `createdAt` desc client-side. `followersInboxTabFromSearch` stays for Home. |

---

## Platform consistency (required)

1. **Existing patterns?** FilterRail + Chip (Chats). ListSearchRow.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Allow / Decline on the same cards.  
4. **Naming matches the app?** **Asked**, **All**. Not Follow requests.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Inline asks; chip filter |
| Business rules | OK | Unchanged decide |
| Workflows | OK | Home `?tab=asked` = Asked chip |
| Edge cases | OK | No asks → no chips; empty Asked chip copy |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | OK | |
| Mobile interactions | OK | pb-36; chips not a second chrome job |
| Accessibility | OK | Chip buttons labelled |
| Platform consistency | OK | |

---

## Approved scope for this slice

- One **They see mine** page. Asks at top, newest first, then allowed/stopped.
- Chips **All** | **Asked · N** only when asks exist.
- `?tab=asked` selects Asked chip (Home Needs). No separate Asked header.
- Search filters asks and the rest.
- Docs + unit + functional journey.

## Explicitly deferred / rejected

- Peer tabs as page titles.
- Search-only Asked void.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
