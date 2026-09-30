# Feature Completeness Review — Selection floater only on pick surfaces

**Date:** 2026-09-30  
**Module / ask:** “N in selection · Order” is distracting on Home / Chats / Orders / Settings. Show only where people pick.  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/company.md`, ui-quality-bar  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | The chip is a *while picking* reminder, not a global cart. Pile stays; open `/selection` from Explore / shop / pack select. |
| UX Designer | Allow-list: Explore feed; other shop when shop dock is down; design/pack only while Selecting. Hide on Home, Chats, Orders, You, Settings, Network, own shop. |
| Solution Architect | Flip `shouldShowSelectionWorkspaceBar` from deny-list to allow-list. Publish pack/design `pageSelecting`. Own shop via existing `companyId`. |

---

## Platform consistency (required)

1. **Existing patterns?** Same floater; hide when another dock owns the band.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Same `/selection` + Order.  
4. **Naming?** Unchanged.

**Philosophy conflict?** No — fewer chrome, one job per screen.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Allow-list |
| Business rules | OK | Pile unchanged when hidden |
| Workflows | OK | Explore / shop / pack Selecting |
| Edge cases | OK | Own shop never; shop dock hides chip |
| Permissions | N/A | |
| User states | OK | Count 0 still hides |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Drop leftover bottom padding where chip is gone (BM-07) |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Floater only on `/explore`; `/company/:id` when not own and shop dock is down; `/collections/:id` and design pages while **Selecting**.
- Hide everywhere else (Home, Chats, Orders list, You, Settings, Network, `/selection`).
- Docs + units + e2e that asserted Chats / Orders list.

## Explicitly deferred / rejected

- `/search` (no select). Design page without a Select mode stays dock-only.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
