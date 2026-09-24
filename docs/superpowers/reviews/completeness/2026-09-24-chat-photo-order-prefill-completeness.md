# Feature Completeness Review — chat Photo order supplier prefill

**Date:** 2026-09-24  
**Module / ask:** From a 1:1 thread, Photo order should keep that shop selected and still let them change it.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Chat ＋ Photo order already deep-links `?seller=`. Hiding the picker locked the shop. Prefill + change matches “fewer taps, never get lost.” Standard catalog `?seller=` stays locked (that shop owns the designs). |
| UX Designer | Same `ConnectionPicker` as Orders ＋. Selected row is tappable (Change). Chat prefill alone is not leave-dirty. |
| Solution Architect | URL still sets `sellerId`. If the shop is missing from Connections, inject a stub from `GET /companies/:id` so the name shows. Submit still requires a seller they can order from. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — `ConnectionPicker` + existing `?seller=` query.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — Photo order builder.  
4. **Naming matches the app?** Supplier (existing label).  

**Philosophy conflict?** No

---

## Checklist scan

Mark each: OK · Gap · N/A · Later

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Prefill from thread counterpart; picker stays. |
| Business rules | OK | Photo still needs a supplier; catalog-from-URL stays locked. |
| Workflows | OK | Chat ＋ → Photo order → selected shop. |
| Edge cases | OK | Not in Connections → stub row; group / no counterpart → `/orders/new` with empty picker. |
| Permissions | OK | Buying + orders permission already gates the attach row. |
| User states | OK | Prefill is not dirty; photos/note/changed shop are. |
| Notifications | N/A | |
| Error handling | OK | Existing send errors. |
| Scalability | N/A | |
| Mobile interactions | OK | No new sticky chrome (BM-07 N/A). |
| Accessibility | OK | Selected row is a button; sheet title Choose supplier. |
| Platform consistency | OK | |

---

## Gaps

None required.

---

## Approved scope for this slice

- Photo order always shows Supplier picker; `?seller=` prefills and stays editable.
- Leave-dirty ignores the chat prefill until they change shop or add content.
- Stub connection when the prefilled shop is not in the connections list.
- Docs + unit + `@functional` chat journey.

## Explicitly deferred / rejected

- Unlocking supplier on **standard** catalog builder when `?seller=` (designs belong to that shop).
- Photo order from group chats (no single counterpart).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
