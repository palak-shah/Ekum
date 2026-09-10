# Feature gap matrix

**Updated:** 2026-09-10  
**Source:** Completeness reviews under `docs/superpowers/reviews/completeness/`  
**Tracks:** Regression (`@smoke @regression` / BM-* units) · Functional (`@functional`)

Product status: Works · Partial · Missing · Later · Rejected · Redesign  
Verification: Functional · Regression · Unit-only · Untested

| Module | Capability | Product status | Verification | Completeness priority | Notes |
|--------|------------|----------------|--------------|----------------------|-------|
| Auth | Stay signed in until Logout (10y sliding refresh) | Works | Unit-only | Required | Completeness 2026-08-31-stay-signed-in; OTP only Logout / wipe / INVALID_TOKEN |
| Chat | Seeded thread text send | Works | Functional + Regression | Required | Green 2026-08-11 |
| Chat | In-thread search scopes + stepper | Works | Functional | Required | Green 2026-08-24: All/Photos/Collections/Designs/Orders |
| Chat | Thread list `view`/`q` API + index | Works | Unit + Functional | Required | Restored WIP 2026-08-11; Completeness thread-message-filters |
| Chat | Inbox deep search + why-line | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-search-deep; `GET /threads?q=` |
| Chat | Attach search + multi-share | Works | Unit + Functional | Required | Completeness 2026-08-24-chat-attach-multi-share |
| Chat | Leave guard (composer / attach WIP) | Works | Functional | Required | Completeness 2026-08-24-discard-guard |
| Chat | Requests inbox (unconnected) | Works | Functional | Recommended | `chat.requests.journey.spec.ts` |
| Chat | Find on Ekum in connection pickers | Works | Unit | Required | Completeness 2026-08-27-phone-find-connect; name/mobile/GST; invite if phone miss |
| Chat | New chat sheet (＋ title, team select, Find link + share invite) | Works | Unit + Functional | Required | Completeness 2026-09-01-new-chat-sheet; other pickers keep field |
| Chat | New chat shops → Your team → name; Team on chat rows aligned | Works | Unit | Required | Completeness 2026-09-01-new-chat-team-step; no pills; one team CTA; ⋯ Team on chat only |
| Chat | Owner-only vs team labels on list/header | Rejected | — | Reject | 2026-09-01: no Team/Private word; owners-only default |
| Chat | Owner Private escalate (connected / Team thread) | Rejected | — | Reject | 2026-09-01: no second thread |
| Chat | Owners-only roster, mute, leave/rejoin, archive group | Works | Unit | Required | Completeness 2026-09-01-chat-membership; e2e `@chat` mute/＋ sheet; migrate `20260901120000_chat_membership` |
| Chat | Pin | Works | Untested | Recommended | ⋯ Pin chat |
| Chat | Share catalog cards in thread | Works | Untested | Recommended | |
| Chat | WhatsApp open (unread divider / newest) | Works | Unit | Required | Completeness 2026-09-03-whatsapp-chat-open-locked-previews |
| Chat | Locked catalog thumbs blur (no viewer) | Works | Unit | Required | `imagesLocked` + PhotoAlbum locked |
| Chat | Message actions (Reply/Forward/Copy/Star/Edit/Delete) | Works | Unit | Required | Completeness 2026-09-03-chat-message-actions; no Select all; order teaser strip |
| Collections | Pack Ask Allow/Deny (Granted on request) | Works | Unit | Required | Completeness 2026-09-03-collection-view-request-allow-deny; ≠ Connection |
| Orders | Core trade request→quote→accept | Works | Functional | Required | Green 2026-08-11 |
| Orders | BM-05 Accept quote gating | Works | Functional | Required | Green 2026-08-11; living-order-accept Completeness |
| Orders | Living upsert + `canAcceptQuote`/`hasSellerQuote` | Works | Unit + Functional | Required | Restored WIP 2026-08-11 |
| Orders | Orders More menu portal (Samples/Returns) | Works | Functional | Recommended | `orders.chrome.journey.spec.ts` |
| Orders | Order card +N thumbs | Works | Regression | Required | BM-01 |
| Orders | Living card dedupe helpers | Works | Unit-only | Required | BM-04 |
| Orders | Dispatch → settle (+ legacy deliver) | Works | Unit | Required | Completeness 2026-09-06-settle-order-trail; trail Timeline |
| Orders | Note + voice on every order update | Works | Unit | Required | Completeness 2026-09-06-order-update-voice-notes; Wave 2 of voice notes |
| Orders | Payment request (honour ask / Paid / Mark received) | Works | Unit-only | Required | Completeness 2026-08-22; no gateway |
| Orders | Buy for buyer (log ticket; OTP Accept) | Works | Unit-only | Required | How many each Who; /o/:token |
| Collections | 48h share link | Works | Functional | Required | `share-link.journey.spec.ts` guest → login → collection |
| Orders | Photo order / amend / samples / returns | Partial | Unit | Future | Raise return Select all / Clear + living chat Return pulse 2026-09-07 |
| Orders | Leave guard (photo order + builders) | Works | Unit + Functional | Required | Completeness 2026-08-24-discard-guard; shared sheet |
| Orders | Trade without connection | Rejected | — | Reject | Trust ladder |
| Collections | Buyer view Wedding Edit + shortlist clear | Works | Functional | Required | Green 2026-08-11 (BM-03) |
| Collections | Seller create photos-first + cover tag | Works | Unit | Required | Slice 1 2026-08-12; functional journey Recommended next |
| Collections | Seller create/publish / quick-add (edit) | Works | Functional | Recommended | `collection.publish.journey.spec.ts` |
| Collections | Buyer groups (elevate broadcast lists) | Works | Unit | Required | 2026-08-13 Completeness |
| Collections | Relist lock (usual → group → sheet + API); Forward free | Works | Unit | Required | Completeness 2026-09-03-forward-free-view-on-open; Share = live+not-blocked (no sender canDiscover); Curate still locked; in-sheet Share errors |
| Collections | QA: visibility CTA, Explore bump, chat-share discoverable, 2-tile mosaic, owner From on viewer | Works | Unit | Required | Completeness 2026-09-03-collection-qa-fixes; Share=chats not broadcast |
| Collections | Uniform album chrome + find My designs (Select+primary+⋯; no Catalog tab) | Works | Unit | Required | Completeness 2026-09-03-uniform-album-chrome |
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
| Explore | Buying: Following-first posts + received by day/business | Works | Unit | Required | Slice C; not mixed into market ranking |
| Explore | Selling: Buyers for you (not My Catalog) | Works | Unit | Required | Buyers shelf on Selling / All when you sell |
| Explore | Vanity likes ranking | Rejected | — | Reject | |
| Team | Invite staff + five caps + owner-only chat | Works | Unit | Required | You → Team; `/t/:token` join; staff seed +919800000004 |
| Team | Join after archive (same phone → new shop / create company) | Works | Unit | Required | Completeness 2026-09-09-team-join-after-archive; live seat still blocks |
| Network | Following / Followers lists | Works | Unit-only | Required | You → Network hub pages restored 2026-08-20 |
| Network | Connections hub (both roles) + Requests | Works | Functional | Required | `network.referrals.journey.spec.ts` |
| Referrals | Connect-with-me invite create + Share/Copy | Works | Functional | Required | `network.referrals.journey.spec.ts` |
| Referrals | Open invite redeem → access request (approve gate) | Works | Functional | Required | `network.referrals.journey.spec.ts` guest login path |
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
| UI | Home / Chats / Orders hierarchy (action / object / order facts) | Works | Unit | Recommended | Completeness 2026-09-10-home-chats-orders-hierarchy; presentation only |
| Trader curation | Explore Buying: received by day/business | Works | Unit | Required | Slice C; directed audience or broadcast |
| Trader curation | Split order by product’s real supplier | Works | Unit | Required | Slice B; batch + Manage upstream |
| Trader curation | Dual trade: pay/order upstream + sell/send orders to buyers | Works | Unit | Required | Shipped: Direct vs I handle + Send-hold. Product Redesign 2026-09-02: TradeLane ticket × reveal |
| Trader curation | I-handle desk: one buyer row; mill subsets + # after Send; quote gate; Hold; list/Find Trading filter; From/To rates; fulfillment under Take over after accept | Works | Unit + Functional | Required | Completeness 2026-09-07-trader-i-handle-desk + from-to-rates + take-over-fulfillment |
| Orders quote | Rate all on Send quote + mill Send (per-line rates always) | Works | Unit | Required | Completeness 2026-09-08-rate-all-quote; supersedes same-rate chips |
| Orders close | Full dispatch → `dispatched` complete; Settle only on qty mismatch → `settled` | Works | Unit | Required | Completeness 2026-09-07-dispatch-complete-vs-settle |
| Orders part ship | Partial dispatch → main status `part_shipped` (not Confirmed cue) | Works | Unit | Required | Completeness 2026-09-07-part-shipped-main-status |
| I-handle soft-hide | Parent ticket/chat never shows upstream mill names (chain-safe) | Works | Unit | Required | Completeness 2026-09-07-i-handle-no-upstream-names |
| Trader curation | TradeLane: first pair I handle + no group; two switches; Your paths | Works | Unit + Functional | Required | Completeness your-paths + remove-profile-order-path + purge-collection-order-path; pack path stamp ignored |
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
| Browse | Selection workspace `/selection` + floater; multi-surface; survive logout; unavailable fade; My designs **To selection** (no auto-mirror); published-only traveling Selection | Works | Unit + Functional | Required | Completeness 2026-09-03-selection-workspace + 2026-09-04-own-catalog-handoff; verbs on Your selection |
| Browse | Selection availability = access only (album members without market post stay orderable) | Works | Unit | Required | Completeness 2026-09-07-selection-access-availability; explore productDetail + TradeAccess |
| Trader curation | Curate albums like Order (whole pack / pick); designs as-is; gray locked (Slice A) | Works | Unit + Functional | Required | Completeness 2026-09-04-curate-album-as-is; Save draft primary; no Ask in A |
| Trader curation | Ask supplier pack permission (Allow/Deny + product relist grant) (Slice B) | Works | Unit + Functional | Required | Completeness 2026-09-08-relist-ask-slice-b; distinct from view Ask |
| Trader curation | Desk-chain Ask (via pack → desk; mill listing → mill; publish allow gates buyers) | Works | Unit + Functional | Required | Completeness 2026-09-09-relist-desk-chain; agent role Later |
| Media | Catalog design upload | Works | Untested | Future | |
| Media | Top-level Media tab | Rejected | — | Reject | |
| Media | Upload failure UX | Partial | Untested | Recommended | |

| Collections | Fixed select bar clips last card (BM-07) | Works | Untested (manual fix 2026-08-11) | Required | Padding clears nav + bar; add regression when practical |
| Browse | Select all float as soon as select starts | Works | Unit | Required | Completeness 2026-08-21; spec select-all-float; not on Explore |

## Doc drift

- Design spec “Problem” section historically stale vs Wave 1 — check status line.
- UI chrome clearance is now Required in `ui-quality-bar` §2b / Completeness mobile checklist.
- Referrals / Share invite: product rules in `docs/features/referrals.md`; no Completeness review under `docs/superpowers/reviews/completeness/` yet (matrix tracks Required + Untested).
- Trader curation / platform chain: [mvp-garmenthub-gap-matrix.md](./mvp-garmenthub-gap-matrix.md); [slice-a design](../specs/2026-08-19-trader-curation-slice-a-design.md) (**Implemented**); product walkthrough in [saved.md](../features/saved.md). Slices B–D remain; dual trade order linking = B.
