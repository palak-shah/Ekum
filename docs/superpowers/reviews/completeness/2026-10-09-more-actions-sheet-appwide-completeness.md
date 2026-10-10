# Feature Completeness Review — App-wide ⋯ MoreActionsSheet

**Date:** 2026-10-09  
**Module / ask:** One chrome language for ⋯ / account action menus: bottom sheet, small icon then text — not floating popovers on some pages and sheets on others.  
**Anchors:** `docs/features/collections.md`, `docs/features/chat.md`, `docs/features/company.md`, `docs/features/settings.md`, ui-quality-bar  
**Disposition:** Proceed (Redesign of prior “floating ⋯” chat rule)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Mixed ⋯ chrome teaches traders the wrong model. Client prototype sheet is the new default. |
| UX Designer | Kit `Sheet`; icon (20) + semibold label; danger last. Mute duration = in-sheet step (Back), not a sibling flyout. |
| Solution Architect | Shared `MoreActionsSheet` in `ui/`. Migrate header/row action ⋯. Keep filter menus and attach pickers as local popovers (different job). |

## Platform consistency

1. Matches owner collection more sheet.  
2. Replaces floating ⋯ (chat docs previously required float).  
3. Reuse kit Sheet.  
4. Plain trader labels unchanged.

**Philosophy conflict?** Prior chat rule “⋯ is floating, not a sheet” — **update docs** to sheet. Judgment (everyday first, rare last) stays.

## Approved scope

- Add `MoreActionsSheet` (+ row helper).
- Migrate: collection viewer (visitor), collection editor, product editor, company overflow, order detail ⋯, chats inbox ⋯, thread ⋯, inbox row long-press, Home account menu.
- Mute: sheet step with 8 hours / 1 week / Always.
- Update chat / company / concepts notes that said floating ⋯.

## Explicitly deferred

- Explore / Orders / You **filter** menus (status chips).
- Attach type pickers (NoteAttach, LegPhoto, complaint attach).
- Timeline “more” overflow that isn’t the page ⋯.

## Sign-off

Ready for implementation / units on MoreActionsSheet + migrated menu testids.  
