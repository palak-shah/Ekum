# Collection view request (Allow / Deny) — design

**Date:** 2026-09-03  
**Status:** Approved (conversation)  
**Approach:** A — pack allow-list (**Granted on request**), separate from Connection  
**Anchors:** [collections.md](../../features/collections.md), [access-and-connections.md](../../features/access-and-connections.md), [chat.md](../../features/chat.md), [home.md](../../features/home.md), [00-concepts.md](../../features/00-concepts.md)

## Problem

Meena opens a gated pack (e.g. Kavita’s followers sarees). Today **Ask** uses **Request access → Connection**, so the chat note reads like “connect,” and Kavita has no in-thread **Allow / Deny** for *this pack*. Deny would also risk a visible rejection. Approving a pack must not silently create a Network connection.

## Product promise

1. **Ask to see this collection** ≠ **Request access / Connect**.  
2. Kavita **Allow / Deny** in the chat thread.  
3. **Allow** unlocks **only that collection** via **Granted on request** (not Followers, not buyer group, not publish-time Selected).  
4. **Deny** is silent to Meena — no “denied” chat, notification, or Home line.  
5. Meena learns of Allow via **chat + notification + one aggregated Home row**.  
6. Kavita can later see **who** can see the pack, including **Granted on request**.

## Locked decisions

| Topic | Decision |
|-------|----------|
| Unlock scope | That collection only |
| Connection | **Never** created by pack Allow (honest Ekum ladder) |
| Connect path | Profile / Network / Find **Request access** unchanged → Connection |
| Grant bucket | **Granted on request** — distinct from Followers / Connections / Buyer groups / Selected |
| Deny visibility | Silent to requester |
| Allow feedback | Chat update + notification + Home aggregate |
| Home | One row for all “you can view packs” grants; count bumps; tap → list of packs |
| Notifications | Same aggregation spirit — no flood of one-per-pack noise for the recipient |
| Owner inspect | Owner UI: who can see = publish audience + **Granted on request** (add/remove) |
| Re-ask | Allowed after deny or after grant removed |
| Idempotent Allow | Same company + pack → one grant; Home does not double-count |

## User flows

### Ask → Allow

1. Meena on gated collection → **Ask to see this collection**.  
2. Chat to catalog owner gets a **view-request** card (pack name, requester).  
3. Kavita **Allow** → Meena added to **Granted on request** for that pack.  
4. Meena: chat “You can view {pack}”; notification; Home Needs count +1 (or new single aggregate row).  
5. Meena opens pack → designs visible (view gate passes via grant). Still not Connected unless she uses Connect separately.

### Ask → Deny

1. Kavita **Deny** → request closed on her side.  
2. Meena sees **no** deny message / notif / Home. Pending ask cleaned up without rejection copy.

### Owner reviews grants

1. Kavita opens pack owner surface → **Who can see** (or equivalent quiet section).  
2. Lists publish audience (followers / groups / selected) and **Granted on request** (e.g. Meena).  
3. Remove grant → Meena loses pack view again (Ask available).

## Trust ladder (unchanged + extension)

```
Follow (light) → Connection (trade) → …
                    ↘
Pack Ask → Granted on request (view this collection only)
```

Open catalog order without Connection remains as today. Pack grant does **not** imply Connection or company-wide catalog access.

## Technical sketch

### Data

- Table or relation: `CollectionViewGrant` (`collectionId`, `companyId`, `grantedAt`, optional `grantedByUserId`) **or** dedicated `grantedCompanyIds` / join table — **not** merged into publish `audienceCompanyIds` so Selected stays publish-time picks.  
- `CollectionViewRequest` (or message metadata + status): pending / allowed / denied; tied to `collectionId`, requester, target owner, chat message id.

### View gate

`canViewCollectionProducts` (and discover-as-needed): existing audience **OR** active grant for `(collection, viewer)`.

### Chat

- Collection **ask card** chrome (owner pending): same density as other chat trade cards (header + thumbs + who/count + ask line); WhatsApp-style **Deny | Allow** equal footer (compact split, quiet / accent text). After Allow: resolved line + view link; Deny silent to requester.
- New card kind or metadata on system/catalog message: owner sees Allow/Deny; after Allow, both sides see resolved “can view” copy; after Deny, requester’s card removed or non-informative pending cleared — **never** deny copy to requester.  
- Collection Ask must **not** call `openAccessRequestThread` / create `AccessRequest`.

### Home / notifications

- Recipient aggregate: one Needs item type `collection_view_granted` with `count` + deep link to list.  
- Optional owner pending Asks on Home deferred if chat is enough this slice.

### Owner UI

- Read grants on collection detail (owner).  
- Remove grant endpoint.

## Out of scope

- Silent Connection on Allow  
- Granting all of Kavita’s packs at once  
- Product-level Ask (design-only) this slice — collection only  
- Changing publish audience enums  
- Floating Home entry for Kavita’s pending pack Asks (optional later)

## Verification

- Units: view gate with grant; Allow does not create Connection; Deny leaves no requester-visible deny message.  
- Manual: Meena Ask → Kavita Allow/Deny; Home one row for multiple Allows; Who can see shows Granted on request.  
- Docs: concepts ladder note; collections; access-and-connections; chat; home. Completeness before code.

## Spec self-review

- No TBD. Connect vs pack Ask separated. Grant bucket named. Deny silence explicit. Home aggregation explicit. No silent Connection.
