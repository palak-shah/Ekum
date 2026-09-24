# Feature Completeness Review — Trader mill Send on face

**Date:** 2026-09-20  
**Module / ask:** Compulsory **Send to {supplier}** stays on each mill card (one tap). **Send quote**, Open chat, Decline (and other secondary desk CTAs) stay under one expand — label **More actions** (not Take over / Desk tools; trader already owns the desk).  
**Anchors:** `docs/features/orders.md`, `docs/superpowers/specs/2026-09-07-trader-i-handle-desk-design.md`, Completeness 2026-09-07-trader-i-handle-desk + take-over-fulfillment  
**Disposition:** Proceed

> Restores locked I-handle desk: Send on the mill card. Undoes Mills-observe folding Send behind the expand (extra click on the daily path).

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Trader’s job while lots are held is **Send to each mill**. That must not be two taps. Quote / chat / decline are secondary and can live under one expand. |
| UX Designer | Mill card: **Send to {shop}**. Page expand (**Take over**): Send quote · Open chat · Decline · payment / dispatch / settle / View as today. No “Desk tools to Send…” hint. Cue stays **Your move: Send to {mill}**. |
| Solution Architect | Flip `showMillSendOnCard` to always on-card; stop Mills-observe gate. `showSendQuoteOnDeskFace` false whenever mill desks exist (quote only under expand). Rename UI string Desk tools → Take over. BM-09 unchanged (buyers still never see trader expand). |

---

## Platform consistency (required)

1. **Existing patterns?** Matches 2026-09-07 desk spec (Send on mill card; secondary under Take over).  
2. **Duplicates another feature?** No — Direct **Handle myself** stays separate.  
3. **Should reuse an existing workflow?** Yes — same mill Send + Take over stack.  
4. **Naming matches the app?** **Take over** (user-known). Drop **Desk tools**.

**Philosophy conflict?** No — fewer taps for the compulsory path.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Send on card; quote/chat/decline under expand |
| Business rules | OK | Me and Mills ticket both keep Send on card |
| Workflows | OK | Place → Send per mill → mill quotes → Take over → Send quote |
| Edge cases | OK | No Take over if nothing secondary to show |
| Permissions | OK | Trader selling + mill desks only; BM-09 |
| User states | OK | Held → Send visible; after Send, Send gone |
| Notifications | N/A | |
| Error handling | N/A | |
| Scalability | OK | N mill cards each with own Send |
| Mobile interactions | OK | Send stays on card above nav (BM-07) |
| Accessibility | OK | Same buttons |
| Platform consistency | OK | |

---

## Gaps

None Required.

---

## Approved scope for this slice

- Mill **Send to {shop}** always on the mill card when held (Me or Mills ticket).
- **Send quote** never on the I-handle desk face when mill desks exist — only under **Take over**.
- Rename **Desk tools** / **Hide desk tools** → **Take over** / **Hide take over**.
- Cues: no “Desk tools to Send…”; use **Your move: Send to…** / **Your move: Send quote…**.
- Docs + unit tests.

## Explicitly deferred / rejected

- Renaming Direct **Handle myself**.
- Changing what else sits under Take over (payment / dispatch / settle stay).

## Sign-off

| Role | Disposition |
|------|-------------|
| Product / UX / Architecture (agent) | Proceed |
