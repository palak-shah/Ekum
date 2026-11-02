# Feature Completeness Review — Chat placed-by Decline chip

**Date:** 2026-11-02  
**Module / ask:** Buyer **Decline** on a seller-logged order card sits on **Order placed by {shop}.** It currently reads as a muted word in the sentence. Restyle it as a kit Chip so it looks tappable. Keep it on that line — not a second footer button.  
**Anchors:** `docs/features/chat.md`, Completeness `2026-10-30-chat-thread-placed-by-completeness.md`  
**Disposition:** Redesign (quiet-text lock only) → Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Placement stays: buyer Decline on the placed-by sentence. Footer stays **View order →**. Logger still has no Decline. |
| UX Designer | Quiet inline text does not look like a tap. Kit Chip (32px gray foam) is the compact tappable control. 48px Button is too loud on a 13px line. |
| Solution Architect | Same `placedByDecline` + `POST /orders/:id/cancel`. Wrap Chip in `data-card-action` so the card open does not fire. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit `Chip` (Chats / Orders filter chips). Living card footer unchanged.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — existing decline confirm / cancel.  
4. **Naming matches the app?** Decline. Never Seller/Buyer.  
5. **Units?** N/A.

**Philosophy conflict?** No — same job, clearer tap. Prior “quiet text, not a new chip” is the lock this slice redesigns.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same Decline onClick |
| Business rules | OK | Buyer only; gone after decline |
| Workflows | OK | Placement unchanged |
| Edge cases | OK | Long shop name wraps; chip shrink-0 |
| Permissions | OK | Logger: sentence, no chip |
| User states | OK | Requested or confirmed, as today |
| Notifications | N/A | |
| Error handling | OK | Existing toast |
| Scalability | OK | |
| Mobile interactions | OK | 32px chip; `data-card-action` |
| First glance (BM-11) | OK | Sentence quiet; Decline is the tap |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Chip is a button with label Decline |
| Platform consistency | OK | Kit Chip, not a one-off pill |

---

## Gaps

### G-001 — Decline reads as sentence text

| Field | Content |
|-------|---------|
| Gap | `text-muted` inline **Decline** after the shop name does not look like an action. |
| Why it matters | Buyers miss the tap or think it is copy. |
| Impact if ignored | Screenshot: “Decline doesn’t look like a button.” |
| Recommendation | Kit Chip on the placed-by row. Footer still View order only. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Placed-by row: muted sentence + kit Chip **Decline**.  
- Footer **View order →** only (quotes keep Accept + secondary Decline).  
- `data-card-action` on the chip wrap. Same cancel flow.

## Explicitly deferred / rejected

- Moving Decline into the footer (already rejected 2026-10-30).  
- 48px kit Button on the line.  
- Solid danger Decline.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
