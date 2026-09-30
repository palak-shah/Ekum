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

- **Own designs:** `requested`, **you** are the seller, buyer **Accept**. No Confirm on your desk (you already logged it). Off-app `/o/:token` unchanged.
- **Mill designs:** seller is the **mill**. Path from **Your paths** for trader × mill × buyer; **no row = I handle**.
  - **I handle:** buyer↔you parent + held mill lots. You **Send**; mill **Confirm**. You do not Confirm the parent.
  - **Direct:** mill ticket, you **Shared · {mill}**. Mill **Confirm**. You do not Confirm.
- No auto Send-up. Mixed mills → one hop per mill.

## Picker bug

Connection list can return the same company twice (both directions). Unique by `company.id` before render.

## Copy

For me · For a buyer · Log order · Accept · Decline · Not on Ekum yet. No Seller/Buyer on the chat card.

## Out

- ＋ / You / HowManyEach Who for buying-only  
- Ask rates on behalf of a buyer  
- Auto-approve, SMS send, auto Send-up, guest shop  
