# Feature Completeness Review — Direct Links Network + auto-repost

**Date:** 2026-10-28  
**Module / ask:** Move Direct Links to Network; lock Direct vs I-handle; follow-revoke confirmation; auto-repost with one pack per trader × canonical root; in-place revision/feed  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`, `docs/features/settings.md`, `docs/features/explore.md`, `docs/superpowers/specs/2026-09-02-tradelane-design.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

Do **not** overwrite `2026-10-28-direct-link-order-workflow-completeness.md` (mixed Place routing). This review is the Network + auto-repost lock. Live code was inspected before implementation.

**Successor (audience only):** `2026-10-28-auto-repost-selected-buyer-completeness.md` redesigns auto-repost from Followers to Selected linked buyers. Uniqueness (one pack per trader × root), Relist, and Direct Place in this file still hold.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | One Direct Link = trader × mill × buyer on existing `TradeLane`. Eligible link at Place → Direct mill ticket + mill–buyer–trader group. No link → one I-handle parent + Send-hold. Auto-repost = receiving trader’s Followers (same as manual Repost), only if mill Relist/`allowForward` allows that trader. Follow graph is who they **see**; Direct Link is what **triggers** auto-repost. No Trading module / new Trading-enabled flag. |
| UX Designer | Direct links live under **Network**, not Settings. ＋ sheet: mill = shops I follow; buyer = shops that follow me. Locked card: mill ticket + trio group — no ticket/reveal/auto-repost rows. Follow/unfollow that would drop a link shows confirm (Cancel keeps; Continue removes only affected links + toast). BM-07: list + confirm sheet must clear last row above chrome. |
| Solution Architect | Reuse TradeLane, `createFromPack` mixed routing, `resolveRepostSource`, Collection `id` as post identity, JobQueue. Add `repostRootCollectionId` + origin + watermark; `Thread.messagingClosedAt`. Partial unique for **new automatic** rows only after backfill. Close only `TradeLane.groupThreadId`. |

---

## Platform consistency (required)

1. **Existing patterns?** Network list rows, `ListSearchRow`, ConnectionPicker-style sheets, kit Sheet / Button / InlineNotice / toast. Yes — no one-off checkbox or ticket radios.  
2. **Duplicates another feature?** No DirectLink table. No second Repost pipeline. Your paths is the same TradeLane, moved.  
3. **Should reuse an existing workflow?** Yes: TradeLane CRUD, from-pack routing, manual Repost create/publish Followers, JobQueue.  
4. **Naming matches the app?** **Direct links** (Network). Mill · buyer. Not Seller/Buyer on chat card body. Not a Trading app.  
5. **Units?** No ₹/qty display-unit change. Pack Explore card stays the collection.

**Philosophy conflict?** No. Place mixed routing already Proceed’d. This slice removes obsolete ticket/reveal *switches* because Direct Link **is** mill ticket + trio. I-handle remains the no-link default.

---

## Locked examples (dedup + feed)

Identity: Collection `id` = Post ID. `repostRootCollectionId` = Root post ID. Immediate parent = `repostSourceCollectionId`. Revision is in-place on the same Collection.

**Example A — Trader 3 must not publish twice.** T3 follows S2, T1, T2. Direct Links: T3×S1×B1 and T3×T1×B1. S1 publishes POST-100. T1 auto-reposts POST-201 (root POST-100). T3 gets both triggers → one POST-301 (root POST-100).

**Example B — Feed shows latest revision only.** POST-100 + two designs = revision 2 on the **same** id. Explore: one card, time-descending by `exploreActivityAt`. Not two posts. Draft edits do not bump. Duplicate events do not bump.

**Example C — existing pack, later source adds.** If a source-linked pack for that root already exists (manual or auto): do not create a second; do not delete it; **do sync newly added source designs** into it. Trader name, extra trader-only members, audience stay. Source member remove/unpublish drops those mill members; trader extras stay. Packs with no source stamp are not synced.

---

## Seven gates (Required — closed in this review)

### 1. Existing data / unique index

Walk `repostSourceCollectionId` (and product-source) chains at migrate time; stamp `repostRootCollectionId`. Detect `(companyId, root)` duplicates. **Keep all** — do not delete collections or break order / bookmark / saved / chat references.

Partial unique `(companyId, repostRootCollectionId)` applies to **new automatic** rows (`repostOrigin = automatic` AND root not null). Historical manuals with the same walked root stay as separate ids.

If two manuals share a root: auto-create is skipped; membership sync targets the **oldest published** survivor (`publishedAt` then `createdAt`); the other row is never deleted.

### 2. Manual vs automatic

