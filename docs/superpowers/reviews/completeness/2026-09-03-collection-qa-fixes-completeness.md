# Feature Completeness Review — Collection QA fixes (Kavita → Ravi)

**Date:** 2026-09-03  
**Module / ask:** Sticky Update visibility; Followers pack near top of Explore; chat-share when discoverable; 2-design Saved mosaic; owner-only origin on curated viewer  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/collections.md`, `docs/features/chat.md`, `docs/features/explore.md`, Completeness 2026-09-03-forward-free-view-on-open  
**Disposition:** Proceed

> Closes incomplete wiring from Forward-free (share `validateReference`) and owner source line (viewer), plus BM-07 sheet CTA and Explore ranking bugs. No philosophy change.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Share stays **chats**, not broadcast. Discoverable packs can be forwarded. Curator sees origin; buyers see pack owner. |
| UX Designer | Update visibility must stay in Sheet footer. Saved 2-design cards must fill a square. Quiet From line only for owner. |
| Solution Architect | `canDiscover` after owner / wasSharedInChat; bump `exploreActivityAt` when audience widens to Followers/Everyone; prefer packs in client mergeRanked. |

---

## Platform consistency (required)

1. **Existing patterns?** Kit Sheet footer; CatalogShareSheet → threads; collectionOwnerSourceLine.  
2. **Duplicates another feature?** No.  
3. **Should reuse an existing workflow?** Yes — Explore discoverability for share gate.  
4. **Naming matches the app?** Update visibility; From {shop}; Share album…

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Five QA fixes |
| Business rules | OK | Forward free; share = chats |
| Workflows | OK | Kavita publish → Ravi share/curate |
| Edge cases | OK | Selected-only tweak does not resurface |
| Permissions | OK | canDiscover; owner-only origin |
| User states | OK | |
| Notifications | N/A | |
| Error handling | OK | INVALID_REFERENCE only when not visible |
| Scalability | OK | |
| Mobile interactions | OK | BM-07 Sheet footer |
| Accessibility | OK | |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Share blocked for Explore-visible packs

| Field | Content |
|-------|---------|
| Gap | `validateReference` ignored Followers/Explore discoverability. |
| Why it matters | Ravi cannot pass Kavita’s pack in chat. |
| Impact if ignored | Forward-free incomplete. |
| Recommendation | Allow when `canDiscover`. Closed in this slice. |
| Priority | Required before implementation |

### G-002 — Owner origin missing on curated viewer

| Field | Content |
|-------|---------|
| Gap | Source line only on My Catalog / editor; products lack `companyName` on catalog get. |
| Why it matters | Ravi thinks Georgette is his. |
| Impact if ignored | Wrong edits / wrong buyer story. |
| Recommendation | Owner-only From line + companyName. Closed in this slice. |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Sheet footer for Update visibility (collection + product).
- Bump explore activity on Followers/Everyone widen; prefer packs in mergeRanked.
- Chat share: discoverable references allowed; not broadcast.
- Square 2-image AlbumGrid; no empty cells from productCount.
- Owner-only origin on CollectionViewerPage + serializer companyName.

## Explicitly deferred / rejected

- Removing broadcast (later).
- receivedByDay Explore shelves.
- One-order I-handle / TradeLane / Agent.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes (units + manual path; journey Recommended next)
