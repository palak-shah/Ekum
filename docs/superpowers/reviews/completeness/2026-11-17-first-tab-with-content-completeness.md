# Feature Completeness Review — First tab with content

**Date:** 2026-11-17  
**Module / ask:** When there is **no explicit navigation intent**, land on the **first tab/chip with content**. When **everything is empty**, keep the **established default** (Collections / Selling / Pending / All). Explicit intent = deep links, chip/tab taps that write URL or session (ticket Back on Buying/Others, `?inbox=`, `?filter=` / `?status=`, `?kind=sample|complaint`).  
**Anchors:** `docs/features/company.md`, `docs/features/orders.md`, `docs/features/chat.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Empty-first landings waste taps for traders who only buy, only have Designs, or only have Requests. Same rule on three list surfaces. Deep links and in-session chip/tab choices stay. |
| UX Designer | Keep existing tab/chip chrome. Seed once when data is ready. Order is the rail order (Collections→Designs; Selling→Buying→Others; Pending→Completed; All→Unread→Groups→Requests). No new UI. |
| Solution Architect | Pure helpers + one seed effect per page. Explicit URL/session locks. Orders: platform-default Selling lands use first-with-content; session Buying/Others with rows kept (ticket Back); stale empty remembered tab falls through. |

---

## Platform consistency (required)

1. **Existing patterns?** Same tabs/chips; kit FilterRail unchanged.  
2. **Duplicates another feature?** No — default selection only.  
3. **Should reuse an existing workflow?** Reuse shelf / trade / inbox counts already on screen.  
4. **Naming matches the app?** Unchanged labels.  
5. **Units?** N/A.

**Philosophy conflict?** No — fewer empty screens, one job per land.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Seed first non-empty in rail order |
| Business rules | OK | Deep links + kind=sample/complaint lock Others |
| Workflows | OK | Session Buying kept when it has rows |
| Edge cases | OK | All empty → keep platform default; Chats All empty + Requests → Requests |
| Permissions | N/A | |
| User states | OK | Own Home + visitor shop |
| Notifications | N/A | |
| Error handling | OK | No seed until success/fetched |
| Scalability | N/A | |
| Mobile interactions | OK | No chrome height change (BM-07 N/A) |
| First glance (BM-11) | OK | Land on content, not empty copy |
| Units | N/A | |
| Accessibility | OK | Same tabs; aria-selected follows state |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- **Rule:** no explicit intent → first tab with content; all empty → established default.  
- Company catalogue: after both shelves load, Collections → Designs; empty → Collections.  
- Orders: no direction intent (default Selling) → Selling → Buying → Others; Buying/Others session with rows kept; status with no `?filter=`/`?status=` → Pending → Completed; empty → Pending.  
- Chats: `/chats` without `inbox=` → All → Unread → Groups → Requests; empty → All; `?inbox=` locks.  
- Unit tests for helpers; feature doc lines; gap matrix.

## Explicitly deferred / rejected

- Do not auto-prefer Unread over All when All has threads.  
- Do not rewrite remembered Chats chip when URL already has `inbox=`.