Today every source-linked pack is a **manual** Repost (`resolveRepostSource`). Backfill `repostOrigin = manual` (or unset treated as manual). New auto-reposts set `automatic`. Locked hybrid = Example C.

### 3. Revision correctness

Recipient stores `repostSyncedSourceAt` = last successfully synced source published-update timestamp. Incoming token ≤ watermark → no membership write, no notification, no `exploreActivityAt` bump. Out-of-order must not overwrite newer content.

### 4. Existing repost reuse is not “already done”

If POST-301 exists, the job compares source revision vs watermark and reconciles missing / removed mill members **before** complete. Row existence is not proof of latest sync.

### 5. Permissions at every hop

Revalidate: immediate source published; Relist/`allowForward`; recipient can see that hop; eligible Direct Link for **that** hop (seller = hop owner). Failed hop stops future propagation through that relationship. Do not delete existing reposts. Relist off = future only.

### 6. Chat scope

Close **only** `TradeLane.groupThreadId` for that lane (`Thread.messagingClosedAt`). Do not scan other threads. Do not close 1:1 mill/trader/buyer chats. Send rejects server-side when closed. History remains. Orders are not rerouted.

`ensureTradeLaneGroup` may reuse an exact three-company group — closing that stored id is intentional for that trio.

### 7. Legacy routes

Inspected: real route is `/settings/paths` (`router.tsx`, `youShortcuts.ts`, e2e/PDF). No `/settings/your-paths` route today. Redirect **both** `/settings/paths` and `/settings/your-paths` to `/network/direct-links`. Hide Your paths from Settings. Direct links row on Network when trading.

---

## Follow / unfollow confirm (copy lock)

Before an action that would invalidate an existing Direct Link:

> Continuing will remove the affected Direct Link(s). Future orders will not route through those relationships, and automatic reposting will stop. Existing orders stay as they are.

- **Cancel:** preserve the relationship and Direct Link.  
- **Continue:** perform the action; remove only affected Direct Links; toast on success.  
- Server is source of truth (same transaction as unfollow / remove-follower / disconnect). Idempotent if the lane is already gone.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Network IA, Direct Place trio, mixed routing reused, auto-repost + sync |
| Business rules | OK | One pack per trader × root; Example C hybrid; Relist future-only |
| Workflows | OK | Follow-revoke confirm; Direct trio at Place; I-handle until Send |
| Edge cases | OK | Duplicate historical manuals; cycles; out-of-order jobs; mixed cart |
| Permissions | OK | Hop revalidation; I-handle mill hide unchanged |
| User states | OK | Empty Direct links; trading-off hides row |
| Notifications | OK | No storm on idempotent retry / revision 2 sync |
| Error handling | OK | Failed jobs retryable; unfollow + lane cleanup one txn |
| Scalability | OK | JobQueue fan-out; unique/reuse |
| Mobile interactions | OK | BM-07: Network list + ＋ sheet + confirm sheet clear last row |
| First glance (BM-11) | OK | One job: mill · buyer. Locked mill+group quiet. Ticket/reveal gone |
| Units (order / dispatch / Rate per) | N/A | No unit string change |
| Accessibility | OK | Confirm is kit sheet, not a silent unfollow |
| Platform consistency | OK | Reuse TradeLane + Repost + Network rows |

---

## Gaps closed in this slice

### G-001 — Direct links IA

Your paths under Settings with ticket/reveal. Move to Network Direct links; follow pickers; redirects.

### G-002 — Direct Place trio never opens

Trio only after I-handle Send+reveal. Direct Place must `ensureTradeLaneGroup` immediately.

### G-003 — Follow does not clean lanes

Unfollow deletes follow only. Preview + delete affected TradeLanes in the same txn; close `groupThreadId`.

### G-004 — Auto-repost missing

No job type; `LANE_AUTOREPOST_AVAILABLE` false. Eligible Direct Link + discoverable + allowForward → one pack per root; sync adds.

### G-005 — Canonical root / watermark

Unique is immediate source only. Add root + origin + `repostSyncedSourceAt`. Partial unique for automatic after backfill.

---

## Approved scope for this slice

- Network Direct links page + redirects + follow-revoke confirm.  
- Lane create on follow graph; Direct-only persist (`ticket=mill`, `reveal=true`).  
- Direct Place trio; remove order ticket pick and mill Share a group.  
- Close only stored trio; server reject send.  
- Auto-repost JobQueue + membership sync + hop revalidation.  
- Tests listed in the implementation plan.

## Explicitly deferred / rejected

- FG-007 (Direct + hop on one mill ticket).  
- Trading module / new Trading-enabled flag.  
- DirectLink table.  
- Live ticket/reveal editing.  
- Silent delete of historical duplicate manuals.  
- Staging/production migrate or deploy.

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
