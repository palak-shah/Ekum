# Client bug sheet audit (2026-11-17)

Source: [Google Sheet gid 324382208](https://docs.google.com/spreadsheets/d/12LKR8qMl8T_S4wQlb0aZQWlhNmL1ahRe/edit?gid=324382208#gid=324382208)  
Canvas (optional): `C:\Users\darsh\.cursor\projects\c-Projects-cursor-ekum\canvases\client-bug-sheet-audit.canvas.tsx`

Classification is **docs-based** (concepts / access / orders / collections / sell-as), not a live retest.

## Summary

| Verdict | Count |
|---|---:|
| Real bug | 30 |
| Misunderstanding | 10 |
| Change / feature | 10 |
| Discuss | 10 |
| Parked | 7 |
| Close / retest | 4 |
| Polish | 6 |
| **Total** | **78** |
| Fixed (verified local) | 9 (#2, #4–#7, #9, #12, #13) |
| Closed / reject | #8, #10 (owner OK), #11 (no repro) |
| Of remaining real bugs: testing gap | ~22 |

**Fix first (trust):** #20, #34–36  
**Close with client (not bugs):** #1, #3, #8, #10, #11, #18, #38, #52–53, #58, #70–71  
**Fixed:** #2 Share OFF → Repost; **#4–#7** Block; **#9** Repost-off chat line; **#12** design vs collection Share; **#13** chat on first message

---

## Row by row

| # | Area | Report | Verdict | Why | Test gap? |
|---:|---|---|---|---|---|
| 1 | Permissions | Share OFF → shop Share still delivers Forward to buyer | Misunderstanding | Locked: Forward/Share is free; Share OFF = look-only (no Pack/Repost). View gates on open + Ask. | — |
| 2 | Permissions | Share OFF → Repost still succeeds | Fixed | Already shipped. Local: Kavita→Ravi look; festive Followers pack → `FOLLOW_LOOK_ONLY` + Explore `eligible=0`. | — |
| 3 | Permissions | See-only still shows Share in select bar | Misunderstanding | Same as #1 if Share = Forward. Hide Repost, not Forward. | — |
| 4 | Permissions | Blocked buyer can still message | Fixed | Direct send → `CANNOT_MESSAGE`; startDirect does not restore while blocked. Chat stays in All (no auto-Archive). | — |
| 5 | Permissions | Blocked buyer still on They see mine with See/Share | Fixed | Follows already deleted on Block; `invalidateAfterBlock` refreshes They see mine / follows. | — |
| 6 | Permissions | Blocked party still in Explore/stories | Fixed | Active-only connections + `isBlocked` on open; Block invalidates Explore caches. | — |
| 7 | Permissions | Block/Unblock toast + restore See/Share | Fixed / WAD | Toasts: `Blocked` + Unblock cleared. Restore See/Share = misunderstanding (Connection only). | — |
| 8 | Permissions | Toast on every permission toggle | Rejected | Toggle is feedback. Keep toasts only for Block/Unblock + Allow. | — |
| 9 | Permissions | Share-off (= Repost) chat line to wrong parties as user bubble | Fixed | Mill Pack→Look only; exact mill↔trader Direct; grey centered pill; viewer-relative Repost copy. Forward/Share ungated. Completeness `2026-11-17-repost-off-chat-line`. | — |
| 10 | Permissions | Owner listed in Share recipients | Rejected / WAD | Like WhatsApp, share **to catalog owner** is valid. Exclude **self** only (not owner). | — |
| 11 | Permissions | Share sheet missing connected parties | Closed | Earlier session; current build lists connections. | — |
| 12 | Permissions | Selected 1 design → whole collection card shared | Fixed | Selecting Share = designs only; ⋯ Share = collection; no leftover album on design Share. | — |
| 13 | Connections | Chat tap creates empty thread before first message | Fixed | Shop/album/Chats ＋: existing Direct opens; else FirstMessageSheet → create+text on Send. Completeness `2026-11-17-chat-on-first-message`. | — |
| 14 | Connections | Allow request: no toast / no notify requester | Fixed | FollowAllowed notify + Approver **Accepted** / **Connected** toasts. Completeness `2026-11-17-accept-notify-toast`. | — |
| 15 | Connections | Invites copy says Buyers; menu is Connections | Fixed | Referrals copy → **Connections**. | — |
| 16 | Connections | Direct link row: no status / edit / delete confirm | Fixed / WAD | Why-line **Repost off** when gray; delete confirm kept. No Active/Paused chips. | — |
| 17 | Connections | DL row after Share OFF / block: no status chip | Fixed / WAD | Merged with #16 — muted + **Repost off** + Ask to repost. | — |
| 18 | Connections | Chats + cannot start group | Closed / WAD | Trio group starts at first Direct order, not freeform + group create. | — |
| 19 | Connections | Save DL: no toast that group starts on first order | Fixed | Toast: **Saved for next orders. Group starts on the first order.** | — |
| 20 | Connections | DL ON but Order goes to Trader (should be mill) | Fixed | Album Direct stamps require mill Pack; for-buyer respects `shareActive`; Place still `pathForPair` + trio. Completeness `2026-11-17-direct-place-mill-stamp`. | — |
| 21 | Connections | Supplier selectable as buyer on DL / Order for buyer | Fixed | Buyer pickers = followers; exclude self + suppliers I follow. | — |
| 22 | Connections | Connect buyer+supplier from order ⋯ | Closed / WAD | Network → Direct links is the path; no order ⋯ Connect. | — |
| 23 | Connections | DL order: no via Trader / observer shown | Fixed | Party **trader** + Open group chat (trio); notes stay. Completeness `2026-11-17-direct-trader-observing`. | — |
| 24 | Trader observer | Trader on DL order can edit / Cancel as Selling | Fixed | Pre-accept amend + Cancel (not Confirm/Dispatch); Handle myself → I-handle middleman. | — |
| 25 | Trader observer | DL order shows Dispatch on trader list | Fixed | **Observing** on Selling; Needs you Confirm/Dispatch gated for facilitator. | — |
| 26 | Orders | After confirm still “Waiting: supplier” | Fixed | Buying idle → **Waiting: dispatch** after confirm / part_shipped. Completeness `2026-11-18-orders-wait-transporter-moq`. | — |
| 27 | Orders | Transporter shown before any dispatch | Closed / WAD | Buyer place transporter is preferred line before first ship; copy **Preferred transporter**. Do not hide. | — |
| 28 | Orders | 1 set order header “of 3” (pcs as sets) | Fixed | Progress = order unit; no `piecesPerPack` inflate; catalog-whole collapsed. | — |
| 29 | Orders | Below-min order: banner + Accept/Reject | Fixed (light) | Quiet **Below minimum** only — no Accept/Reject banner. | — |
| 30 | Orders | Confirm sheet: no below-min tag on line | Fixed (light) | Same Below minimum helper when Confirm shares How many meta. | — |
| 31 | Orders | Buyer edit below minimum silent | Parked | Tied to rejected minimum package. | — |
| 32 | Orders | Qty stepper starts blank / below min | Parked | Same package; merge #77. | — |
| 33 | Orders | Forward below-min without warning | Parked | Same package. | — |
| 34 | Orders | Mill rate edit bleeds onto buyer/trader sell rate | Real bug | Two Orders / two rates; mill change must not rewrite trader sell rate. | Yes |
| 35 | Orders | Can’t-supply progress uses full 15 not confirmed 11 | Fixed | Progress denom = confirmed/dispatched only (`tradeListShipTotals`). | — |
| 36 | Orders | Settle / can’t-supply not propagating across legs | Fixed | Declined clamps parent qty; settle/lines/dispatch all gated by `shouldPassThrough` (Hold blocks); Resume flushes. | — |
| 37 | Orders | “1 can’t supply” vs Declined wording | Closed / WAD | Keep can’t supply; Declined copy redesign deferred. | — |
| 38 | Orders | Dispatch title “to Trader” should be buyer | Closed / Misunderstanding | Per-leg title correct (confirmed). | — |
| 39 | Orders | Bale / parcels missing on dispatch card | Discuss | Packing-slip / challan scope. | — |
| 40 | Orders | Buyer missing LR / transporter after dispatch | Fixed | Mill→parent shipment copies transporter / LR / legs. | — |
| 41 | Orders | No Received / Complaint on buyer dispatched order | Discuss | Feature ask; needs product lock. | — |
| 42 | Orders | Log order for buyer not in Buying | Fixed / retested | Seller-logged for-buyer on buyer `direction=buying` list (one-trio assert). | — |
| 43 | Orders | Buyer opens Orders on empty Selling | Closed / WAD | `firstOrdersListTabWithContent` — land on tab with content (unit locked). | — |
| 44 | Orders | Over-dispatch 75 vs 50 only orange, no confirm | Fixed | Over-ship allowed; buyer + trader mill hop get Decline → cancel. Completeness `2026-11-18-over-dispatch-decline`. | — |
| 45 | Orders | “1 of 1 sets” grammar | Fixed | `qtyCountNoun(unit, count)` singular at 1. | — |
| 46 | Orders | Photo order pcs but header Order in Sets | Fixed | Photo stamp `unit: set`; Designs header Order in Sets. | — |
| 47 | Orders | Confirm photo order with empty rate silent | Rejected | Rate stays optional on confirm. | — |
| 48 | Orders | Chat photo order unit chips vs design unit | Fixed | Sets chrome (not hard-coded Pieces). | — |
| 49 | Orders | Log order / cart: no toast | Fixed | Builder + invite log toast on success. | — |
| 50 | Orders | Order sheet prefilled qty/transporter from other order | Closed / WAD | Remember qty + transporter (mostly same). | — |
| 51 | Orders | Chat card “Requested…1 requested” while Placed | Fixed | Chat event label + headline **Placed**. | — |
| 52 | No-conversion | Collection preview “10 sets (= 50 pcs)” | Closed / WAD | Keep sell-as conversion. | — |
| 53 | No-conversion | Remove conversions + bill amounts everywhere | Fixed / WAD | Keep conversion; bill via setting — hidden for missing defaults **and** explicit OFF. | — |
| 54 | No-conversion | Settings still has Units conversions / bill total | Discuss | Keep default OFF; don’t strip settings blindly. | — |
| 55 | Catalogue | Catalogue designs appear in common Designs pool | Discuss | Shipped: Designs with “In your catalog”. v2 SKU-only = Redesign. | — |
| 56 | Catalogue | + sheet missing Add catalogue | Change / feature | Today Collection sheet; catalogue via Library. | — |
| 57 | Catalogue | Apply to all designs checkbox still present | Close / retest | Confirm which form (regular vs GC). | — |
| 58 | Catalogue | Save in Draft stays on Edit collection | Fixed | Redesign: leaves to You list + toast (`2026-11-18-save-draft-leave-to-list`). | — |
| 59 | Catalogue | Published thumbnail uses last photo not first | Real bug | Cover/thumb should be first photo. | Yes |
| 60 | Catalogue | `/more?tab=designs` opens Collections | Fixed | `tab=designs` aliases Designs like `products`. | — |
| 61 | Catalogue | Title always “My collections” | Change / feature | Shipped shell title; rename with Library IA cut. | — |
| 62 | Catalogue | Pick-and-choose looks like collection; min buried | Change / feature | Aligns with catalogue vs collection decisions. | — |
| 63 | Catalogue | Whole-order catalogue shows selectable designs | Fixed | Whole-order = one How many card / one qty (`catalogCollectionId` on expand + DesignSet prepare). | — |
| 64 | Catalogue | Home “New collections” includes catalogues | Fixed | Quiet **Catalog** chip on catalog rows (Collections tab kept; no Home IA rewrite). | — |
| 65 | Repost | Show rates options incomplete vs artifact | Change / feature | Artifact gap. | — |
| 66 | Repost | Reposted collection missing rate/auto-add/audience menu | Change / feature | Artifact incomplete. | — |
| 67 | Repost | Repost tap: no done state / toast | Real bug | Explore should show reposted done icon + toast. | Yes |
| 68 | Repost | External share icon no response | Close / retest | Intermittent; retest before fix. | — |
| 69 | Repost | Buyer sees “They send the mill lots on” jargon | Polish | Copy; hide when Direct ticket mill. | — |
| 70 | UI / chat | Select mode: tap thumb opens viewer | WAD | Retest: media tap toggles while Selecting; long-press starts; name may still open (Explore). | — |
| 71 | UI / chat | Selection persists across pages | Misunderstanding | Traveling Selection intentional — skipped this slice. | — |
| 72 | UI / chat | No sent/delivered/read ticks | Fixed | 1:1 Sent / Delivered / Seen (`lastDeliveredAt` + Completeness `2026-11-19-chat-delivery-ticks`). | — |
| 73 | UI / chat | Chat + attach menu incomplete | Discuss | Complaint follows Requests prototype; rest TBD. | — |
| 74 | UI / chat | Blurry chat card thumbnails | Fixed | Trade thumbs 80px + Thumbnail2. | — |
| 75 | UI / chat | Category labels drop dashes / master labels | Discuss | Category presentation still being finalised. | — |
| 76 | UI / chat | Buyer sees “Order for buyer” toggle | Fixed | Toggle only when selling/trading **and** ≥1 follower buyer (no flash while loading). | — |
| 77 | UI / chat | Same-for-all stepper starts blank | Parked | Same as #32 minimum package. | — |
| 78 | UI / chat | First load Orders/Explore slow | Fixed | List-shaped Skeleton on Orders + Explore first paint. | — |
