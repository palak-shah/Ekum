# Feature Completeness Review — Chat @mentions

**Date:** 2026-09-23  
**Module / ask:** `@` in the composer should mention someone in chat.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/chat.md`, `2026-09-01-chat-membership-completeness.md` (deferred @mentions)  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders ping a **shop** or **their own teammate on this chat**. That is the job: “Ravi, see this rate” / “Surat Silk, confirm pcs.” Other shops’ staff lists stay hidden. `@everyone` is out. Mention still pings if they muted. |
| UX Designer | Type `@` → compact list **above the composer** (same floating chrome as mute pick). Not a sheet. Filter as they type. Tap inserts `@Name `. Highlight `@Name` in the bubble. Enter picks when the list is open. |
| Solution Architect | `metadata.mentions` on send (`user` \| `company`). Server keeps only ids on this thread. Extra notify user ids (including muted, including our shop’s teammate). No new table. No other-shop roster leak. |

---

## Platform consistency (required)

1. **Existing patterns?** Composer typeahead, floating 14px menu (mute flyout), Team on chat `people`, participant **business names**.  
2. **Duplicates another feature?** Reply is “this message”; mention is “this person/shop.” Not the same.  
3. **Should reuse?** `people` + `participants`; `announce(..., extraUserIds)`; muted-until still used for normal pings.  
4. **Naming?** **Mention** is fine in code. UI shows names only — no Seller/Buyer, no staff names of the other shop.

**Philosophy conflict?** No — counterparties still do not get a staff roster. A typed `@Ravi` in the body is the sender’s words (same as typing the name). System attribution to the other shop stays **business name**.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | `@` pick → insert → send → ping + highlight |
| Business rules | OK | Own teammates on thread + other shops; no @all; mention beats mute |
| Workflows | OK | Composer only; text messages this slice |
| Edge cases | OK | Email `a@b` does not open; stale picks dropped; 1:1 still lists the other shop (mute override) |
| Permissions | OK | Must already be on the chat |
| User states | OK | Empty pick (solo, no other shop) → list hidden |
| Notifications | OK | Extra user ids; same Message type |
| Error handling | OK | Invalid mention ids stripped; send still works |
| Scalability | OK | Max 8 mentions; no WS |
| Mobile interactions | OK | List sits in the composer stack; BM-07 unchanged |
| Accessibility | OK | listbox + aria-expanded; arrows / Enter / Esc |
| Platform consistency | OK | Not a sheet; not other-shop people |

---

## Gaps

None Required.

### G-001 — Other shops’ people

| Field | Content |
|-------|---------|
| Gap | Cannot @ a named person at the other shop |
| Why it matters | We never send their roster |
| Impact if ignored | — |
| Recommendation | Mention the **shop**; they ping their people on the chat |
| Priority | Future improvement |

---

## Approved scope for this slice

- Composer `@` (start of word) opens a compact pick: **your shop’s people on this chat** (not you) + **other businesses** on this chat.  
- Filter by the letters after `@`. Tap / Enter inserts `@Name `.  
- Send `metadata.mentions`. Server keeps valid thread ids only.  
- Mentioned users get a message ping **even if muted**, including a teammate on our shop.  
- Bubble highlights `@Name`.  
- Text messages only.

## Explicitly deferred / rejected

- Other shops’ staff in the picker  
- `@everyone` / mention our whole shop as one row  
- Mentions on photo / voice / cards  
- Rewriting mentions on Edit  
- Distinct “mentioned you” notification type  
- Calls / Favourites / Lock (still rejected)

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
