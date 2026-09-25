# Feature Completeness Review — QA ten bug fixes

**Date:** 2026-09-25  
**Module / ask:** Batch of 10 QA findings (orders chrome/copy, You library, pack grammar + origin dock, kit/routing/nav). Who stays on the create page.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/collections.md`, `docs/features/catalog.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Copy and chrome only. Mill names stay on the trader Trading row; buyers never see mills on the list. Origin packs get the same Ask/Order dock as curated visitors. Who stays a page chevron. |
| UX Designer | Match kit: one Close on sheets, Chats tab named Chats, date-only on your library, `1 design` grammar. BM-07 last Orders row must clear the nav. No new chrome patterns. |
| Solution Architect | Gate mill cue with `isTradingDeskOrder`. Dock uses visitor + live + products, not curated-only. `/collections/new` is a named route before `:id`. |

---

## Platform consistency (required)

1. **Existing patterns?** Orders list, pack dock, kit Sheet, You tiles, create Who chevron.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same Ask/Order qty sheet; same Who expandable.  
4. **Naming matches the app?** Drop `standard`; unread badge is not “N Chats”.

**Philosophy conflict?** No

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Nine code fixes; Who unchanged |
| Business rules | OK | Soft-hide mills for non-desk list rows |
| Workflows | OK | Create & Publish still expands page Who |
| Edge cases | OK | Origin vs curated handle copy (sr 16) |
| Permissions | OK | Dock off for owner |
| User states | OK | Draft pack: no visitor dock |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 last Orders row; pack dock clearance already |
| Accessibility | OK | Sheet Dismiss vs Close; Chats aria-label |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Orders list: no vertical overflow clip; mill names only on Trading desk rows.
- Order detail: drop `kind`/`standard`; drop desk `?` help (Your paths keep `?`).
- You library + collection editor status: date only (sr 23/34/36). Separate stuck name labels with ` · `. Saved unchanged.
- `1 design` grammar on Explore/viewer cards.
- Pack Ask/Order dock for any published visitor pack; handle copy still curated + ticket me.
- Sheet backdrop `Dismiss`; X stays `Close`.
- Redirect `/collections/new` → `/catalog/collections/new`.
- Chats nav accessible name is Chats.

## Explicitly deferred / rejected

- **Rejected:** Move Who to a Publish sheet. Keep page chevron.
- Home (sr 4–5) and Saved own-name (sr 18, 20).
- Follow-only vs Request access.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
