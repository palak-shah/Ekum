# Repost — current behaviour prototype

Standalone HTML demo of **existing** Ekum Repost behaviour, audited against this repo (Nov 2026). Sample data only; no backend.

Open [`index.html`](./index.html) in a browser.

---

## 1. Existing working functionality

### Manual Repost (two entry paths)

1. **Explore one-tap** — feed icon row → `RepostSheet`  
   - Creates a Collection (`POST /collections` with `repostSourceCollectionId` or `repostSourceProductId`) → `PUT …/products` → `POST …/publish`.  
   - Stays on Explore; flips to done icon (`viewerReposted` / local mark).  
   - Who: **My followers** | **Selected** only (legacy everyone/connections map to followers).  
   - Rules: Show rates, allowForward, allowDownload, **Show supplier name** (foreign members; default off).  
   - Quiet **Repost + share/copy a link · 48 hours**.  
   - Name clash → “You already have this collection.” / **Add to it**.  
   - Skipped designs collapsed; **no Ask** on this sheet (`allowRelistAsk={false}`).

2. **Multi-pick** — Cart dock **Repost** (Trading on), You Designs ⋯ Repost, `/catalog/curate`, Design set “Curate” when trading → `CurateFromSelectionSheet`  
   - Paths: **Add to existing** (published packs) or **Add new** (Save draft / Publish → Collection editor Publish sheet).  
   - **Ask** for locked designs via `POST /relist-requests` when eligible.  
   - Albums in pile → `OrderCollectionResolveSheet` (“Use whole collection” / “Pick designs” → Continue Repost).

### Eligibility / grants

- UI gate: not own post, `tradePresence.trading`, `repostEligibleCount > 0`, not already reposted (done icon + toast).  
- Server curate ceiling (`assertProductsCuratable`): Look-only (`FOLLOW_LOOK_ONLY`), forward lock (`RELIST_NOT_ALLOWED`), discoverability, audience ceiling, rate-visibility ceiling.  
- Followers / Chats: **Allow Repost** checkbox = Pack vs Look. Pack→Look posts mill↔trader Direct system line only (buyer never gets it).

### Direct Link auto-repost (live server path)

- Network → Direct links ＋ sheet: locked **On** row “New supplier posts go to this buyer” (not a toggle).  
- On supplier **publish** (and some membership bumps), `collection.propagate` job delivers one automatic Selected pack per trader × root to that trader’s Direct Link buyers; `showSourceShops` forced on; future-only (albums that existed before the link do not hop).  
- Manual Followers Repost after auto **reuses** the same Collection id and may widen; delivered buyer ids kept for Explore skip-list.  
- Remove link drafts that hop; Save again can republish same id.

### Rates / identity

- No markup UI or rate copy on Repost — members are shared `Product` rows; card rates come live from pack/member rate helpers.  
- Supplier credit: ceiling-safe `From {shop}` when `showSourceShops`; Order/Message still go to pack owner unless Direct Link Place routing.

### Lifecycle

- Repost = ordinary Collection: edit / Hide Draft / Publish / Delete via You library.  
- Source pack unpublish/archive → propagate drafts Published children stamped with that `repostSourceCollectionId` (manual and automatic).

---

## 2. Partially implemented or disabled

| Item | Reality in code |
|------|-----------------|
| Lane JSON `autoRepost` / `LANE_AUTOREPOST_AVAILABLE = false` | Cosmetic / non-editable in TradeLane view. **Does not gate** the propagate job. UI shows locked On. |
| `behaviorsEditable: false` / PATCH trade-lanes | Returns `PATH_LOCKED` — cannot toggle auto-repost per lane. |
| Design Set button label **“Curate”** | Opens the same Repost sheet; naming inconsistency only. |
| `AlbumSelectBar` / `BrowseSelectBar` Repost | Defined; no live non-spec importers found (unused chrome). |
| `canRelist` capability | Set on first foreign publish; not used as a hard gate for curate. |
| `removeDirectLinkBuyersForLanes` | No non-test callers (dead helper). |
| Explore staging dock | No Repost — only after cart. |
| Collection album page | No direct Repost CTA; only via cart/resume pick flow. |

---

## 3. Missing functionality (not in product)

