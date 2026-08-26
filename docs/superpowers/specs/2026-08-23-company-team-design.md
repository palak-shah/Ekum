# Company team — design

**Date:** 2026-08-23  
**Status:** Draft for plan (lock before build)  
**Anchors:** Completeness `2026-08-23-company-team-completeness.md`, [00-concepts.md](../../features/00-concepts.md), [chat.md](../../features/chat.md)

## Job

One **company** trades. Several **people** (own OTP) work under it, with different caps. The other business still sees the **business name**.

## Locked

- **Company** is the actor on catalog, Connections, orders, and chat participants.  
- **User** is a membership: `owner` or `staff` + five caps already on `CompanyMembership` (`canUploads` · `canChats` · `canOrders` · `canPayments` · `canTeam`).  
- **Shared** chat: any member with **Chats** sees it (team + client / supplier, or a **group** of companies).  
- **Only you** (`owner_only`): only `role = owner`. Staff get 404 even with Chats. Owner starts it.  
- Counterparties never see a personal employee inbox. Cards stay company-to-company.  
- **No** People tab. **No** person-to-person DMs. **No** multi-company switcher this slice.  
- Invite is **phone-bound**. A phone that already has a business cannot join (same rule as `COMPANY_EXISTS` on create).

## Invite

**You → Team → Invite** (owner, or staff with **Team**): name + 10-digit phone. Share `/t/:token` (Copy / WhatsApp).

Recipient: OTP on that phone → open link → **Join {business}**. Becomes **staff** (defaults: chats + orders on; uploads / payments / team off). Skips company create.

If they create a company first, they become an owner of their own shop and **cannot** join this invite.

## Caps (owner sets)

Accent-border rows on Team (same language as ConnectionPicker), not a new control set.

| Cap | If off |
|-----|--------|
| Uploads | No catalog / media write |
| Chats | No list / send / start chat |
| Orders | No create / accept / dispatch / buy-for-buyer |
| Payments | No Ask / Paid / Mark received |
| Team | No invite / edit / remove staff |

Owner always keeps Team. Last owner cannot be removed or demoted.

## Chat

- **＋ New chat** already starts a **shared** company or **group** (other companies). Staff with Chats use that.  
- Owner adding a 1:1: **Team can see** (shared) vs **Only you** (`owner_only`).  
- `findDirect` must key on **pair + visibility** so Only you does not reopen the shared trade thread. `ensureTradeThread` stays **shared** only.  
- Groups stay **shared** this slice.

## Out

- Switch company when one phone has two memberships  
- Public staff directory / show employee phones  
- Owner-only groups  
- Auto-connect, SMS send, People suggestions  
