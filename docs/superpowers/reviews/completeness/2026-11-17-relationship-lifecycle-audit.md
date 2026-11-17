# Feature Completeness Review — Relationship Lifecycle (Iteration 4D)

**Date:** 2026-11-17  
**Module / ask:** Audit-only — Follow / Connect / Message Accept / Unfollow / Remove Connection / look→pack / collection revoke / Phone+Place visibility. No UI/API/schema changes in this slice.  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/access-and-connections.md`, `docs/features/orders.md`, `docs/features/company.md`; prior `2026-11-17-business-network-experience-audit`, `2026-11-17-bilateral-company-block-completeness`  
**Disposition:** Proceed (audit / lock findings). Product locks + engineering shipped in Iteration **4E** (see gap statuses below).

> Completeness keeps Ekum coherent. Do **not** merge Follow and Connection. Block remains a separate directed op (Iteration 4C).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Happy paths for Follow Accept, Connect/Message → Connection-only, and Unfollow-keeps-Connection are coherent. The glossary still names **Remove connection** as a real action, but nothing ships it — Block is the only “end communicate” control and it wipes Follows. |
| UX Designer | Desks are right (Followers Asked + Chats Requests). Ignore on Connect threads looks like Reject but only archives chat. Traders can believe they refused a Connect ask while the AccessRequest stays pending. |
| Solution Architect | Dual approve paths (thread Accept vs unused `/access-requests/:id/*`). Message send can Active a Pending participant without Connection (UI blocks compose; API footgun). Place Direct has triple `pathForPair` + from-pack skip of buyer-follow. |

---

## Locked relationship model (reaffirm)

| # | Rule | Code today |
|---|------|------------|
| 1 | Follow Accept → Follow **+** Active Connection | `FollowService.decide` → `ensureActiveConnectionUnlessBlocked` |
| 2 | Connect Approve → Connection **only** | `AccessService.finalizeApprove` / thread Accept |
| 3 | Message Accept → Connection **only** | `ThreadService.accept` |
| 4 | Unfollow → delete Follow; Connection stays | `FollowService.unfollow` |
| 5 | Connection alone ≠ packs / Private unlock | Audience + profile gates on Allowed Follow |
| 6 | Block → wipe Follows; Unblock ≠ restore look/pack | Bilateral `CompanyBlock` (4C) |

---

## Platform consistency (required)

1. **Existing patterns?** Network Following/Followers/Connections; Chats Requests for Connect/first message; Followers Asked for Follow. Match.
2. **Duplicates?** Dual Connect approve APIs (thread vs access-request) — only thread is wired in web.
3. **Reuse?** Block reused as “end communicate” because Remove connection is missing — conflates silent restrict with soft disconnect.
4. **Naming?** 4B locked Follow / Unfollow / Ask to connect / Ask to repost. **Remove connection** still in glossary with no surface.
5. **Units?** N/A.

**Philosophy conflict?** Soft — docs imply Remove connection exists as a non-Block path; product may intend Block-only. Resolve before building disconnect.

---

## Scenario matrix (8 cases)

Legend: **works** · **partial** · **gap** · **product Q**

### 1. Follow approval and rejection — **works**

| Hop | Behavior | Status |
|-----|----------|--------|
| Ask | `POST /follows` → pending; blocked target 404 | works |
| Accept look/pack | Allowed + Connection (unless blocked) + pending Direct activate; follower notify | works |
| Reject pending | Delete row; silent | works |
| Stop allowed | `deny` → Stopped; silent; card stays | works |
| Accept while either Block edge | Follow Allowed; Connection **skipped** | product Q (G-004) |

**Surfaces:** Followers Asked, Chats Requests (`FollowAskDecideRow`), shop/Explore Follow.  
**Notify who:** follower on Accept only; Reject silent. Approver toast **Accepted**.

### 2. Connect approval and rejection — **partial**

| Hop | Behavior | Status |
|-----|----------|--------|
| Ask | `POST /access-requests` + pending Direct + intro | works |
| Approve (UI) | `POST /threads/:id/accept` → Connection only; notify requester | works |
| Decline API | `POST /access-requests/:id/decline` silent | works, **unused by web** |
| Ignore (UI) | `POST /threads/:id/decline` → archive participant only | partial — AccessRequest can stay **pending** (G-002) |

**Surfaces:** Find **Ask to connect**; desk = Chats Requests (not Network). Toast **Connected**.

### 3. Message acceptance — **works** (UI) / **API footgun**

| Hop | Behavior | Status |
|-----|----------|--------|
| First Direct | Counterpart Pending; composer off until Approve | works |
| Approve | Connection only (`ensureActiveConnection` if no access row) | works |
| Ignore | Archive; silent; no Connection | works |
| API send while Pending | Flips participant Active **without** Connection | gap (G-005) — web cannot compose |

### 4. Unfollow while Connection remains — **works**

| Surface | After `DELETE /follows` | Status |
|---------|------------------------|--------|
| Explore Followers packs / feed | Gone | works |
| Private profile | Stub again | works |
| Chat / phones / Place prefer | Stay via Active Connection | works |
| Direct Link rows | Kept; `shareActive` false until Pack | works |
| Notifications | Silent (no Repost-off chat line) | works |

Shop ⋯ **Unfollow** and Following list — not Remove connection (4B TG-02).

### 5. Remove Connection while Follow remains — **gap / not built**

| Expected (docs glossary) | Actual | Status |
|--------------------------|--------|--------|
| End Connection; keep Follow | No disconnect API on `ConnectionController` | gap (G-001) |
| Connections list | Block / Unblock / legacy Resume only | gap |
| Soft end communicate without Follow wipe | Only Block (wipes Follows) | product Q |

**Cannot test** the intended matrix until product locks: build Remove connection **or** drop it from glossary and document Block as the only end.

### 6. look → pack upgrade — **works** (harsh Reject)

| Hop | Behavior | Status |
|-----|----------|--------|
| Ask to repost | `POST /follows/share-ask` → `packAskPending` (Look stays) | works |
| Accept + Allow Repost | Pack + “let you repost” notify | works |
| Accept without Repost | Clear ask; keep Look; no notify | works |
| Reject share-ask | **Stopped** (Look revoked) — documented | works; confirm still desired |
| Mill Pack→Look | `PATCH …/access` + system lines in exact Direct | works |

### 7. Collection access revocation — **works**

| Hop | Behavior | Status |
|-----|----------|--------|
| Request to access | Pack view ask → owner chat Allow/Deny | works |
| Allow | Granted on request for that pack; asker notify | works |
| Deny | Silent to asker | works |
| Owner remove grant | `DELETE …/view-grants/:companyId`; no chat/notif | works (docs silent OK) |
| Scope | Pack only; no Follow/Connection; no Curate | works |

### 8. Phone and Place visibility — **mostly works** (+ Place docs/from-pack holes)

#### Phone

| Who / grant | See opted-in phones? | Status |
|-------------|----------------------|--------|
| Active Connection (no block) | Yes (opt-in) | works |
| Follow-only / look / pack-view grant | No | works |
| Block either edge | Shop 404 | works |

API: `VisibilityService.canViewCatalog` + `getContactPoints`. UI: `showContacts` when connected. Dual enforcement aligned.

#### Place

| Who / grant | Place? | Direct mill ticket? | Status |
|-------------|--------|---------------------|--------|
| Active Connection | Yes (`assertCanTrade`) | N/A unless DL trio | works |
| Follow Accept (⇒ Connection) | Yes — not stuck on Connect | — | works |
| Discoverable / openable pack without Connection | May Place | — | works in code; docs absolute “needs Connection” undersells (`orders.md` clearer) |
| DL + mill Pack + buyer Allowed→trader | — | Direct via `pathForPair` | works |
| DL + Pack, buyer unfollowed trader | — | I-handle on `pathForPair`; **from-pack may still Direct** | gap (G-006) |
| Mill Pack off | — | Gray list; I-handle Place | works |
| Look-only mill (even if Connected) | — | No Repost / no live DL create | works |

---

## Block interactions (reaffirm 4C)

First directed Block wipes Follows both ways; DL rows stay gray until Pack; Unblock own edge only; both clear → Connection communicate again, **not** look/pack. Block is **not** “Remove connection while Follow remains.”

---

## Explicit UI ↔ API mismatches

1. **Remove connection** — glossary action; no API; UI never offers it.  
2. **Connect Ignore** — archives thread; does not decline AccessRequest.  
3. **`/access-requests/:id/approve|decline`** — live, unused by web.  
4. **Message send Pending→Active** without Connection — API only.  
5. **Place “needs Active Connection”** (access-and-connections one-liner) vs `TradeAccess` discoverable/pack bypass.  
6. **`canViewCatalog`** means Active Connection (phones), not Follow packs.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | Gap | G-001 Remove connection missing |
| Business rules | Gap | Ignore vs decline; Accept-under-block Follow |
| Workflows | OK | Desks correct when used |
| Edge cases | Gap | G-002, G-004–G-006 |
| Permissions | OK | Follow ≠ Connection gates mostly right |
| User states | Gap | Orphan pending AccessRequest after Ignore |
| Notifications | OK | Accept notifies; Reject/Ignore/Stop silent as locked |
| Error handling | OK | Block / CONNECTION_REQUIRED |
| Scalability | N/A | |
| Mobile interactions | N/A | Audit only |
| First glance (BM-11) | N/A | Audit only |
| Units | N/A | |
| Accessibility | N/A | |
| Platform consistency | Gap | Dual Connect APIs; Remove connection wording |

---

## Gaps

### G-001 — Remove connection not implemented — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Docs named Remove connection with no API. |
| Resolution | Product: **no** Remove connection. Glossary dropped; **Block** is sole end-communicate. |

### G-002 — Connect Ignore leaves AccessRequest pending — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Ignore archives chat only. |
| Resolution | Product: Ignore = **hide chat only**; do not decline AccessRequest. Documented intentional. |

### G-003 — Share-ask Reject stops Look — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Reject share-ask → Stopped. |
| Resolution | Product: Reject → Repost denied; **Look stays**; clear `packAskPending` only. |

### G-004 — Follow Accept while blocked — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Accept while I blocked them skipped Connection. |
| Resolution | Confirm → clear **my** Block + Allow; API deletes own edge on look/pack decide. |

### G-005 — Message send activates Pending without Connection — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Send flipped Pending→Active without Connection. |
| Resolution | Pending→Active on send ensures Connection (same as thread Accept). |

### G-006 — from-pack Direct skips buyer-follow gate — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | from-pack Direct ignored buyer Allowed→trader. |
| Resolution | Direct requires mill Pack **and** `buyerFollowsTrader` (pathForPair parity). |

### G-007 — Place Connection wording drift — **Closed (4E)**

| Field | Content |
|-------|---------|
| Gap | Docs said Place always needs Connection. |
| Resolution | Place prefers Connection; discoverable/openable pack may Place. |

---

## Approved scope for this slice

- This audit document only.  
- No code, schema, or UI changes.  
- No journey tests until product answers G-001–G-003 and engineering picks G-004–G-006 fixes.

## Explicitly deferred / rejected

- Implementing Remove connection or Block-only glossary rewrite — wait for G-001.  
- Overnight hours / day-wise schedules — out of scope.  
- Merging Follow and Connection — Reject (philosophy).  
- Changing bilateral Block model — locked in 4C.

## Verification plan (after implementation slices)

- Functional: Follow Accept/Reject; Connect Approve/Ignore+AccessRequest; Message Accept; Unfollow keeps Connection; (if built) Remove connection keeps Follow; share-ask Reject; pack grant revoke; phones Follow-only empty; Place from-pack + buyer unfollow.  
- Regression: Block wipe Follows; look-only blocks Repost; pathForPair / from-pack parity.  
- Trader-eye: Requests desk Ignore; Connections actions; shop Unfollow vs Block.

---

## Edge cases covered (this audit)

- Follow Accept ⇒ Connection; Connect/Message ⇏ Follow  
- Unfollow keeps Connection; packs/Private drop  
- Share-ask Reject → Stop Look  
- Pack view grant revoke silent  
- Phones = Connection + opt-in only  
- Place discoverable bypass; DL Pack + buyer follow; from-pack skip  
- Block wipe Follows ≠ Remove connection  
- Accept-under-block skips Connection  
- Ignore ≠ AccessRequest decline  

## Fixes or clarity still needed (product)

None for G-001–G-007 — locked and shipped in **4E**.

---

## Key file index

| Area | Paths |
|------|--------|
| Follow | `apps/api/src/discovery/follow.service.ts`, `follow.controller.ts`, `follow-access.ts` |
| Connect | `apps/api/src/access/access.service.ts`, `access.controller.ts` |
| Connection / Block | `connection.service.ts`, `connection.controller.ts`, `company-block.ts`, `ensure-active-connection.ts` |
| Message Accept | `apps/api/src/conversation/thread.service.ts`, `message.service.ts` |
| Pack view | `collection-view-request.service.ts` |
| Phones | `identity/company.service.ts` (`getContactPoints`), `visibility.service.ts` |
| Place / DL | `orders/trade-access.ts`, `trade-lane.service.ts`, `mill-share.ts`, `order.service.ts` |
| Web | `FollowersPage`, `FollowingPage`, `ConnectionsPage`, `ThreadPage`, `CompanyOverflowMenu`, `FindOnEkumBlock`, `CollectionViewerPage` |
