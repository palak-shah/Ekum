# Payment request on an order — design

**Date:** 2026-08-22  
**Status:** Approved  
**Anchors:** Completeness `2026-08-22-payment-request-completeness.md`, [orders.md](../../features/orders.md), [chat.md](../../features/chat.md)

## Job

Seller asks for money on a ticket. Buyer marks **Paid**. Seller can **Mark received**. Honour system — Ekum does not move money.

## Rules

- Only the **seller** on that order may ask.
- Order status: `confirmed` · `dispatched` · `delivered`.
- One **open** ask at a time. After paid, they may ask again.
- Amount > 0 required. Note and pay-how text optional (UPI / bank as words, not a QR product).
- Parties only (buyer / seller). Soft-hide unchanged.

## Surfaces

- Order detail: **Ask for payment** (seller, when allowed). Open ask shows amount + **Paid** (buyer) or **Mark received** (seller).
- Sheet: amount (default = sum of line rate × qty when every open/confirmed line has a rate; else empty), note, pay-how.
- Trade thread: one living `payment_card` per ask (updates to Paid). Tap → order.

## API

- `POST /orders/:id/payment-requests` `{ amount, note?, instructions? }`
- `POST /payment-requests/:id/seen` (buyer)
- `POST /payment-requests/:id/paid` (buyer)
- `POST /payment-requests/:id/received` (seller)
- Asks included on `GET /orders/:id` as `paymentRequests`

## Copy

Ask for payment · Paid · Mark received · Payment #… · Paid. Never invoice / settlement / Seller / Buyer on the card.
