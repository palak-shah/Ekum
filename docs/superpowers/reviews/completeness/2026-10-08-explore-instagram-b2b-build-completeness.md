# Feature Completeness Review — Explore Instagram look + B2B build

**Date:** 2026-10-08  
**Module / ask:** Explore after caption look: own feed, new-designs line, selection dock (replace floater), per-post Bookmark·Share·Repost (Publish Who + show supplier default off).  
**Anchors:** `docs/features/explore.md`, `docs/features/saved.md`, `docs/features/00-concepts.md`, plan `explore_look_vs_product`  
**Disposition:** Proceed (Redesign of floater + “no feed action icons”; B2B Who preserved)

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Instagram placement; B2B trust. Own feed so sellers see their posts. New-design count explains resurface. Dock = Order·Share·Message. Repost = publish under my name with Who — not Everyone. |
| UX Designer | Mute feed actions while Selecting. Own: no Ask/Message/Repost. Caption: You added N / N new designs. Dock hides nav (BM-07 pad). |
| Solution Architect | Drop own-company exclude on feed; Stories You. `exploreNewDesignCount` with activity bump. Floater → BottomTradeDock. Feed actions reuse Saved/Share/PublishAudienceFields + `showSourceShops` default false. |

---

## Platform consistency (required)

1. **Existing patterns?** BottomTradeDock, PublishAudienceFields, CatalogShareSheet, Saved bookmark, SelectableMediaFrame.  
2. **Duplicates?** No — moves verbs onto feed/dock; Your selection remains for multi-pick resolve.  
3. **Reuse?** Yes.  
4. **Naming?** Repost (not Curate) on trader surfaces; Order not cart.

**Philosophy conflict?** No if Who/rates/ceiling stay on Repost and Everyone stays out.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Scope below |
| Business rules | OK | Own feed; new count; allowForward gates Repost |
| Workflows | OK | Select → dock; Repost → Publish sheet |
| Edge cases | OK | Mixed-shop Message disabled; omit empty new-count |
| Permissions | OK | Owner chrome; ceiling |
| User states | OK | Own vs visitor |
| Notifications | N/A | |
| Error handling | OK | In-sheet notices |
| Scalability | OK | Count at bump time |
| Mobile / BM-07 | OK | Dock clearance |
| BM-11 | OK | Trader-eye after ship |
| Accessibility | OK | Icon labels |
| Platform consistency | OK | |

---

## Approved scope

- Own published packs/designs on Explore Buying + You in Stories  
- Caption new-designs line from bump count  
- Replace SelectionWorkspaceBar with Order·Share·Message dock; hide nav when pile ≥ 1  
- Per-post Bookmark · Share · Repost (gated); mute while Selecting  
- Repost sheet: Publish Who/rates/relist + Show supplier name default **off**; persist `showSourceShops`  
- Docs + units + e2e updates  

## Explicitly deferred

- Upload / Orders / complaint look  
- Literal cart  
- Scallop / My collection tab / View+Share CTA pair  

## Sign-off

Required gaps closed or deferred in writing: **Yes**  
Ready for implementation: **Yes**
