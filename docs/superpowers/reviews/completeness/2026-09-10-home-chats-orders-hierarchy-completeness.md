# Feature Completeness Review — Home / Chats / Orders visual hierarchy

**Date:** 2026-09-10  
**Module / ask:** Presentation-only hierarchy pass on Home, Chats, and Orders. Content type is the visual hero (action / business object / order facts). Preserve crisp tokens and ivory–white–charcoal–teal. Do not fill empty space or add widgets.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/home.md`, `docs/features/chat.md`, `docs/features/orders.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. This slice changes typography, grouping, and list surfaces only.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Home still surfaces the same needs and metric links. Chats still list the same threads. Orders keep Needs you / In progress / Completed, All·Buy·Sell, search, filter, add. No new jobs. |
| UX Designer | Home: demote KPI tiles; make the first attention item editorial. Chats: company + object label over avatar/divider rhythm. Orders: flatten identical cards into a list with stronger company / # / status rank. Whitespace stays. |
| Solution Architect | No API, routing, or attention-rule changes. Presentation helpers only (`homeNeedVisual`, inbox object label). Existing `data-testid` on home needs stays. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — ListSearchRow, FilterRail, StatusPill, hairline list (Chats already). Home hero is type-led, not a new card kit.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — same links and filters.  
4. **Naming matches the app?** Yes — same trader copy; Home action lines stay in existing `needTitle` language, split for display only.

**Philosophy check?** No — Explore remains the photo hero; these screens use their own content, not dashboard chrome.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same destinations and filters |
| Business rules | N/A | No lifecycle change |
| Workflows | OK | Same entry → list → detail |
| Edge cases | OK | Quiet Home (no needs) unchanged; text-only chats hide object label |
| Permissions | N/A | |
| User states | OK | Busy / quiet / empty Home; empty Chats / Orders |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky bars (BM-07 unchanged) |
| Accessibility | OK | Links and testids preserved; hierarchy via type, not color alone |
| Platform consistency | OK | Fewer identical rounded cards |

---

## Gaps

None required.

---

## Approved scope for this slice

- Home: quieter greeting; metrics as a quiet line; first need as typographic hero; remaining needs as a compact list.  
- Chats: stronger company + business-object label; keep rows, not cards.  
- Orders: hairline rows; company / order id / status hierarchy.  
- Units for presentation helpers. Existing `@functional` home need testids remain.

## Explicitly deferred / rejected

- Charts, fake activity, extra dashboard cards  
- Palette / crisp-token revert  
- Order lifecycle, chat, inquiry, quote, or selection behaviour  
- Copying Explore’s photo layout onto Home

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (existing journeys; no new product path)
