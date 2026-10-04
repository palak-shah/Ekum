# Feature Completeness Review — You select hide nav

**Date:** 2026-10-04  
**Module / ask:** On You library select, hide bottom nav so the select dock owns the bottom (same as pack manage / Selection).  
**Anchors:** `docs/features/catalog.md`, `docs/features/collections.md`, `ui-quality-bar` §2b  
**Disposition:** Proceed

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Select is a focused job; Home/Chats/＋ must not compete with Order · Share · Hide. |
| UX Designer | Match album / Selection: nav away, dock on the safe-area bottom. |
| Solution Architect | Reuse `usePageOwnsBottomBand` + `shouldHideAppNav` — no new store. |

## Platform consistency (required)

1. **Existing patterns?** Yes — CollectionViewer / Selection / BottomTradeDock.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — pageOwnsBottomBand.  
4. **Naming matches the app?** N/A (chrome only).

**Philosophy conflict?** No.

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Selecting on You hides nav; exit select restores |
| Business rules | OK | Same verbs as today |
| Workflows | OK | Long-press → select dock |
| Edge cases | OK | Cancel / exit clears band |
| Permissions | N/A | |
| User states | OK | Buyer Saved path unchanged |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile / chrome | OK | Dock `bottom-0` + safe-area; content padding clears dock |
| Accessibility | OK | Nav not focusable while hidden |

## Disposition rationale

Completes already-shipped You select dock; aligns with pack select “nav hidden”.
