# Feature Completeness Review — WhatsApp chat open + locked card previews

**Date:** 2026-09-03  
**Module / ask:** Open threads like WhatsApp (unread divider + first unread / else newest). Locked catalog chat cards show small blurred thumbs; no PhotoViewer; collection open still gated.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `docs/superpowers/specs/2026-09-03-whatsapp-chat-open-and-locked-card-previews-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Matches WhatsApp habits traders already know; does not weaken trust ladder on open.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Unread open + divider is table stakes. Blurred teaser on the card preserves “something was shared” without giving away the pack. |
| UX Designer | Quiet “N unread messages” line; existing thumb size; blur + dead tap on thumbs; card body still opens Ask shell. No new chrome rows. |
| Solution Architect | Client snapshot before mark-read; `imagesLocked` on refs; collection detail still masks clear images. No new history API. |

---

## Platform consistency (required)

1. **Existing patterns?** Chat list unread badge, mark-read on open, PhotoAlbum thumbs, Ask on gated collection — reuse.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — access Ask / view-on-open.  
4. **Naming matches the app?** “N unread messages” (WhatsApp plain English).

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Open rule + locked thumbs |
| Business rules | OK | Unread = other-party after lastReadAt |
| Workflows | OK | Mark-read + snapshot |
| Edge cases | OK | Deep link wins; unread not in page → bottom |
| Permissions | OK | Blur ≠ view rights |
| User states | OK | Snapshot per thread visit |
| Notifications | N/A | Badge clear via existing mark-read |
| Error handling | OK | Fallback bottom |
| Scalability | OK | No new API |
| Mobile interactions | OK | Composer sticky unchanged; BM-07 N/A for list scroll |
| Accessibility | OK | Divider text; locked thumbs not focusable as open |
| Platform consistency | OK | Kit-quiet divider |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Client open snapshot + first-unread scroll + “N unread messages” divider  
- `imagesLocked` on catalog message refs; restore preview images when gated  
- PhotoAlbum `locked` blur, no viewer  
- Docs: `chat.md`; keep collection open image mask  

## Explicitly deferred / rejected

- Jump-to-unread floating chip  
- Mark-read only after scroll past unread  
- Explore feed blur  
- Server `firstUnreadMessageId`  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + manual; no new e2e required this slice)
