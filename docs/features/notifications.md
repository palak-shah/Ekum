# Notifications

## Purpose

Bell inbox: a **projection of domain events** (orders, requests, messages, drops, …), with prefs and optional web push. Not duplicated on Home.

## Who uses it

Every company. Open via header **bell** → `/notifications`.

## User flows

1. Tap bell (badge = unread count).
2. Browse list → open related order / chat / collection / company.
3. Mark read (item or **Mark all read**).
4. **Delete** one (× on the row), **Clear read** (removes read rows), or **Clear all** (empties inbox).
5. Adjust preferences (types / push) where settings expose them.
6. Subscribe browser push when prompted / enabled.

## Business rules

| Type | Typical source |
|------|----------------|
| `order` | Place, rates, status changes |
| `return` | Return lifecycle |
| `request` | Access requests |
| `message` | Chat |
| `collection` | New drop / album activity |
| `broadcast` | Seller broadcast |
| `complaint` | Escalations |
| `sample` | Sample lifecycle |
| `digest` | Bundled summary job `notification.digest` |

- Notifications are **derived** — do not invent client-only alerts that the API did not emit.
- Home Needs is separate (actions); bell is the alert log — see [home](./home.md).

## Edge cases / empty states

- Empty inbox → calm empty state.
- Push denied by browser → in-app list still works.
- Muted chat threads reduce message noise per thread alert level (chat), not a global mute of all types unless prefs say so.

## Seed walkthrough

1. As **Meena**: bell shows seeded items (e.g. rates on order, drop from Surat Silk House).
2. As **Ravi**: bell shows new order request from Jaipur Emporium.
3. Open an item → lands on the correct detail screen; unread count drops.

## Where it lives

- Web: `apps/web/src/features/notifications/`, push helpers in `apps/web/src/lib/push.ts`
- API: `apps/api/src/` notification module + `events` → projections; job `notification.digest`
- Contracts: `packages/domain-types/src/notification.ts`
