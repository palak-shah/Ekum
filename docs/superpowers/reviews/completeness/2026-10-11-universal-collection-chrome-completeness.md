# Feature Completeness Review — Universal collection listing + detail chrome

**Date:** 2026-10-11  
**Module / ask:** One select dock language for shop Collections (Message · Share · Order); You Collections Share · Order + ⋯ Hide/Archive; collection detail always uses Add to cart · Message · Share · Order when this album has picks; Designs · Photos · Replace only on `packManage` idle; Delete/Remove in select-mode ⋯.  
**Anchors:** `docs/features/collections.md`, screenshots shop dock + SelectionWorkspaceBar  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Shop = Message that shop; You has no Message. Lifecycle Hide/Archive on You only. Detail selecting always trade bar. |
| UX Designer | Idle manage dock entry-gated; select-mode ⋯ mode-swaps to Remove · Delete. Order label stays Order; How many buyer-ready for own. |
| Solution Architect | `shouldShowShopTradeDock` allows own; workspace bar on collection when this-album picks ≥ 1; drop `packTradeDock`. |

---

## Platform consistency (required)

1. **Existing patterns?** BottomTradeDock / SelectionWorkspaceBar / MoreActionsSheet / packManage.  
2. **Duplicates another feature?** No — unifies three docks.  
3. **Should reuse an existing workflow?** Yes — shortlist + How many buyer-only.  
4. **Naming matches the app?** Order (not Order for buyer on dock); Hide · draft · Archive.

**Philosophy conflict?** No — challenged locks reject dead Message on You and Hide on shop shelf.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | |
| Business rules | OK | Own Message muted; buyer-ready How many |
| Workflows | OK | |
| Edge cases | OK | Bar stays with picks after exit Select tools |
| Permissions | OK | |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | |
| Scalability | N/A | |
| Mobile interactions | OK | BM-07 dock clearance |
| First glance (BM-11) | OK | No dead Message on You |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

None Required after challenged locks.

---

## Approved scope for this slice

- Shop own+other: Message · Share · Order (Message gray on own).
- You Collections published select: Share · Order; ⋯ Hide · draft · Archive.
- Detail: SelectionWorkspaceBar when this-album picks ≥ 1; packManage idle Designs · Photos · Replace only; remove packTradeDock.
- Order label Order; How many own → forBuyer on + Choose buyer CTA.
- Owner select ⋯ Remove · Delete selected; design sheet Edit · Remove · Delete design.

## Explicitly deferred / rejected

- Message on You select dock.
- Hide/Archive on own shop shelf.
- Merging You vs shop listing tiles.
- Saved tab / You Designs tab full rewrite.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
