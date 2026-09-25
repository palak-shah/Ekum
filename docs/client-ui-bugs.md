# Client UI bugs — sheet 2 (sr no)

Source: `Ekum Beta - Review & Change Log - 2. UI by screen (1).csv`  
Say **fix sr N** (and the point if needed). Do not start a fix until then.

**Type:** Bug = wrong today · Change = redesign · Discuss = no decision

| Status | Count |
|---|---|
| Done | 8 (sr 8, sr 16, sr 23, sr 34, sr 36, sr 42, sr 47) |
| Open | 0 |
| Leaving | Home sr 4 + 5; Saved sr 18 + 20 |

---

## Leaving (do not fix)

### sr 4 + 5 — Home
Needs vs New packs, action copy, trader buy/sell side.

### sr 18 + 20 — Saved
Own name and Design/Collection · city on Saved cards.

---

## Next to fix

None in this pass.

---

## Done this pass (mark on the sheet)

### sr 23 / 34 / 36 — You library own name
**Type:** Bug (fixed)  
Date only on Your designs / collections tiles and the collection editor status line.

### sr 47 · Tanmay 3
**Type:** Bug (fixed)  
Order header drops the word **standard**.

### sr 16 · Tanmay 11
**Type:** Bug (fixed)  
“Order goes to trader…” only when Your paths ticket is **me**. Hidden when every mill on the pack is **mill** (Direct).

### sr 42 · Tanmay 2 + 4
Mixed Selection: **This becomes N orders — …**; no single Order goes to. × removes the design from Selection.

### sr 8 · Tanmay 1 — and sr 9 · 2 + 6, sr 10 · 2 + 6
**Type:** Bug (fixed)  
Placeholder is now `Search supplier, collection or design` on both the idle bar and the field. No GST.

### sr 8 · Tanmay 2
**Type:** Bug (fixed)  
`womens_apparel` prints as `Women's apparel` on feed / search / design / shop tags.

---

## Small copy / chrome (not a redesign)

One line, one label, or one extra/missing bit of chrome. Say **fix sr N**.

| sr | Point | What’s wrong | What we do |
|---|---|---|---|
| **8** | T4 | Card says **Connected**; “3d ago” sits where Follow should be | Drop Connected. Follow if not connected. Move date to the bottom of the post |
| **9 / 10** | T1 | **GST verified** as a text label | One tick beside the name everywhere (search, feed, profile) |
| **9 / 10** | T3 | Supplier row is only city | Under the name: `Surat · Fabric, Dress material` |
| **12 / 15** | T6 | Raw category keys on the shop | Human labels (same as sr 8 T2; shop tags already use this) |
| **16** | T3 | Header is only “9 designs” | Add rate band: `9 designs · ₹280–₹445 /mtr` |
| **16** | T4 | No verified tick by the supplier in the pack header | Tick beside the shop name |
| **16** | T9 | No select hint | Quiet line: long-press or tap to select more than one |
| **17** | T3 | Design popup may omit the shop | Supplier name on the card |
| **23** | T4 | Own name on My designs | Date only *(done)* |
| **31** | T3 | Reshare is a sentence, not a control | On/off, not a statement |
| **33** | T3 | URL is `/broadcast`, screen is Buyer groups | Rename the route to match |
| **47** | T3 | Word **standard** where the channel should be | Dropped *(done)* |
| **77** | T2 | Network subtitle about connections / follows / invites | Remove that subtitle (keep the screens) |
| **88** | T6 | Profile doesn’t say you control who sees collections | One plain line on Business profile |
| **89** | T1 | Own shop still feels like a stranger (Follow / Request) | Owner: Edit · Share only (Preview as buyer is extra — skip unless you want it) |

**Not on this table (bigger than copy):** Explore Save/Repost/Send row (sr 8 T3), search View all (sr 9 T4), empty-search invite (sr 11), Instagram profile (sr 12), collection six-box grid (sr 16 T1–2), design chip row (sr 17), Saved grouping (sr 18), upload two-page (sr 27), Network follow-only (sr 13–14, 77–81), first-run popup (sr 3).

Palak marked login **sr 1–2** done on the sheet (tagline / full-bleed). We did not ship those.
