# Feature Completeness Review — Chat jump to latest

**Date:** 2026-09-29  
**Module / ask:** Thread: WhatsApp-style small down arrow to the latest messages  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `ui-quality-bar` (chat chrome follows WhatsApp judgment)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders scroll up for old cards and need one tap back to newest + composer. Same job WhatsApp already solved. Not a new IA surface. |
| UX Designer | One small 40×40 circle, down chevron, right above the composer. No second path (no “Latest” text chip). Hide when already at the end. |
| Solution Architect | Reuse `isNearBottom` / `scrollListToBottom` / stick latch. Button is local list chrome, not a route. |

---

## Platform consistency (required)

1. **Existing patterns?** WhatsApp thread chrome (already the default). Kit 40×40 square, surface + border, quiet ink chevron — not a teal FAB.  
2. **Duplicates another feature?** No. Unread divider is open-land; this is return-to-end while reading older.  
3. **Should reuse an existing workflow?** Reuse stick-to-bottom scroll helpers.  
4. **Naming matches the app?** `aria-label` **Latest messages**. No Seller/Buyer.

**Philosophy check:** Fits “fewer taps, never get lost.” No conflict.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Show when scrolled up; tap pins and scrolls to newest |
| Business rules | N/A | Display only |
| Workflows | OK | Independent of send / unread-open |
| Edge cases | OK | Hidden at end, empty list, select/forward; show after unread-land mid-thread |
| Permissions | N/A | |
| User states | OK | Same on 1:1 and group |
| Notifications | Later | WhatsApp unread badge on the arrow — not this slice |
| Error handling | N/A | |
| Scalability | OK | Scroll listener already exists |
| Mobile interactions | OK | Floats over list above composer; hidden at bottom so last bubble is not clipped (BM-07) |
| Accessibility | OK | Button + Latest messages |
| Platform consistency | OK | WhatsApp down arrow, kit 40×40 |

---

## Gaps

None Required. Unread count on the arrow is **Future**.

---

## Approved scope for this slice

- Small down-arrow control when the timeline is not near the end
- Tap → stick + scroll to latest
- Hide at end, empty thread, and while selecting messages

## Explicitly deferred / rejected

- Badge of new messages while scrolled up (WhatsApp extra)
- Jump to first unread (already the open-thread divider)

## Sign-off

Required gaps closed or deferred in writing: **Yes**  
Ready for implementation / `@functional` journeys: **Yes**
