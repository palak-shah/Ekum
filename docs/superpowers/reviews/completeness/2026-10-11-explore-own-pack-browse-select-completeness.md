# Feature Completeness Review — Explore own pack browse select

**Date:** 2026-10-11  
**Module / ask:** Own collection opened from Explore / chat / Saved (no `packManage`): Select uses visitor trade chrome — Add to cart · Message (gray) · Share · **Order for buyer**; design sheet ⋯ Edit design · Remove from this collection. You / ＋ / own shop (`packManage`) keeps manage select + bulk dock.  
**Anchors:** `docs/features/collections.md`, `docs/features/orders.md`, Completeness 2026-10-11-own-pack-manage-entry  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Explore own pack is browse/trade (shortlist + SelectionWorkspaceBar). Manage membership stays You/＋. Own-shop Order is **Order for buyer** (matches You published). |
| UX Designer | Same four-slot bar as visitor; Message muted not hidden; Order label changes for own shop. Design Edit moves to ⋯; Remove last (danger). |
| Solution Architect | `browseOwn = isOwner && !packManage` → shortlist; mute/label via `singleShopId === me` (not company-path `ownShop`). How many already `buyer-only` for own catalog. |

---

## Platform consistency (required)

1. **Existing patterns?** SelectionWorkspaceBar; `packManage` entry gate; MoreActionsSheet; You **Order for buyer**.  
2. **Duplicates another feature?** No — entry-aware select path only.  
3. **Should reuse an existing workflow?** Shortlist + openOrder; How many buyer-only.  
4. **Naming matches the app?** Order for buyer; Remove from this collection; Message grayed.

**Philosophy conflict?** No — one job per entry; Explore browse vs You manage.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Browse shortlist; manage select unchanged |
| Business rules | OK | Message mute + Order for buyer when pile shop is me |
| Workflows | OK | Explore → select → Order for buyer → How many |
| Edge cases | OK | Curated mill in own pack: ⋯ Remove without Edit |
| Permissions | OK | Owner only for ⋯ |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | Remove toast / ApiError |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 clearance when workspace bar up |
| First glance (BM-11) | OK | No manage dock on Explore; Order for buyer readable |
| Accessibility | OK | Message disabled; ⋯ aria |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Browse own (`!packManage`): shortlist + SelectionWorkspaceBar.
- Own-shop pile: Message disabled; Order CTA **Order for buyer**.
- Design sheet ⋯: Edit design (when editable) · Remove from this collection; drop footer Edit primary.
- Docs + units + trader-eye.

## Explicitly deferred / rejected

- Changing You/＋ bulk dock.
- Changing `orderWhoMode` / How many buyer-only.
- Delete on design ⋯ (stays manage bulk).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
