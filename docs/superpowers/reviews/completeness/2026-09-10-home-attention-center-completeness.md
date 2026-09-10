# Feature Completeness Review — Home attention-center composition

**Date:** 2026-09-10  
**Module / ask:** Home-only visual composition: greeting → attention count → compact existing metrics → need rows as the hero. Selection floater unchanged.  
**Anchors:** `docs/features/home.md`, `docs/features/00-concepts.md`, `ui-quality-bar`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. Home stays an attention surface, not a stats dashboard.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Same needs (`buildHomeNeeds`) and same metric chips (`homeMetrics`: orders / requests / returns). No new jobs. Empty Home keeps approved copy (no false “caught up” on cold start). |
| UX Designer | List of compact need rows is the hero. Metrics are short cards, subordinate. Greeting + live “N items need attention.” Selection stays the AppShell chip. |
| Solution Architect | Presentation on `HomePage.tsx` only. Same queries, testids, mark-seen, destinations. |

---

## Platform consistency (required)

1. **Existing patterns?** Yes — bordered compact rows, pale-teal icon wells, ChevronRight, kit cards.  
2. **Duplicates another feature?** No — bell stays notifications.  
3. **Should reuse an existing workflow?** Yes — tap need → existing `to`.  
4. **Naming matches the app?** Yes — existing `needTitle` / subtitles.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same data and links |
| Business rules | N/A | |
| Workflows | OK | |
| Edge cases | OK | Cold start vs quiet vs needs |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | Bell unchanged |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | AppShell `pb-28` + selection chip; no new sticky (BM-07) |
| Accessibility | OK | testids + links |
| Platform consistency | OK | |

---

## Approved scope

- Home composition only.  
- Compact metric cards from existing `homeMetrics` (nonzero only).  
- Need rows: existing title, subtitle, icon by kind, chevron.  
- Quiet empty: approved Home copy (Explore / nothing-needs-you language).  
- Do not change Chats, Orders, Explore, Selection, APIs.

## Explicitly deferred / rejected

- Invented KPIs, charts, decorative fill  
- “You're all caught up” as a cold-start claim (conflicts with `home.md`)  
- Palette / nav / typography-system change

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes
