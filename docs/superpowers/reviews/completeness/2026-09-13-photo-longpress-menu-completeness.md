# Feature Completeness Review — Photo long-press menu

**Date:** 2026-09-13  
**Module / ask:** Long-press on chat photo opens WhatsApp-style action menu; items stay Ekum (not system Save/Share).  
**Anchors:** `docs/features/chat.md`, message actions design 2026-09-03  
**Disposition:** Proceed

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | WA muscle memory: long-press media → actions. Ekum verbs only: Reply · Forward · Star · Select · Delete (Copy when useful). |
| UX Designer | Photo long-press opens existing actions menu; tap still opens PhotoViewer; Select remains a menu item. Non-photo keeps long-press → Select. |
| Solution Architect | MessageChrome flag `longPressOpensMenu`; no API change. |

---

## Platform consistency (required)

1. **Existing patterns?** Same Reply/Forward/Star/Select/Delete menu as chevron.  
2. **Duplicates?** No — gesture entry only.  
3. **Reuse?** MessageChrome + useLongPress.  
4. **Naming?** Ekum verbs; no Seller/Buyer.

**Philosophy conflict?** No — WA gesture, Ekum items.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Forward/delete gates unchanged |
| Workflows | OK | |
| Edge cases | OK | Selecting mode still toggles select |
| Permissions | OK | |
| Mobile interactions | OK | Suppress ghost tap into viewer |
| Platform consistency | OK | |

---

## Approved scope

- Photo message: long-press → open actions menu  
- Items: existing Ekum set only (no Save to device)  
- Tap → PhotoViewer; chevron unchanged  
- Docs + unit + `@chat` e2e  

## Explicitly deferred

- Bottom-sheet redesign of all message menus  
- System share / save image  
- Long-press → menu for non-photo types  

## Sign-off

Proceed.
