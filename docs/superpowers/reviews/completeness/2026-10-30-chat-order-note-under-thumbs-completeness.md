# Feature Completeness Review — Chat living-card note, reply thumb, seen ticks, draft leave

**Date:** 2026-10-30  
**Module / ask:** Mill-lot “Part of Order” + For-order body as a note under thumbs; reply composer thumb from the design photo; blue ticks beside timestamp only when the other shop has seen; typed composer text stays a draft (no Leave confirm).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`  
**Disposition:** Redesign, then Proceed on the mapping below

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Prior locks this slice **replaces** (historical, not deleted): living-card header `details` holding parent + Place/Send body above thumbs; reply composer using `photoUrlsFromMessage` body fallback; Seen ticks on a row under the bubble; Leave guard firing on composer draft / reply.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mill lot paints two order hashes in the header (`Part of #DOWN` + `For order #HANDLE`) above the photo — traders read one confusing sentence. Relocate as the card **note** under thumbs. Do not invent a second system bubble. Do not rewrite the two shorteners in this slice. Reply to an order card must not 404 an `<img>` from the body. Blue ticks mean the other shop opened the thread. Typing then leaving is a WhatsApp **Draft**, not a discard confirm. |
| UX Designer | Header job stays title + design count. Note band already exists (quotes). Ticks sit in the time cluster, not under View order. No grey sent ticks. Leave confirm stays for attach/upload/camera/forward/select — work that cannot come back as **Draft:**. |
| Solution Architect | Split `OrderCardCopy.lines` vs `note`. `quotedComposerThumbUrl` type-guards like `inboxLastPhotoUrl`. `outgoingSeenLabel` unchanged; render ticks inside `MessageTimeMeta`. Drop `draft` / `replyTo` from `threadWipActive`. |

---

## Platform consistency (required)

1. **Existing patterns?** Living `ChatTradeCard` note band; inbox `Draft:` row; Seen `lastReadAt` gate; kit `text-tick`.  
2. **Duplicates another feature?** No second system message for mill-lot context.  
3. **Should reuse an existing workflow?** Same `chatsDrafts` + inbox **Draft:**. Same `outgoingSeenLabel`. Reply thumb from `reference.image` like Find/media.  
4. **Naming matches the app?** Keep **Part of Order #…** and the stored For-order note. Never Seller/Buyer.  
5. **Units?** N/A — no ₹ or qty string change.

**Philosophy conflict?** Yes — header stuffing of mill-lot context fights “one job per card” (photo + count first); Leave confirm on a restorable draft fights WhatsApp. Disposition is **Redesign**: update chat.md first, then build.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Note under thumbs; reply thumb from line photo; ticks beside time when Seen; draft leave |
| Business rules | OK | 1:1 Seen only; last outgoing; counterpart `lastReadAt`. Draft is device-local text |
| Workflows | OK | Leave mid-type → inbox Draft → reopen composer. Attach WIP still confirms |
| Edge cases | OK | Pulse (no thumbs) still shows `model.note`. No image → no reply `<img>`. Unseen last outgoing → time only |
| Permissions | N/A | |
| User states | OK | Empty composer + reply-only: leave without confirm; reply-to may drop |
| Notifications | N/A | |
| Error handling | OK | Broken reply src never painted |
| Scalability | OK | |
| Mobile interactions | OK | Composer sticky; BM-07 unchanged. Ticks inside time row, not extra chrome height |
| First glance (BM-11) | OK | Title + 1 design + photo loudest; mill-lot copy is the quiet note; ticks next to `1d` |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Ticks keep `aria-label="Seen"` |
| Platform consistency | OK | After chat.md update |

---

## Gaps

### G-001 — Mill-lot context in the header

| Field | Content |
|-------|---------|
| Gap | `Part of Order #DOWN` and `For order #HANDLE — mill lot` sit in header `details` above the photo, with `1 design` between them |
| Why it matters | Two hashes look like one broken sentence; the photo is not the first job |
| Impact if ignored | Traders screenshot a confusing card |
| Recommendation | Header support = count/catalog only. Parent + Place/Send body = `model.note` under thumbs (same band as quote notes). Do not add a second system bubble. Do not rewrite `#DOWN` vs `#HANDLE` |
| Priority | Required before implementation |

### G-002 — Reply composer treats order body as an image URL

| Field | Content |
|-------|---------|
| Gap | `quotedComposerThumbUrl` → `quotedPhotoUrl` → body fallback. `Order #LEUP` becomes a 404 `<img>` |
| Why it matters | Same class of bug already fixed for the inbox |
| Impact if ignored | Broken-image glyph on Reply |
| Recommendation | Photo type uses album URLs; cards use `reference.images[0] ?? reference.image`; never body text |
| Priority | Required before implementation |

### G-003 — Seen ticks under the bubble, not the time

| Field | Content |
|-------|---------|
| Gap | Ticks render in a row after the card (`mt-0.5`), so they sit below **View order**, not next to `1d` |
| Why it matters | Traders do not read them as “they saw this message” |
| Impact if ignored | Looks like extra chrome, not a receipt |
| Recommendation | Inline with last-outgoing timestamp when `outgoingSeenLabel` is Seen. No ticks otherwise. No grey ticks |
| Priority | Required before implementation |

### G-004 — Leave confirm on a restorable draft

| Field | Content |
|-------|---------|
| Gap | `threadWipActive` includes `draft.trim()` and `replyTo`, so typing then back asks **Leave the page?** even though `chatsDrafts` already saves the text |
| Why it matters | WhatsApp keeps the draft and goes; the sheet fights that |
| Impact if ignored | Extra tap every time they leave mid-sentence |
| Recommendation | Draft + reply are not leave-dirty. Attach/upload/camera/forward/select still confirm. Inbox **Draft:** unchanged |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Living order/quote card: header `details` = count/catalog/can’t-supply; parent + Place/Send body in `model.note` under thumbs (pulse: note after details).
- `quotedComposerThumbUrl`: photo / album design / `reference.image` only.
- Seen ticks beside last-outgoing time when counterpart has read; drop under-bubble row.
- Composer text + reply-to do not arm Leave confirm.

## Explicitly deferred / rejected

- Unifying mill `#DOWN` (4-char) vs `#HANDLE` (note shortener) — Later.
- Persisting `replyToMessageId` with `chatsDrafts` — Later unless a one-field add stays cheap.
- Grey sent/delivered ticks — Reject.
- Second system message for mill-lot context — Reject.
- Leave confirm for typed drafts — Reject (this Redesign).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
