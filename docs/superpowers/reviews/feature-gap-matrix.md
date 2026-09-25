# Feature gap matrix

**Updated:** 2026-09-25 (login phone type)  
**Source:** Completeness reviews under `docs/superpowers/reviews/completeness/`  
**Tracks:** Regression (`@smoke @regression` / BM-* units) · Functional (`@functional`)

Product status: Works · Partial · Missing · Later · Rejected · Redesign  
Verification: Functional · Regression · Unit-only · Untested

| Module | Capability | Product status | Verification | Completeness priority | Notes |
|--------|------------|----------------|--------------|----------------------|-------|
| Notifications | Accuracy: tap mark-read, badge scope, who/what copy, deep links + push path | Works | Unit + Functional | Required | Completeness 2026-09-14-notifications-accuracy; return→order; SW `url` |
| Auth | Stay signed in until Logout (10y sliding refresh) | Works | Unit-only | Required | Completeness 2026-08-31-stay-signed-in; OTP only Logout / wipe / INVALID_TOKEN; local clear before revoke |
| Auth | Login logo + tagline + form in one horizontal teal-gradient box | Works | Visual | Optional | Completeness 2026-09-24-login-teal-form-box; tagline “Textile trade, organised.” |
| Auth | Login mobile field accepts typing on iOS Home Screen | Works | Unit | Required | Completeness 2026-09-25-login-phone-type; no page-load autofocus; HS reload skips login / focused fields |
| Chat | Seeded thread text send | Works | Functional + Regression | Required | Green 2026-08-11 |
| Chat | In-thread search scopes + stepper | Works | Functional | Required | Green 2026-08-24: All/Photos/Collections/Designs/Orders |
| Chat | Thread list `view`/`q` API + index | Works | Unit + Functional | Required | Restored WIP 2026-08-11; Completeness thread-message-filters |
| Chat | Inbox deep search + why-line | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-search-deep; `GET /threads?q=` |
| Chat | Attach search + multi-share | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-attach-multi-share |
| Chat | Attach Photos (ContinuousCamera + gallery) | Works | Functional | Required | Completeness 2026-09-12-chat-attach-camera; one Photos row like Add designs; Document separate |
| Chat | Attach Document (PDF/office + original photo) | Works | Unit + Functional | Required | Completeness 2026-09-13-chat-document-attach; multi-pick; no video |
| Chat | Cross-chat find (Photos / Documents / Collections / Designs) | Works | Unit + Functional | Required | Completeness 2026-09-13-chats-cross-find; Orders on Orders tab only; `/chats/find` |
| Catalog | Design browse Feed/Grid default (last wins) | Works | Unit | Required | Completeness 2026-09-12-design-browse-layout-default; Ekum default Feed; album+Saved+My designs |
| Chat | Leave guard (composer / attach WIP) | Works | Functional | Required | Completeness 2026-08-24-discard-guard |
| Chat | Requests inbox (unconnected) | Works | Functional | Recommended | `chat.requests.journey.spec.ts` |
| Chat | Find on Ekum in connection pickers | Works | Unit | Required | Completeness 2026-08-27-phone-find-connect; name/mobile/GST; invite if phone miss |
| Chat | New chat sheet (＋ title, team select, Find link + share invite) | Works | Unit + Functional | Required | Completeness 2026-09-01-new-chat-sheet; other pickers keep field |
| Chat | New chat shops → Your team → name; Team on chat rows aligned | Works | Unit | Required | Completeness 2026-09-01-new-chat-team-step; no pills; one team CTA; ⋯ Team on chat only |
| Chat | Owner-only vs team labels on list/header | Rejected | — | Reject | 2026-09-01: no Team/Private word; owners-only default |
| Chat | Owner Private escalate (connected / Team thread) | Rejected | — | Reject | 2026-09-01: no second thread |
| Chat | Owners-only roster, mute, leave/rejoin, archive group | Works | Unit | Required | Completeness 2026-09-01-chat-membership; e2e `@chat` mute/＋ sheet; migrate `20260901120000_chat_membership` |
| Chat | Inbox select Archive / Clear / Delete (our shop only) | Works | Unit + Functional | Required | Completeness 2026-09-22-chats-inbox-select; `inboxHiddenAt`; not Leave |
| Chat | Inbox row long-press Pin/Mute/Archive/Clear/Delete | Works | Unit + Functional | Required | Completeness 2026-09-22-chats-inbox-row-menu; group **Exit group** = Leave; WA Lock/lists/Favourites/Block not copied |
| Chat | Mark unread · Archived folder · Draft on list · Timed mute | Works | Unit + Functional | Required | Completeness 2026-09-23-chats-whatsapp-nice Phase A; mute durations sit beside the floating menu (not a sheet); Starred on ⋯ 2026-09-24 |
| Chat | Seen · Typing · Pin message · Links · Reactions · Group photo | Works | Unit | Required | Completeness 2026-09-23-chats-phase-b; no websocket — poll + lastReadAt |
| Chat | @mention teammates on this chat + other shops | Works | Unit + Functional | Required | Completeness 2026-09-23-chat-mentions; no other-shop staff; mention beats mute |
| Chat | Group info page · share join link · add businesses | Works | Unit + Functional | Required | Completeness 2026-09-23-group-info; businesses not other-shop staff |
| Chat | Your team under group businesses | Works | Unit + Functional | Required | Completeness 2026-09-23-group-info-your-team; our people only |
| Chat | Owner Add / × on group Your team | Works | Functional | Required | Completeness 2026-09-23-group-info-team-manage |
| Chat | Quiet Share invite from ＋ (OS share apps) | Works | Functional | Required | Completeness 2026-09-23-group-invite-from-add |
| Chat | Group page camera · inline name · Add a line field | Works | Unit + Functional | Required | Completeness 2026-09-23-group-identity-inline; owners; no sheet |
| Chat | Group Media + Settings beside Businesses | Works | Unit + Functional | Required | Completeness 2026-09-23-group-info-media-settings; Photos/Documents/Designs/Collections; no Voice |
| Chat | Share catalog cards in thread | Works | Untested | Recommended | |
| Chat | WhatsApp open (unread divider / newest) | Works | Unit | Required | Completeness 2026-09-03-whatsapp-chat-open-locked-previews |
| Chat | Locked catalog thumbs blur (no viewer) | Works | Unit | Required | `imagesLocked` + PhotoAlbum locked |
| Chat | Message actions (Reply/Forward/Copy/Star/Edit/Delete) | Works | Unit | Required | Completeness 2026-09-03-chat-message-actions; no Select all; order teaser strip |
| Chat | Quote one photo in an album (reference, not Order) | Works | Unit | Required | Completeness 2026-09-23-quote-one-album-photo |
| Chat | Photo long-press opens Ekum actions menu | Works | Unit + Functional | Required | Completeness 2026-09-13-photo-longpress-menu; WA gesture, Ekum verbs |
| Collections | Pack Ask Allow/Deny (Granted on request) | Works | Unit | Required | Completeness 2026-09-03-collection-view-request-allow-deny; ≠ Connection |
| Orders | Core trade request→quote→accept | Works | Functional | Required | Green 2026-08-11 |
| Orders | BM-05 Accept quote gating | Works | Functional | Required | Green 2026-08-11; living-order-accept Completeness |
| Orders | Living upsert + `canAcceptQuote`/`hasSellerQuote` | Works | Unit + Functional | Required | Restored WIP 2026-08-11 |
| Orders | Orders More menu portal (Samples/Returns) | Works | Functional | Recommended | `orders.chrome.journey.spec.ts` |
| Orders | List tabs Pending / Completed + row Needs you (left accent + verb line) | Works | Unit + Functional | Required | Completeness 2026-09-19-orders-list-tabs; legacy `filter=needs|progress` → Pending |
| Orders | Buy/Sell is a temporary list filter (not account mode); one compact row | Works | Unit + Functional | Required | Completeness 2026-09-21-orders-buy-sell-temp-filter; in-memory session; reset off `/orders` |
| Orders | Qty box: delete / replace prefilled 20 (no snap-back) | Works | Unit | Required | Completeness 2026-09-25-qty-stepper-edit; draft is the input value |
| Orders / Catalog / Collections | QA ten: last-row BM-07, mill names on Trading only, drop standard/?, You date-only, 1 design, origin pack dock, sheet Dismiss, `/collections/new`, Chats aria | Works | Unit + Functional | Required | Completeness 2026-09-25-qa-ten-fixes; Who stays on create page |
| Orders | Place-order tabular lines (− editable qty + · Same for all chip · Add note) | Works | Unit + Functional | Required | Completeness 2026-09-20-place-order-line-chrome; HowManyEach + Order builder |
| Orders | Enter/Next on line qty jumps to next line qty | Works | Unit | Required | `orderQtyFocus`; How many each, builder, quote, mill, dispatch, return, edit |
| Orders | Place confirm = toast (no Done sheet) | Works | Unit | Required | Selection batch success → auto-dismiss toast (+ optional Open chat) |
| Orders | Order card +N thumbs | Works | Regression | Required | BM-01 |
| Orders | Line thumb → PhotoViewer (name + qty/rate), not Explore | Works | Unit + Functional | Required | Completeness 2026-09-20-order-thumb-photo-viewer |
| Orders | Living card dedupe helpers | Works | Unit-only | Required | BM-04 |
| Orders | Dispatch → settle (+ legacy deliver) | Works | Unit | Required | Completeness 2026-09-06-settle-order-trail; trail Timeline |
| Orders | Dispatch sheet on/off + packing PDF | Works | Unit | Required | Completeness 2026-09-21-dispatch-tabular; pending-only; share PDF after save |
| Orders | Confirm/decline lines: dispatch cards; off = decline; leftover qty at Dispatch | Works | Unit | Required | Completeness 2026-09-21-confirm-decline-lines |
| Orders | Pending qty clarity (partial ship + settle) | Works | Unit + Functional | Required | Completeness 2026-09-13-order-pending-qty-clarity; left→pending; Settle Dispatched\|Pending |
| Orders | Note + voice on every order update | Works | Unit | Required | Completeness 2026-09-06-order-update-voice-notes; Wave 2 of voice notes |
| Orders | Payment request (honour ask / Paid / Mark received) | Deferred | — | — | Removed from product 2026-09-21; order completes on dispatch; endpoints reject `PAYMENT_DISABLED` |
| Orders | Buy for buyer (log ticket; OTP Accept) | Works | Unit-only | Required | How many each Who; /o/:token |
| Collections | 48h share link | Works | Functional + Unit | Required | Presentable WhatsApp OG collage + seller copy 2026-09-11; multi-design kind `designs` 2026-09-16; mix keeps N doors 2026-09-24; `share-link.journey` |
| Explore / Catalog | Grouped designs share (chat collage + 48h, not a Collection) | Works | Unit | Required | Completeness 2026-09-16; viewer + shop line 2026-09-24; virtual set `/designs/set` |
| Orders | Photo order / amend / samples / returns | Partial | Unit + Functional | Future | Chat ＋ Photo order prefills that shop (editable) 2026-09-24; Raise return Select all / Clear + living chat Return pulse 2026-09-07 |
| Orders | Leave guard (photo order + builders) | Works | Unit + Functional | Required | Completeness 2026-08-24-discard-guard; shared sheet |
| Orders | Trade without connection | Rejected | — | Reject | Trust ladder |
| Collections | Buyer view Wedding Edit + shortlist clear | Works | Functional | Required | Green 2026-08-11 (BM-03) |
| Collections | Seller create photos-first + cover tag | Works | Unit | Required | Slice 1 2026-08-12; Photos = ContinuousCamera like Add designs (2026-09-11) |
| Collections | Create polish (9-cap grid, publish-first, tags, no Everyone, tile→design sheet) | Works | Unit | Required | Completeness 2026-09-17-collection-create-polish |
| Collections | Same for all + photos-first + rate range + unlimited design photos | Works | Unit + Functional | Required | Completeness 2026-09-18-collection-same-for-all-ux-simplify; Done = new photos only; library Diff; `collection.publish.journey` |
| Collections | New collection redesign (always-visible · 3 expandables · Settings defaults · sticky / hide nav · merge Diff · piecesPerPack · allowDownload) | Works | Unit + Functional | Required | Completeness 2026-09-24-new-collection-redesign |
| Collections | New collection add-and-go (photos + name; Who on Publish sheet) | Redesign | Functional | Required | Completeness 2026-09-24-collection-who-tags-set-size; Who expandable; pack tags append; set-size only for set |
| Collections | Seller create/publish / quick-add (edit) | Works | Functional | Recommended | `collection.publish.journey.spec.ts` |
| Collections | Buyer groups (elevate broadcast lists) | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Relist lock (usual → group → sheet + API); Forward free | Works | Unit | Required | Completeness 2026-09-03-forward-free-view-on-open; Share = live+not-blocked (no sender canDiscover); Curate still locked; in-sheet Share errors |
| Collections | QA: visibility CTA, Explore bump, chat-share discoverable, 2-tile mosaic, owner From on viewer | Works | Unit | Required | Completeness 2026-09-03-collection-qa-fixes; Share=chats not broadcast |
| Collections | Pack publish does not Explore-post member designs | Works | Unit | Required | Completeness 2026-09-11-collection-publish-no-design-explore |
| Explore / Catalog | Multi-buyer Share sheet (1·many companies, Find on Ekum, Clear, 48h link; no buyer groups) | Works | Unit | Required | Completeness 2026-09-11-multi-buyer-catalog-share |
| Collections | Uniform album chrome + find My designs (Select+primary+⋯; no Catalog tab) | Works | Unit | Required | Completeness 2026-09-03-uniform-album-chrome |
| Collections | Curated pack visitor Ask rates / Order sticky dock | Works | Unit | Required | Completeness 2026-09-24-pack-trade-dock; match design page |
| Explore | Design page Ask / Order dock visitors only | Works | Unit | Required | Owner never gets dock (even Selling/Trading); `exploreProductChrome` |
| Catalog | My designs select **Hide · draft** (published designs + packs) | Works | Unit | Required | Completeness 2026-09-03-hide-and-curate-existing |
| Trader curation | Curate **Add to existing pack** (merge; draft→editor / published toast) | Works | Unit | Required | Completeness 2026-09-03-hide-and-curate-existing; saved.md |
| Collections | Ready status + seller badges/filters | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Live window startsAt/endsAt + expire | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Seller informed catalog (collage + viewer) | Works | Unit | Required | 2026-08-13 Completeness |
| Explore | Browse seeded + open detail | Works | Functional | Required | Green 2026-08-11 |
| Explore | Filter dismiss BM-02 | Works | Functional | Required | Green 2026-08-11 |
| Explore | Federated search / follow feed | Works | Untested | Future | |
| Explore | Businesses for you + Stories rail | Works | Unit | Recommended | Stories = follow/connected + published (Slice C) |
| Explore | Trade-side Buying / Selling (no All chip) | Works | Unit | Required | 2026-08-23 filter panels; dual Explore Buyers / Explore Suppliers; default Buying |
| Explore | Filter: Change View + multi category/city | Works | Unit + Functional | Required | Popup B; Confirm closes; pin selected on reopen |
| Explore | Search chrome: filter only (no Saved / Selection squares) | Works | Functional | Required | Completeness 2026-09-23-explore-chrome-cut; floater + You → Saved |
| Explore | Search hint: no GST (idle + field same line) | Works | Unit + Functional | Optional | Completeness 2026-09-24-explore-search-no-gst |
| Explore | Category copy: Women’s apparel not womens_apparel | Works | Unit | Required | categoryDisplayLabel on feed / search / design / shop |
| Explore | Hide solo design when live pack on same feed already has it; design card first photo | Works | Unit | Required | Completeness 2026-09-25-explore-pack-covered-designs |
| Explore | Buying: Following-first posts + received by day/business | Works | Unit | Required | Slice C; not mixed into market ranking |
| Explore | Selling: Buyers for you (not My Catalog) | Works | Unit | Required | Buyers shelf on Selling / All when you sell |
| Explore | Vanity likes ranking | Rejected | — | Reject | |
| Team | Invite staff + five caps + owner-only chat | Works | Unit | Required | You → Team; `/t/:token` join; staff seed +919800000004 |
| Team | Join after archive (same phone → new shop / create company) | Works | Unit | Required | Completeness 2026-09-09-team-join-after-archive; live seat still blocks |
| Network | Following / Followers lists | Works | Unit-only | Required | You → Network hub pages restored 2026-08-20 |
| Network | Follow-ask extra gate (look / pack / deny) | Works | Unit + Functional | Required | Completeness 2026-09-24-follow-ask; pending ≠ audience |
| Company | Shop profile chrome (hero + 2-col photos) | Works | Unit + Functional | Required | Completeness 2026-09-23-company-profile-shop-chrome; no names on cells; no collection cover |
| Network | Connections hub (both roles) + Requests | Works | Functional | Required | Mutual pair; Open chat also Approves pending access — Completeness 2026-09-16-chat-open-access-approve |
| Referrals | Connect-with-me invite create + Share/Copy | Works | Functional + Unit | Required | Presentable OG + ＋ one-tap share 2026-09-11; `network.referrals.journey` |
| Referrals | Open invite redeem → access request (approve gate) | Works | Functional | Required | Focused `/r/` landing (no bottom nav); `network.referrals.journey.spec.ts` |
| Referrals | Login/onboarding return path (`?invite=` / `/r/:token`) | Works | Unit-only | Required | `inviteReturn` + Login/onboarding wiring |
| Referrals | Targeted vouch (optional target company) | Works | Untested | Recommended | Seller still approves |
| Referrals | Auto-connect / auto-follow on redeem | Rejected | — | Reject | Trust ladder |
| Trader curation | Dual network (suppliers + buyers) via Connections/Follow | Partial | Untested | Required | Platform 1-hop; long chain possible |
| Trader curation | Multi-supplier pick → curated collection for buyers | Works | Functional | Required | Slice A; C1 e2e `curate.multi-supplier.journey`; see `docs/features/saved.md` |
| Trader curation | Saved hub (design + collection **references**) | Works | Functional | Required | `saved.journey.spec.ts`; API `saved.service.spec` |
| Browse | Voice: WhatsApp chat hold-to-send + order create/quote notes (text and/or voice); media Audio | Partial | Unit | Required | Wave 1 shipped; payment/return notes = wave 2. Spec 2026-09-05-voice |
| Trader curation | Curate within original seller permission (forward/audience) | Works | Unit-only | Required | Slice A; `curation-ceiling` + collection membership specs |
| Trader curation | Deliver curated pack (broadcast / chat) | Partial | Untested | Required | Broadcast exists |
| Trader curation | Home: received curated packs (attention) | Works | Unit | Required | Slice C; New packs 7 days / cap 5 |
| UI | Home attention-center composition (count + compact metrics + need rows) | Works | Unit + Functional | Recommended | Completeness 2026-09-10-home-attention-center; presentation only |
| UI | Your selection visual polish (image-led rows; Order primary) | Works | Unit + Functional | Recommended | Completeness 2026-09-10-selection-visual-polish; no model change |
| UI | Order flow sheets visual polish (resolve + quantity) | Works | Functional + Visual | Recommended | Completeness 2026-09-10-order-flow-visual-polish; presentation only |
| UI | Long-press select without Safari link menu | Works | Unit + Functional | Required | Completeness 2026-09-10; Android stickiness 2026-09-12-explore-longpress-select-stays |
| UI | Send quote qty/rate numbers not clipped (BM-07) | Works | Unit | Required | textInputChromeClass + wider quote columns |
| UI | Chats visual polish (restrained teal 3+1 cards + list hierarchy) | Works | Unit | Recommended | Completeness 2026-09-11-chats-visual-polish; presentation only |
| UI | Chat trade cards: same surface in/out (no mine solid teal) | Superseded | — | — | Replaced by direction surface rule |
| UI | Chat trade cards: direction owns surface (in light / out teal) | Works | Unit + visual | Required | Completeness 2026-09-11-chats-direction-surface-rule |
| UI | Home / Chats / Orders hierarchy (action / object / order facts) | Works | Unit | Recommended | Completeness 2026-09-10-home-chats-orders-hierarchy; presentation only |
| Trader curation | Explore Buying: received by day/business | Works | Unit | Required | Slice C; directed audience or broadcast |
| Trader curation | Split order by product’s real supplier | Works | Unit | Required | Slice B; batch + Manage upstream |
| Trader curation | Dual trade: pay/order upstream + sell/send orders to buyers | Works | Unit | Required | Shipped: Direct vs I handle + Send-hold. Product Redesign 2026-09-02: TradeLane ticket × reveal |
| Trader curation | I-handle desk: mill Send on card + Timeline (You sent to); Send quote / Decline / dispatch / settle on the face; mill subsets + # after Send; Hold; Trading filter; From/To rates | Works | Unit + Functional | Required | Completeness 2026-09-07-trader-i-handle-desk + 2026-09-20-trader-mill-send-face + 2026-09-20-mill-send-timeline + 2026-09-23-desk-no-more-actions |
| Trader curation | Decline beside mill Send (held hop only) | Works | Unit + Functional | Required | Completeness 2026-09-23-mill-decline-beside-send; confirm; other mills stay |
| Trader curation | Send all waiting mills (2+) | Works | Unit | Required | Completeness 2026-09-23-mill-send-all; no mill-picker sheet |
| Trader curation | Decline all waiting mills (2+) | Works | Unit | Required | Completeness 2026-09-23-mill-decline-all; confirm; pair with Send all |
| Trader curation | Order action dock above nav | Works | Unit | Required | Completeness 2026-09-23-order-action-dock + dock-confirm + buyer-action-dock; buyer Cancel/Edit/Accept quote |
| Trader curation | Shared Direct: no seller confirm/quote until Handle myself | Works | Unit | Required | Completeness 2026-09-20-direct-shared-seller-ctas; gate on sellerCompanyId |
| Orders quote | Same for all + line Rate: one ₹, digits not clipped | Works | Unit | Required | Completeness 2026-09-20-quote-rate-single; no catalog range |
| Orders quote | Can’t supply stays on Send quote (checked on reopen) | Works | Unit | Required | Completeness 2026-09-20-quote-cant-supply-stays |
| Orders quote | Can’t supply grays Declined; untick restores; re-quote can re-open | Works | Unit | Required | Completeness 2026-09-20-quote-cant-supply-untick |
| Orders quote | Declined mutes design only; Can’t supply stays live contrast | Works | Unit | Required | Completeness 2026-09-20-quote-cant-supply-control |
| Orders quote | Order page shows Can’t supply (gray) without opening Send quote | Works | Unit | Required | Completeness 2026-09-20-order-page-cant-supply |
| Orders quote | Same for all on Send quote + mill Send (rates only; per-line qty) | Works | Unit | Required | Completeness 2026-09-20-quote-same-rate-only; replaces Rate all field |
| Orders place | Same for all qty focuses + selects the piece box | Works | Unit | Required | Completeness 2026-09-23-same-for-all-qty-autofocus |
| Orders place | How many each: thumb viewer, qty right, sticky Place order | Works | Unit | Required | Completeness 2026-09-23-how-many-each-row-layout |
| Orders place | Mixed Selection: split banner + × syncs pile | Works | Unit | Required | sr 42; `howManySplitBanner`; Selection `onRemoveProduct` |
| Collections | Pack “Order goes to trader” follows Your paths ticket | Works | Unit | Required | sr 16; `viewerTicket` + `collectionShowHandleCopy` |
| Orders place | How many each: tags + sold-as (Set / Dozen / Metre) · min · rate | Works | Unit | Required | Completeness 2026-09-24-how-many-line-meta; hydrate explore detail |
| Orders / Catalog | Pack size (sets) per design, not one shop rule | Missing | — | Required | Completeness 2026-09-23-order-pack-size — model locked, build later |
| Orders close | Full dispatch → `dispatched` complete; Settle only on qty mismatch → `settled` | Works | Unit | Required | Completeness 2026-09-07-dispatch-complete-vs-settle |
| Orders part ship | Partial dispatch → main status `part_shipped` (not Confirmed cue) | Works | Unit | Required | Completeness 2026-09-07-part-shipped-main-status |
| I-handle soft-hide | Parent ticket/chat never shows upstream mill names (chain-safe) | Works | Unit | Required | Completeness 2026-09-07-i-handle-no-upstream-names |
| Trader curation | TradeLane: first pair I handle + no group; **Buyer talks to** closed pick + **Share a group**; Your paths | Works | Unit + Functional | Required | Completeness your-paths + 2026-09-23-path-picker-wording; pack path stamp ignored |
| Trader curation | Reveal trio: subset card only (not main); one group per mill | Works | Unit | Required | Completeness 2026-09-08-trio-subset-card |
| Trader curation | Multi-supplier journey matrix (publish→curate→I-handle/Direct) | Review | Manual + Functional (C1·D1·D3 Pass) | Required | `docs/superpowers/reviews/2026-09-08-multi-supplier-journey-matrix.md`; C1 `curate.multi-supplier`; D1·D3 `orders.from-pack-multi` |
| Trader curation | Unified main + linked lots (Direct = same desk, not N batch) | Works | Unit + Functional | Required | Place always from-pack. **D12 Pass:** Mills = observe on main |
| Trader curation | Middleman in-loop + optional anonymity (multi-hop) | Later | — | Future | Reveal off = hide tickets only; no hard Connection/chat block. Multi-hop later |
| Trader curation | Trader attention UX (buy / curate / share / follow-up) | Missing | — | Required | WhatsApp-simple |
| Trader curation | Trader insights (vendor↔trader analytics) | Later | — | Future | |
| Trader curation | Dedicated Trader role at OTP | Rejected | — | Reject | One company account |
| Trader curation | Trader/Seller badges on Explore | Rejected | — | Reject | Opaque businesses |
| Trader curation | Home-only dense day/trader share analytics | Rejected | — | Reject | Use Explore Buying + Home attention |
| Media | Chat photo send | Works | Functional | Required | Green 2026-08-11 |
| Media | Shared WhatsApp-style photo viewer (pinch/zoom) | Works | Unit | Required | Completeness 2026-08-21; kit + chat + sheets + Explore design |
| Catalog | Batch Add designs: SKU thumbs, 1 vs 2+ details, sheet always-open details | Works | Unit + Functional | Required | Completeness 2026-09-02-add-designs; not filename names; no chips |
| Explore | Select preserves Design+Collection; Order resolves albums; Share/Bookmark keep types | Works | Unit | Required | Completeness 2026-09-03-explore-select-preserve-types; types preserved |
| Browse | Selection workspace `/selection` + floater; multi-surface; survive logout; unavailable fade; My designs **To selection** (no auto-mirror); published-only traveling Selection | Works | Unit + Functional | Required | Completeness 2026-09-03-selection-workspace + 2026-09-04-own-catalog-handoff; verbs on Your selection; hide nav 2026-09-23; floater Order 2026-09-24; list fade ≠ curate-check 2026-09-24; hide floater on order/design/pack docks 2026-09-25 |
| Browse | Company shop: this-seller Order · Curate · Ask dock; Share profile (chat + OS); hide nav while dock up | Works | Unit + Functional | Required | Completeness 2026-09-23-company-shop-trade-share; one pile, shop-scoped act |
| Browse | Company shop Collections: Explore mosaic + name; Select + same dock (resolve albums) | Works | Unit + Functional | Required | Completeness 2026-09-24-company-shop-collections |
| Browse | Collection mosaic +N = leftover designs (not extra photos) | Works | Unit | Required | Completeness 2026-09-24-collection-mosaic-plus; 5 designs → +1 |
| Collections | No pack cover — collage is member design thumbs only | Works | Unit + Functional | Required | Completeness 2026-09-24-no-collection-cover; `coverImage` silent fallback only |
| Browse | Shop Designs = unique pack members + Explore posts | Works | Unit | Required | Completeness 2026-09-24-shop-unique-pack-designs |
| Browse | Shop Feed / Grid (shared with Saved · album · My designs) | Works | Unit | Required | Completeness 2026-09-24-shop-feed-grid |
| Browse | Open collection / design while Selecting (name always opens; photo toggles) | Works | Unit + Functional | Required | Completeness 2026-09-24-browse-open-while-selecting; Explore + shop + album + Saved |
| Browse | Selection availability = access only (album members without market post stay orderable) | Works | Unit | Required | Completeness 2026-09-07-selection-access-availability; explore productDetail + TradeAccess |
| Trader curation | Curate albums like Order (whole pack / pick); designs as-is; gray locked (Slice A) | Works | Unit + Functional | Required | Completeness 2026-09-04-curate-album-as-is; Save draft primary; no Ask in A |
| Trader curation | Own-name clash → Add to it; gray not-visible; no empty draft; supplier names OK | Works | Unit | Required | Completeness 2026-09-24-curate-pack-errors |
| Trader curation | Curated pack fades members when the mill ends the design (not album edit) | Works | Unit | Required | Completeness 2026-09-24-curated-member-source-ended |
| Trader curation | Ask supplier pack permission (Allow/Deny + product relist grant) (Slice B) | Works | Unit + Functional | Required | Completeness 2026-09-08-relist-ask-slice-b; distinct from view Ask |
| Trader curation | Desk-chain Ask (via pack → desk; mill listing → mill; publish allow gates buyers) | Works | Unit + Functional | Required | Completeness 2026-09-09-relist-desk-chain; agent role Later |
| Media | Catalog design upload | Works | Untested | Future | |
| Media | Top-level Media tab | Rejected | — | Reject | |
| Media | Upload failure UX | Partial | Untested | Recommended | |
| Platform | PWA **New version · Load** (no silent reload) | Works | Unit | Required | Completeness 2026-09-23-pwa-update-prompt; HS one-shot after login only (2026-09-25-login-phone-type); chunk-404 Later |
| You / Settings | You: identity + library; Edit ≠ Share ≠ Settings; Settings domain cards (Business & Roles · Dispatch · Billing) | Works | Unit + Functional | Required | Completeness 2026-09-24-you-identity-settings-domains + you-profile-settings + you-chrome-pairs; `/catalog` → You |
| You / Shop | Find designs / collections in place (You library + shop) | Works | Unit + Functional | Required | Completeness 2026-09-24-you-shop-catalog-search; on-demand icon 2026-09-24-collection-on-demand-find; shop first page only (G-001 Later) |
| Collections | Album / list find (tags, design name, notes, SKU; not a permanent bar) | Works | Unit + Functional | Required | Completeness 2026-09-24-collection-on-demand-find |

| Collections | Fixed select bar clips last card (BM-07) | Works | Untested (manual fix 2026-08-11) | Required | Padding clears nav + bar; add regression when practical |
| Browse | Select all float as soon as select starts | Works | Unit | Required | Completeness 2026-08-21; spec select-all-float; not on Explore |

## Doc drift

- Design spec “Problem” section historically stale vs Wave 1 — check status line.
- UI chrome clearance is now Required in `ui-quality-bar` §2b / Completeness mobile checklist.
- Referrals / Share invite: product rules in `docs/features/referrals.md`; no Completeness review under `docs/superpowers/reviews/completeness/` yet (matrix tracks Required + Untested).
- Trader curation / platform chain: [mvp-garmenthub-gap-matrix.md](./mvp-garmenthub-gap-matrix.md); [slice-a design](../specs/2026-08-19-trader-curation-slice-a-design.md) (**Implemented**); product walkthrough in [saved.md](../features/saved.md). Slices B–D remain; dual trade order linking = B.
