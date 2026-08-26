# Buy for buyer — design

**Date:** 2026-08-22  
**Status:** Approved (entry redesigned)  
**Anchors:** Completeness `2026-08-22-buy-for-buyer-completeness.md`, [orders.md](../../features/orders.md)

## Job

You already agreed on the phone. Log the ticket on the **same album + How many each** a buyer uses. They **Accept**.

## Entry (locked)

- **No** ＋ **Buy for buyer**. **No** dedicated `/orders/for-buyer` page.  
- **＋ drops Saved** (already Explore bookmark + You).  
- Start where they already pick designs: Explore / album / Saved / your pack. **Select** → **How many each**.  
- Owner of a pack: **Order** on the select bar (today it is hidden for owners).

## Who (on How many each)

Show **Who is this for?** only if selling or trading is on. Buying-only: unchanged (Send order / Ask rates).

Use accent-border rows (ConnectionPicker language), not a new control.

| Designs selected | For me | For a buyer |
|------------------|--------|-------------|
| Any from someone else | Default | Optional |
| Only yours / your curated pack | Hidden — cannot order from yourself | Required |

- **For me** → today’s Send order / Ask rates (you are the buyer).  
- **For a buyer** → ConnectionPicker **Choose buyer**, or **Not on Ekum yet** (name + 10-digit phone). CTA **Log order**. Hide **Ask rates** (that stays “I ask”).  
- Who is **not** gated on “own designs only.” A trader may pick mill designs and log for their buyer.

## Ticket

- `requested`. You are the **seller** on the ticket; chosen company (or thin company) is the buyer.  
- Lines may be **others’ designs**. No chain picker. No auto Send-up (mill hop is **Send** later).  
- Accept / Decline / `/o/:token` unchanged from the first slice (OTP on that phone, ~7 days, one use, Copy / WhatsApp after off-app create).

## Picker bug

Connection list can return the same company twice (both directions). Unique by `company.id` before render.

## Copy

For me · For a buyer · Log order · Accept · Decline · Not on Ekum yet. No Seller/Buyer on the chat card.

## Out

- ＋ / You / HowManyEach Who for buying-only  
- Ask rates on behalf of a buyer  
- Auto-approve, SMS send, auto Send-up, guest shop  