- Dedicated “Un-repost” from Explore (done icon only toasts).  
- Restore Archived collections (`unarchive` always `NOT_ALLOWED`).  
- Everyone / Connections as publish Who chips (API may still store legacy values).  
- Per-lane auto-repost off switch.  
- Markup / trader rate editor on the Repost sheet.  
- Direct Link choice inside Publish/Repost sheets.  
- Feature flag to turn manual or auto Repost on/off.  
- Buyer-facing “Repost off” chat notice (intentionally mill↔trader only).

---

## 4. Relevant file paths

### Web

- `apps/web/src/features/explore/RepostSheet.tsx`
- `apps/web/src/features/explore/ExploreFeedActions.tsx`
- `apps/web/src/features/browse/CurateFromSelectionSheet.tsx`
- `apps/web/src/features/browse/RepostSkipSection.tsx`
- `apps/web/src/features/browse/curateCheck.ts`
- `apps/web/src/features/browse/SelectionPage.tsx`
- `apps/web/src/features/catalog/PublishAudienceFields.tsx`
- `apps/web/src/features/catalog/publishAudienceOptions.ts`
- `apps/web/src/features/catalog/curationAudienceCeiling.ts`
- `apps/web/src/features/network/DirectLinksPage.tsx`
- `apps/web/src/features/chats/followAskDecide.ts`
- `apps/web/src/lib/tradePresence.ts`

### API / domain / DB

- `apps/api/src/catalog/collection.service.ts` — create/publish/setProducts, `resolveRepostSource`
- `apps/api/src/catalog/curation-ceiling.ts`
- `apps/api/src/catalog/collection-propagate.service.ts` — Direct Link auto-repost
- `apps/api/src/catalog/direct-link-repost-audience.ts`
- `apps/api/src/catalog/collection-lineage.ts`
- `apps/api/src/orders/trade-lane.service.ts` / `trade-lane.ts`
- `apps/api/src/discovery/source-shop-credit.ts`
- `packages/domain-types/src/repost-hop.ts`
- `packages/domain-types/src/catalog.ts` — create/publish/curate-check schemas
- Prisma `Collection`: `repostSourceCollectionId`, `repostSourceProductId`, `repostRootCollectionId`, `repostOrigin`, sync stamps, `showSourceShops`
- Migrations: `20261011120000_collection_repost_source`, `20261028160000_direct_links_repost_lineage`

### Docs / e2e

- `docs/features/explore.md`, `collections.md`, `orders.md`, `access-and-connections.md`, `settings.md`, `chat.md`
- `apps/e2e/tests/functional/explore.own-repost.journey.spec.ts`
- `apps/e2e/tests/functional/explore.auto-repost-selected.journey.spec.ts`
- `apps/e2e/helpers/repost.ts`

---

## 5. Assumptions and unresolved questions

1. **Persona switcher** in the HTML is a demo lens only — product uses capabilities (`trading` / `selling`), not Supplier/Trader/Buyer roles.  
2. **`hideImmediateChildren` drafts manual children** when the source pack is unpublished. Feature docs describe independent manual curation — confirm intended vs bug.  
3. **Auto child after source hide**: no clear auto re-publish when the source returns; `unionDirectLinkBuyer` can restore in some link-create cases.  
4. **Design hide / drop from source** does not enqueue propagate; membership sync for auto packs waits for a later pack-level trigger. Visible “unavailable member” row in the owner editor is **unclear** (helper imported, call site not found).  
5. **Rate Visible** remains tappable after foreign-member On-request default in the sheet; API forces `on_request` unless every foreign source is visible — UI may look looser than the server.  
6. **`LANE_AUTOREPOST_AVAILABLE = false`** comment (“Stage 6”) is stale relative to the live propagate path — do not treat the flag as “auto-repost off”.  
7. Prototype clicks are **simulated**; they do not call APIs. Badge legend in the UI marks working vs locked vs missing vs unclear.

---

## Accuracy rules followed

- Source of truth = repository implementation + locked feature docs that match code.  
- Direct Link auto-repost is demonstrated as **enabled server behaviour** with a **non-editable UI row**, not as a user toggle.  
- No production app files, schema, APIs, or tests were modified for this deliverable.
