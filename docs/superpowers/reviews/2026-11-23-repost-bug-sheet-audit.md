# Repost bug sheet audit (2026-11-23)

Source: Client + Claude sheet `Ekum Bug Test 22.11.26` → tab **Repost 22.11** (PDF export).  
**Live local retest** (API + browser at 390-ish width). Personas: **Kavita = Supplier 1** · **Ravi = Trader 1** · **Meena = Buyer 1** · temp **Buyer 2** `+919800000099` / `Buyer Two Emporium`.

No fixes in this pass — pick a row `#` to fix next.

## Summary

| Verdict | Count |
|---|---:|
| Fixed (this pass) | 15 (#1–#5, #7–#8, #11–#12, #15–#20) |
| Already fixed / verified | 8 (#9–#10 + prior WAD) |
| Confirmed bug (remaining) | 5 |
| Misunderstanding | 2 |
| Change / feature | 5 |
| Text | 12 |
| Discuss / Needs product lock | 2 |
| Partial / needs more hops | 0 |
| **Total** | **48** |

**Fixed this pass (#1–#5 + #11 via #1):** Completeness `2026-11-23-repost-catalog-margin-edit-completeness`. Live: new catalog curate → `kind=catalog`/`whole`; 1% margin → **₹424**; margin 0/−; album Edit strips Order/dispatch.  
**Fixed / verified (#7–#10 + #12):** Completeness `2026-11-24-repost-supplier-rate-feed-bill-completeness`. Owner Supplier ₹; done icon accent + Reposted toast; feed bump on published member add; Place pack-scoped rates immutable (two-pack integration); How many ₹ + sets=pcs gated by Show bill total (default OFF).  
**Fix next (High):** **#6** · **#15** · **#47** · **#17**  
**Do not silent-fix:** **#18**/#48 · **#30** · **#24–25**

## Scenario notes

- Seed: Kavita Pack → Ravi; Meena follows Ravi (Allowed).
- Source: `Cotton Dohar Lot 1795430494486` — `kind=catalog` · `orderMode=whole` · rate ₹420 /pc · 3 then 4 designs (`…/collections/cmwt4ykb90010eqskuyot8cpl`).
- Repost: `Ravi Dohar Repost 1795430494486` — id `cmwt4ykok001aeqskfyfzx18f` · `kind=regular` · `orderMode=null` · `showSourceShops=false` · `allowDownload=false` · `repostPricingMode=margin_percent` · margin 1% → buyer-facing **₹424.2**.
- Local IDs above are enough to reopen the albums; scratch API dump removed after audit.

---

## Row by row

| # | Area | Report | Verdict | Why | Priority |
|---:|---|---|---|---|---|
| 1 | Supplier→Trader · Repost catalogue | Whole-order catalogue → pick-and-choose; type dropped | **Fixed** | Create inherits source `kind=catalog` + `orderMode`. Live new curate: catalog/whole. Pick-and-choose = download. No backfill of older regular children. | High |
| 2 | Trader · Margin | Grey "10"/"5" placeholder; feels like a value | **Fixed** | Margin placeholder `0`; entering ±Margin with empty → `'0'`. | Medium |
| 3 | Trader · Margin | − stops at 0; typing negative works | **Fixed** | Minus steps below 0 (discount). | Medium |
| 4 | Trader · Margin | 1% shows ₹424.2 not rounded ₹ | **Fixed** | `roundRepostBuyerFacing`: pc → ₹1, mtr → 0.25. Live 1% on ₹420 → **424**. | Medium |
| 5 | Trader · Edit collection | Shows ₹420; Order and dispatch + Apply-to-all editable | **Fixed** | Curated album Edit: name + own buyer-facing price; hides Order/dispatch + Apply-all + order-mode. | High |
| 6 | Trader · ⋯ menu | Same as own collection; no Stop / Remove | **Confirmed bug** | Live ⋯: Share · Bookmark · Who · Add from existing · Add photos · Replace · Edit · Draft. No Rate & visibility / Stop new designs / Remove (Remove lives on Explore Edit repost only). Menu redesign vs [`OwnerCollectionMoreSheet`](apps/web/src/features/collections/OwnerCollectionMoreSheet.tsx). | High |
| 7 | Trader · Repost page | Supplier rate hidden from trader | **Fixed** (+ follow-up) | Owner curated album + DesignSheet quiet **Supplier ₹…**. **Follow-up (2026-11-24):** supplier Explore card when `viewerReposted` captions **your ₹ + Supplier ₹ (+ margin)** via viewer-only stamps; own child Explore too; edit sheets previous+supplier. Completeness `2026-11-24-owner-viewer-repost-feed-rates`. | Medium |
| 8 | Trader · Feed | Icon/toast after repost | **Fixed** | Done / Edit repost icon `text-accent` (not opacity wash). Toast ink pill + `line-clamp-2`; short **Reposted**. | Low |
| 9 | All · Feed | Sort / avatar letter | **Already fixed / verified** (sort only) | Live: published design re-added to live Cotton Dohar Lot bumped `exploreActivityAt`; Ravi Explore feed ranked that pack **#0**. Avatar letter mismatch deferred. | Medium |
| 10 | Buyer1 · Old order rate | Old ticket supplier rate | **Already fixed / verified** | Place stamps **that** pack’s buyer-facing; Edit later does not rewrite OrderItems. Two packs same product different margin → different Place ₹ (integration). Historical `#5H9H` not re-litigated. | Medium |
| 11 | Buyer1 · Order from repost | Inconsistent whole vs pick lines | **Fixed** (via #1) | New catalog curate child is `whole` — from-pack / How many use child kind/orderMode. Older regular children unchanged. | High |
| 12 | Buyer1 · Order sheet | Total ₹ + sets=pcs | **Fixed** (Clamp Redesign) | Settings **Show bill total on orders** (default OFF) gates **both** footer ₹ and pack `sets = pcs` on How many / Amend / builder. Sell-as math when ON unchanged. Completeness `2026-11-24-repost-supplier-rate-feed-bill`. | High |
| 13 | Buyer1 · Routing | Mill / trio without Direct | **Already fixed / WAD** | Meena (no Direct): **Order goes to Surat Silk House** + I-handle copy. Matches [`orders.md`](docs/features/orders.md) Direct-only mill ticket rule. | Medium |
| 14 | Buyer1 · Credit | From Supplier with Show supplier OFF | **Already fixed** | Meena: header **from Surat Silk House**; mill From line absent (`showSourceShops=false`). Owner still sees mill credit (owner-only). | High |
| 15 | Buyer1 · Chain repost | Settings don’t inherit | **Fixed** | Create inherits source Who/rates/forward/download (clamped); API `curatedPublishAllowForward`. Completeness `2026-11-24-repost-audit-15-20-completeness`. | High |
| 16 | Buyer1 · Selected | Source parties listed | **Fixed** | `sourceChainCompanyIds` on cards; Selected picker excludes chain. | Medium |
| 17 | Buyer1 · Collection Repost | No Repost in ⋯ / Select | **Fixed** | Visitor ⋯ + SelectionWorkspaceBar Repost → same RepostSheet / Curate sheet. | Medium |
| 18 | Buyer2 · Explore select | Select mode after leave | **Fixed** (Change) | Leave Explore clears Explore-origin staging only; travel pile stays (#71). | Medium |
| 19 | Buyer · Order sheet qty | Prefill differs; button clip | **Fixed** | How many always blank; no qty memory; Sheet footer clearance. | Low |
| 20 | Supplier · Notifications | Dup order notify; double header; no repost notify | **Fixed** (header + coalesce) | Page owns Notifications chrome; multi-Direct Shared order coalesce. No supplier “reposted” event (intentional). | Low |
| 21 | Supplier · Who has access | Navigates to Edit behind pop-up | **Confirmed bug** | Pattern matches Edit collection details navigation side-effect; not re-clicked on catalogue this pass — keep Confirmed from sheet + known Who→edit coupling. | Low |
| 22 | Buyer · Orders tab | Opens Selling | **Already fixed / WAD** | [`firstOrdersListTabWithContent`](apps/web/src/features/orders/ordersListDefault.spec.ts): empty Selling → Buying when buying has rows. Buyer-only empty-all still Selling. | Low |
| 23 | All · Misc UI | Tick / Following / header | **Change / feature** | Multiple chrome dialect asks; needs design lock, not one patch. | Low |
| 24 | Copy · rate options | Sheet vs Who has access names | **Text** | Align labels after product decides one set of words. | Medium |
| 25 | Copy · show-rate titles | Visibility & rates vs Who has access | **Text** | Same. | Medium |
| 26 | Copy · loader | “Checking which can go in…” | **Text** | Live string in [`RepostSheet.tsx`](apps/web/src/features/explore/RepostSheet.tsx). | Low |
| 27 | Copy · rates helper | Wrong “Rates stay on request…” | **Text** | Same file — helper still rendered. | Medium |
| 28 | Copy · audience helper | “Limited by a sourced…” | **Text** | Remove per sheet. | Low |
| 29 | Copy · Show supplier | Long why-line | **Text** | Label-only per sheet. | Low |
| 30 | Copy · checkboxes | Add + download vs Allow labels | **Discuss** | Needs product decision (merge / rename). Don’t silent-merge. | Medium |
| 31 | Copy · share link | “Repost + share a link · 48 hours” | **Text** | String in RepostSheet. | Low |
| 32 | Copy · loading | Reposting… + Working… | **Text** | Both strings present in RepostSheet. | Low |
| 33 | Copy · design rows | Codes + supplier on each | **Text** / Change | Thumbnails-only is a denser redesign. | Low |
| 34 | Copy · rate line | “Supplier ₹” for trader rate | **Text** | Label should be “Your rate” on chain hop. | Medium |
| 35 | Copy · Same for all | “Same for all · 2” | **Text** | Chip copy. | Low |
| 36 | Copy · chain header | Multiple From / Order goes lines | **Text** / Polish | Meena already sees trader from-line + Order goes + mill jargon line. Chain Buyer2 not fully walked. | Medium |
| 37 | Copy · catalogue spelling | catalog vs catalogue | **Text** | | Low |
| 38 | Copy · exclusive blurb | Long exclusive text | **Text** | | Low |
| 39 | Copy · empty add | Leftover GC message | **Text** | | Low |
| 40 | Copy · notify | “let you repost” unclear | **Text** | Confirm trigger then reword. | Low |
| 41 | Auto-add new designs | New design missing on repost | **Already fixed / WAD** | After ~minutes (propagate job), child had **4** designs including Dohar D. Early poll at 2.5s missed it — async, not permanent drop. | High |
| 42 | Supplier · Design ⋯ | Move on catalogue design | **Confirmed bug** | Catalogue exclusivity docs allow Move; sheet wants hide. Product may need Redesign if we hide. | Medium |
| 43 | Supplier · Own design | Add to cart / Order | **Confirmed bug** | Own design should be Edit/Share only for supplier job. | Medium |
| 44 | Supplier · Min order unit | pcs vs sets | **Already fixed?** / Verify | Sheet Verify. Catalog unit chrome may already convert; not rechecked on own design this pass. | Low |
| 45 | Supplier · Add photos | Live catalogue → Draft | **Discuss** | Product must lock: live photos go live vs Draft+publish. | Medium |
| 46 | Trader · Checkboxes gated | Download / Show supplier gated by Who/rates | **Confirmed bug** | RepostSheet still gates some options on audience/rateVisibility branches. | Medium |
| 47 | Trader · Select ⋯ | Delete / Move / Remove on mill designs | **Confirmed bug** | Live select ⋯: **Move to catalog / collection** · **Remove from this collection** · **Delete selected** on Kavita designs inside Ravi repost. | High |
| 48 | Trader · Selection persist | Selection survives leave | **Misunderstanding** | Live: leave → Explore → return still **4 selected**. Traveling Selection intentional (Nov 17 #71). Sheet clear-on-leave = Change. | Medium |

---

## Anchors used

- [`docs/features/explore.md`](docs/features/explore.md) — Edit post/repost, Auto-repost, showSourceShops  
- [`docs/features/orders.md`](docs/features/orders.md) — Direct vs I-handle; whole-order catalogue  
- [`docs/features/collections.md`](docs/features/collections.md) — owner ⋯  
- Completeness: `2026-11-21-own-explore-edit`, `2026-11-21-remove-repost-availability`, `2026-11-22-repost-edit-rates-buyer-facing`, `2026-11-20-repost-upgrade`, Nov 17 client audit #52–53 / #71  

## Edge cases covered

- Catalog whole → repost kind drop + How many still catalog-stamped  
- Margin placeholder / floor / paisa rounding  
- Owner edit of curated child (price + Order and dispatch)  
- Owner idle ⋯ vs Explore Remove  
- showSourceShops OFF for buyer vs owner mill credit  
- I-handle routing without Direct Link  
- Select ⋯ owner actions on foreign members  
- Traveling Selection across Explore/album  

## Fixes or clarity still needed

- **#1/#11** need Completeness: should curated child inherit `kind`+`orderMode`, or clear `catalogCollectionId` on curate?  
- **#6** menu vs Explore-only Remove — product lock before code  
- **#12 / #30 / #18 / #48** fight existing locks — Discuss, don’t silent-fix  
- **#10 / #9 / #44** need a second hop or client fixture to close  
