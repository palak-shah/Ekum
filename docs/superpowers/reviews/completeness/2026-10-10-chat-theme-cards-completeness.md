# Feature Completeness Review — Chat theme + trade cards (Slice 2)

**Date:** 2026-10-10  
**Module / ask:** Chat thread wallpaper from theme tokens; outgoing/incoming bubbles; trade cards header → images → optional note → action links  
**Anchors:** `docs/features/chat.md`, `docs/features/00-concepts.md`, theme tokens Slice 1  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Chat feels like WhatsApp: warm thread wallpaper, light-green yours / white theirs, cards with a clear story then thumbs then optional note then View order. No wallpaper picker. |
| UX Designer | Cards stop using solid teal fills. Section order is fixed (header first). Empty note omits that band. Action link matches prototype quiet accent link. |
| Solution Architect | Reuse `--ekum-chat-*` / `--ekum-accent` only. Reshape `ChatTradeCardView`; ThreadPage text/payment/fallback shells; no second palette. |

---

## Platform consistency (required)

1. **Existing patterns?** WhatsApp judgment already in chat.md; kit accent for send/actions.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same trade-card builders; layout only.  
4. **Naming matches the app?** View order → / View collection → — unchanged.

**Philosophy conflict?** No — removes louder solid-teal outgoing cards that fought the new theme.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Visual + layout |
| Business rules | OK | No wallpaper preference |
| Workflows | OK | Thread open unchanged |
| Edge cases | OK | Empty note; pulse compact; payment parity |
| Permissions | N/A | |
| User states | OK | Light/dark via theme |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | |
| Mobile interactions | OK | Composer clearance unchanged |
| First glance (BM-11) | OK | Wallpaper quiet; card sections readable |
| Accessibility | OK | Ink on chat-out / chat-in |
| Platform consistency | OK | |

---

## Gaps

None Required. Payment card folded into same surface grammar (custom shell aligned).

---

## Approved scope for this slice

- Thread list area `bg-chat`; text bubbles `chat-out` / `chat-in`.
- Trade cards: surface/chat-in both directions; sections Header → Images → optional note → actions.
- Payment + fallback shells aligned; pulse without solid accent fill.
- Update `chat.md` + unit specs + gap matrix.

## Explicitly deferred / rejected

- User wallpaper picker — Rejected.
- Redesigning pulse into full rich card — Deferred (compact stays).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (unit + trader-eye; existing `@chat` journeys still apply)
