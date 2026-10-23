# Feature Completeness Review — Shared sticky CTA dock

**Date:** 2026-10-22  
**Module / ask:** Page CTA bars (Edit design Update | Visibility, New collection Create & Publish, Profile Update, order ticket dock) must use one dock chrome and never cover the last field (BM-07).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/catalog.md`, `docs/features/collections.md`, `docs/features/orders.md`, `.cursor/rules/ui-quality-bar.mdc` §2b §4c  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Last field on Edit design (Size tags) must stay readable. Traders should not learn a different bar per screen. |
| UX Designer | Same kit `Button` row on a shared bar. Do not restyle Message · Share · Order into editor CTAs. |
| Solution Architect | Reuse `BottomTradeDock` + `BOTTOM_DOCK_CLEARANCE_CLASS`. Nav-hidden pages: `aboveAppNav={false}`. Tab-root docks: `aboveAppNav={true}`. No per-page `bg-canvas` on the bar. |

---

## Platform consistency (required)

1. **Existing patterns?** `BottomTradeDock` (owner pack Update already).  
2. **Duplicates another feature?** No — removes copy-paste bars.  
3. **Should reuse an existing workflow?** Yes.  
4. **Naming matches the app?** Update · Visibility · Create & Publish · Save in Draft unchanged.  
5. **Units?** N/A.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Same verbs, shared chrome |
| Business rules | N/A | |
| Workflows | OK | |
| Edge cases | OK | Nav hidden vs above tab bar |
| Permissions | N/A | |
| User states | OK | Edit / create / profile / ticket |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 clearance required |
| First glance (BM-11) | OK | Size tags fully above Update \| Visibility |
| Units (order / dispatch / Rate per) | N/A | |
| Accessibility | OK | Existing button names |
| Platform consistency | OK | Theme via `bg-surface/95` on the shared dock |

---

## Gaps

### G-001 — Edit design dock sat above a hidden tab bar

| Field | Content |
|-------|---------|
| Gap | `/catalog/*` hides nav; Edit design used `bottom-[4.75rem]`, so Size tags showed in the gap |
| Why it matters | Last fields look broken / un-tappable |
| Impact if ignored | Traders cannot finish Size tags without fighting the bar |
| Recommendation | `BottomTradeDock` `aboveAppNav={false}` + `BOTTOM_DOCK_CLEARANCE_CLASS` |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Route page CTA Button docks through `BottomTradeDock` (product editor, collection create, profile Update, order action dock).  
- Tab-root leftover bars (Chats inbox, Browse/Album select) use the same component with `aboveAppNav={true}`.  
- Shared scroll clearance; no per-screen dock fill.  
- Selection Message · Share · Order unchanged.

## Explicitly deferred / rejected

- Redesigning trade icon docks into editor Update \| Visibility pairs.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes
