# Design — Notifications accuracy

**Date:** 2026-09-14  
**Status:** Approved (Completeness Proceed)  
**Completeness:** `docs/superpowers/reviews/completeness/2026-09-14-notifications-accuracy-completeness.md`

## Goal

Bell feed is accurate: unread goes away when opened/cleared, copy names who/what, every row (and push click) lands on the right screen.

## Unread / badge

1. Row tap → `POST /notifications/:id/read` (best effort) → navigate via deep link.  
2. Mark all / Clear read / Clear all / Delete one → invalidate `['notifications','feed']` and `['notifications','unread-count']`.  
3. `GET /notifications/unread-count` counts only rows the viewer can see: `recipientCompanyId` + (`recipientUserId` null OR current user).

## Copy

Listeners look up names when events carry IDs only. Target shapes:

| Event | Title / body |
|-------|----------------|
| Access approved | `{targetName} approved your request` |
| Order created | `{buyerName} · {orderLabel or New order}` |
| Order status | `{orderLabel} · {status}` (+ actor when cheap) |
| Message | Title `{senderName}`; body preview |
| Return | `{counterpart} · return on {orderLabel}` + human status; **refType `order`**, refId = orderId |
| Payment | `{counterpart} asked for payment` / `marked paid` on `{orderLabel}` |
| Broadcast | Subject; body `{senderName}` |
| Collection / relist | Keep pack/design names (already OK) |

## Deep links

| `refType` | Path |
|-----------|------|
| `order` | `/orders/:id` |
| `thread` | `/chats/:id` |
| `company` | `/company/:id` |
| `collection` | `/collections/:id` |
| `product` | `/explore/products/:id` |
| `broadcast` | `/broadcast` |
| (missing / unknown) | `/notifications` |

Shared helper `notificationDeepLink(item)` used by list (+ unit). Push JSON includes `url` (absolute path); `push-sw.js` focuses existing client or `openWindow(url)`.

## Out of scope

Sample/complaint emitters, mute UI, facilitator order notifs, live New drop.
