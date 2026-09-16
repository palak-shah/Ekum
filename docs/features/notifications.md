# Notifications

## Purpose

Bell inbox: a **projection of domain events** (orders, requests, messages, drops, …), with prefs and optional web push. Not duplicated on Home.

## Who uses it

Every company. Open via header **bell** → `/notifications`.

## User flows

1. Tap bell (badge = unread count for **this viewer**).
2. Browse list → tap a row → that item is **marked read**, then the app opens the related order / chat / pack / company / broadcast.
3. **Mark all read**, **Delete** one (×), **Clear read**, or **Clear all**.
4. Adjust preferences (types / push) where settings expose them.
5. Subscribe browser push when prompted / enabled; push click opens the same deep link as the in-app row.

## Business rules

| Type | Typical source |
|------|----------------|
| `order` | Place, rates, status changes, payment asks |
| `return` | Return lifecycle (deep link uses the **order**) |
| `request` | Access / view / relist grants |
| `message` | Chat |
| `collection` | Pack view granted (and later drops) |
| `broadcast` | Seller broadcast |
| `complaint` | Escalations (emitter Later) |
| `sample` | Sample lifecycle (emitter Later) |
| `digest` | Bundled summary job `notification.digest` |

- Notifications are **derived** — do not invent client-only alerts that the API did not emit.
- Home Needs is separate (actions); bell is the alert log — see [home](./home.md).
- **Unread badge** counts the same rows the list shows: company feed where `recipientUserId` is null or the current user (not other users’ private rows).
- **Copy** uses plain trader language with **who** (company name) and **what** (order label / pack name / status) when known.

### Deep links (`refType` → path)

| `refType` | Opens |
|-----------|--------|
| `order` | `/orders/:refId` |
| `thread` | `/chats/:refId` |
| `company` | `/company/:refId` |
| `collection` | `/collections/:refId` |
| `product` | `/explore/products/:refId` |
| `broadcast` | `/broadcast` |
| missing / unknown | `/notifications` |

Return events store `refType: order` and `refId: orderId` so one path covers returns; body carries the return cue.

## Edge cases / empty states

- Empty inbox → calm empty state.
- Push denied by browser → in-app list still works.
- Name/label missing → short fallback (“New order”, “Return”, etc.).
- Muted chat threads reduce message noise per thread alert level (chat), not a global mute of all types unless prefs say so.
- Per-type mute UI and facilitator order alerts → Later.

## Seed walkthrough

1. As **Meena**: bell shows seeded items (e.g. rates on order, drop from Surat Silk House).
2. As **Ravi**: bell shows new order request from Jaipur Emporium.
3. Open an unread item → lands on the correct detail screen; unread badge drops.

## Where it lives

- Web: `apps/web/src/features/notifications/`, `notificationDeepLink`, push helpers in `apps/web/src/lib/push.ts`, `public/push-sw.js`
- API: `apps/api/src/notifications/` + `events` → projections; job `notification.digest`
- Contracts: `packages/domain-types/src/notification.ts`
