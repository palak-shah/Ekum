# Feature Completeness Review — No avatar on 1:1

**Date:** 2026-10-31  
**Module / ask:** Incoming 1:1 avatars (SS initials) are extra — bubble color already says who. Keep group cluster-tail avatars.  
**Anchors:** `docs/features/chat.md`, Completeness `2026-10-31-chat-sender-avatar-reply-who-completeness.md`  
**Disposition:** Proceed (chrome)

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | 1:1 is two parties. Wash is enough. Groups need an avatar on the last of a streak. |
| UX Designer | Drop the 28px column on direct threads so bubbles sit full width. Groups: spacer + tail avatar. No shop name on incoming. |
| Solution Architect | Gate `reserveIncomingSenderThumb` / `showGroupSenderThumb` on `isGroup`. |

---

## Platform consistency (required)

1. **Existing patterns?** WhatsApp 1:1 has no bubble avatars; groups do.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same thread.  
4. **Naming matches the app?** You / shop on replies only.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Reply who unchanged |
| Business rules | N/A | |
| Workflows | N/A | |
| Edge cases | OK | System notices still no column |
| Permissions | N/A | |
| User states | OK | Direct vs group |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | 1:1 more width for the bubble |
| First glance (BM-11) | OK | No SS on Surat 1:1 |
| Units | N/A | |
| Accessibility | OK | Group avatar still has name |
| Platform consistency | OK | Incoming name still off |

---

## Gaps

None required.

---

## Approved scope for this slice

- 1:1: no incoming avatar column.
- Groups: incoming column; Avatar only on `clusterTail`.
- Docs lock. Units + trader-eye 1:1.

## Explicitly deferred / rejected

- Putting avatars on 1:1 — **rejected**.
- Incoming shop name on bubbles — still off.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + trader-eye)
