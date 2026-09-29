# Feature Completeness Review — You chrome (own listing, tabs, ＋, ⋯, Edit/Share)

**Date:** 2026-09-28  
**Module / ask:** You: (1) own design/collection must read as yours, (2) Designs/Collections drop beige well, (3) library ＋ deeper, (4) ⋯ menu wider so Log out is findable, (5) Edit/Share visible without growing huge.  
**Anchors:** `docs/features/settings.md`, `docs/features/catalog.md`, ui-quality-bar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | You is the shop’s own desk. A pack/design page that looks like someone else’s shop row is wrong. Log out must be a real menu row, not a squeezed last line. |
| UX Designer | Match Chats chips for Designs/Collections (not linen track). Library ＋ same filled depth as Chats header ＋, keep 40×40 square. Edit/Share: compact h-8 accent outline pills. ⋯ panel at least 16rem, Log out danger. Own listing: **Your collection** / **Your design** on the shop row; library status **In your packs**. |
| Solution Architect | Copy + class changes. No API. |

---

## Platform consistency (required)

1. **Existing patterns?** Chip FilterRail; Chats ＋ fill+shadow; shop compact action pills.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** You ⋯ stays Network / Settings / Log out.  
4. **Naming matches the app?** Your design / Your collection / In your packs. Edit · Share stay those words.

**Philosophy conflict?** No. Quiet Edit/Share line was too quiet; compact pills still not page CTAs.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | |
| Workflows | OK | |
| Edge cases | OK | Visitor collection still CompanyRow + city |
| Permissions | N/A | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | Wider menu still below ⋯ |
| Accessibility | OK | Same testids |
| Platform consistency | OK | |

---

## Approved scope

- Owner collection/design shop row: **Your collection** / **Your design** (no chevron to own shop).
- You tiles: **In your packs**.
- Designs/Collections as kit Chips (no `bg-linen` well).
- You library ＋: filled accent + shadow, 40×40.
- You ⋯: `min-w-64`, full-width rows, **Log out** danger.
- You identity: compact Edit / Share pills.

## Explicitly deferred

- Changing Group info / shop visitor tab wells.
- Moving Log out onto the You card.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Units (You/More/⋯/status). Visual check You.  
