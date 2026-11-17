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
| 23 | Connections | DL order: no via Trader / observer shown | Real bug | Trio should surface trader role; soft-hide rules differ by hop. | Yes |
| 24 | Trader observer | Trader on DL order can edit / Cancel as Selling | Discuss | Client wants edit before mill accept, then Observing. Needs product lock. | — |
| 25 | Trader observer | DL order shows Dispatch on trader list | Real bug | If Observing after accept (or always on DL), Dispatch must not sit on trader Selling list. | Yes |
| 26 | Orders | After confirm still “Waiting: supplier” | Real bug | Confirmed → waiting for dispatch / ready to ship label. | Yes |
| 27 | Orders | Transporter shown before any dispatch | Real bug | Transporter/LR belong after first shipment. | Yes |
| 28 | Orders | 1 set order header “of 3” (pcs as sets) | Real bug | Progress in order unit, not raw pcs counted as sets. | Yes |
| 29 | Orders | Below-min order: banner + Accept/Reject | Parked | Bigger minimum UX rejected on sheet. | — |
| 30 | Orders | Confirm sheet: no below-min tag on line | Parked | Lightest option if mins stay; else park with #29. | — |
| 31 | Orders | Buyer edit below minimum silent | Parked | Tied to rejected minimum package. | — |
| 32 | Orders | Qty stepper starts blank / below min | Parked | Same package; merge #77. | — |
| 33 | Orders | Forward below-min without warning | Parked | Same package. | — |
| 34 | Orders | Mill rate edit bleeds onto buyer/trader sell rate | Real bug | Two Orders / two rates; mill change must not rewrite trader sell rate. | Yes |
| 35 | Orders | Can’t-supply progress uses full 15 not confirmed 11 | Real bug | Progress denominator = confirmed / shippable total. | Yes |
| 36 | Orders | Settle / can’t-supply not propagating across legs | Real bug | I-handle/Direct legs must reflect settle + can’t-supply. | Yes |
| 37 | Orders | “1 can’t supply” vs Declined wording | Change / feature | Product language today is can’t supply; Declined is copy redesign. | — |
| 38 | Orders | Dispatch title “to Trader” should be buyer | Misunderstanding | Per-leg title is correct. Notify each hop; ship-to address is separate (#39). | — |
| 39 | Orders | Bale / parcels missing on dispatch card | Discuss | Packing-slip / challan scope. | — |
| 40 | Orders | Buyer missing LR / transporter after dispatch | Real bug | Buyer page should at least show LR + transporter once dispatched. | Yes |
| 41 | Orders | No Received / Complaint on buyer dispatched order | Discuss | Feature ask; needs product lock. | — |
| 42 | Orders | Log order for buyer not in Buying | Close / retest | Close if VFFJ/MIZ9 appear in Buying. | — |
| 43 | Orders | Buyer opens Orders on empty Selling | Discuss | Last-used or pending-action tab — not hard-code Buying forever. | — |
| 44 | Orders | Over-dispatch 75 vs 50 only orange, no confirm | Real bug | Over-ship allowed but needs explicit warn/confirm. | Yes |
| 45 | Orders | “1 of 1 sets” grammar | Polish | Singular noun. | — |
| 46 | Orders | Photo order pcs but header Order in Sets | Real bug | Header must follow design order unit. | Yes |
| 47 | Orders | Confirm photo order with empty rate silent | Real bug | Prompt rate or label rate on request. | Yes |
| 48 | Orders | Chat photo order unit chips vs design unit | Real bug | Align to design unit, not hard-coded pcs steps. | Yes |
| 49 | Orders | Log order / cart: no toast | Polish | Confirmation feedback only. | — |
| 50 | Orders | Order sheet prefilled qty/transporter from other order | Real bug | Fresh form; no stale draft bleed. | Yes |
| 51 | Orders | Chat card “Requested…1 requested” while Placed | Real bug | One status label; card vs ticket out of sync. | Yes |
| 52 | No-conversion | Collection preview “10 sets (= 50 pcs)” | Misunderstanding | When piecesPerPack is set, conversion is intentional sell-as. | — |
| 53 | No-conversion | Remove conversions + bill amounts everywhere | Misunderstanding | Fights locked units + optional Show bill total (default off). | — |
| 54 | No-conversion | Settings still has Units conversions / bill total | Discuss | Keep default OFF; don’t strip settings blindly. | — |
| 55 | Catalogue | Catalogue designs appear in common Designs pool | Discuss | Shipped: Designs with “In your catalog”. v2 SKU-only = Redesign. | — |
| 56 | Catalogue | + sheet missing Add catalogue | Change / feature | Today Collection sheet; catalogue via Library. | — |
| 57 | Catalogue | Apply to all designs checkbox still present | Close / retest | Confirm which form (regular vs GC). | — |
| 58 | Catalogue | Save in Draft stays on Edit collection | Misunderstanding | Locked: Save in Draft stays on editor so they keep filling. | — |
| 59 | Catalogue | Published thumbnail uses last photo not first | Real bug | Cover/thumb should be first photo. | Yes |
| 60 | Catalogue | `/more?tab=designs` opens Collections | Real bug | Deep link must honour tab. | Yes |
| 61 | Catalogue | Title always “My collections” | Change / feature | Shipped shell title; rename with Library IA cut. | — |
| 62 | Catalogue | Pick-and-choose looks like collection; min buried | Change / feature | Aligns with catalogue vs collection decisions. | — |
| 63 | Catalogue | Whole-order catalogue shows selectable designs | Real bug | Whole-order must be one card / one qty. | Yes |
| 64 | Catalogue | Home “New collections” includes catalogues | Parked | Home not to be touched yet per sheet. | — |
| 65 | Repost | Show rates options incomplete vs artifact | Change / feature | Artifact gap. | — |
| 66 | Repost | Reposted collection missing rate/auto-add/audience menu | Change / feature | Artifact incomplete. | — |
| 67 | Repost | Repost tap: no done state / toast | Real bug | Explore should show reposted done icon + toast. | Yes |
| 68 | Repost | External share icon no response | Close / retest | Intermittent; retest before fix. | — |
| 69 | Repost | Buyer sees “They send the mill lots on” jargon | Polish | Copy; hide when Direct ticket mill. | — |
| 70 | UI / chat | Select mode: tap thumb opens viewer | Misunderstanding | Tap view / long-press select is the kit pattern. | — |
| 71 | UI / chat | Selection persists across pages | Misunderstanding | Traveling Selection is intentional. | — |
| 72 | UI / chat | No sent/delivered/read ticks | Change / feature | Not shipped. | — |
| 73 | UI / chat | Chat + attach menu incomplete | Discuss | Complaint follows Requests prototype; rest TBD. | — |
| 74 | UI / chat | Blurry chat card thumbnails | Real bug | Wrong thumb size / density. | Yes |
| 75 | UI / chat | Category labels drop dashes / master labels | Discuss | Category presentation still being finalised. | — |
| 76 | UI / chat | Buyer sees “Order for buyer” toggle | Real bug | Show only if actor has ≥1 connected buyer. | Yes |
| 77 | UI / chat | Same-for-all stepper starts blank | Parked | Same as #32 minimum package. | — |
| 78 | UI / chat | First load Orders/Explore slow | Polish | Perf / skeletons. | — |
