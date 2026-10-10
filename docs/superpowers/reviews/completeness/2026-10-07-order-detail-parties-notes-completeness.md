# Feature Completeness Review — Order detail parties, notes, and ⋯ menus

**Date:** 2026-10-07  
**Module / ask:** Order detail: party lines without Parties header/(you); chat icon; remove Your move; shared Manual order no.; private Personal note; action-sheet notes with + (voice · photo); line notes on Edit order (text-only, no +).  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/orders.md`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. It does not make every request work. Conflicts with product philosophy → **Reject** or **Redesign**, not document-and-build.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Traders need book numbers and private scratch notes without cluttering the face with “Your move.” Manual ref is bilateral; personal note is company-only. Action sheets already take notes — + for voice/photo matches chat attach judgment. Line notes stay quiet text. |
| UX Designer | Drop Parties title and (you). Role-based one counterpart line (buyer ↔ selling party; seller ↔ purchase party); trader / tri-visible see both. Open chat = icon only. Top foam = personal note preview or empty — no action cue banner. ⋯: Manual order no. · Personal note · Complaint last. |
| Solution Architect | Manual fields on `Order` (shared). New `OrderCompanyNote` per (orderId, companyId). Extend note DTOs with optional image media ids; trail stores images in payload or column. Reuse media upload + voice recorder. Amend already allows item.note — wire UI. |

---

## Platform consistency (required)

1. **Existing patterns?** Sheet + Field; quiet party card; ⋯ rare last; NoteVoiceField → NoteAttachField with + tray like chat attach.  
2. **Duplicates another feature?** No — Manual ≠ system `Order #`; Personal ≠ shared create/trail note.  
3. **Should reuse an existing workflow?** Media upload, voice caps, complaint photo cap (≤9).  
4. **Naming matches the app?** Purchase party / Selling party; Manual order no.; Personal note; Open chat via aria only.

**Philosophy conflict?** Removing **Your move** is intentional redesign of detail chrome (dock still carries the job). Soft-hide mills unchanged — party block is hop shops only.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | Manual shared; personal private; + on action notes; amend line notes |
| Business rules | OK | Personal never cross-company; manual visible to both parties on ticket |
| Workflows | OK | ⋯ sheets; amend HowManyLineNote |
| Edge cases | OK | Empty personal → no top slot; empty manual → quiet |
| Permissions | OK | Viewers of order may edit manual; personal = caller company only |
| User states | OK | Buyer / seller / trader / tri-visible party lines |
| Notifications | N/A | No push for personal/manual in this slice |
| Error handling | OK | InlineNotice / toast on sheet save fail |
| Scalability | OK | One personal row per company; image cap 9 |
| Mobile interactions | OK | Sheets above dock; BM-07 clearance unchanged |
| First glance (BM-11) | OK | Items + dock louder than party/meta |
| Accessibility | OK | Chat icon aria-label; menu labels |
| Platform consistency | OK | |

---

## Gaps

### G-001 — Your move removal

| Field | Content |
|-------|---------|
| Gap | Detail foam cue removed; list Needs you unchanged |
| Why it matters | Docs promised Your move on detail |
| Impact if ignored | Doc drift |
| Recommendation | Lock in orders.md; rely on sticky dock |
| Priority | Required before implementation |

### G-002 — Soft-hide vs tri-visible

| Field | Content |
|-------|---------|
| Gap | Mill names stay off Manage parent |
| Why it matters | Toll chain |
| Impact if ignored | Leak mills |
| Recommendation | Party block = buyer + seller/trader on hop only; mills on mill cards |
| Priority | Required before implementation |

---

## Approved scope for this slice

- Party lines: no header, no (you); role-based Purchase / Selling party; trader + tri-visible both lines  
- Open chat → ChatIcon only  
- Remove Your move; Personal note preview when set  
- ⋯ Manual order no. (shared number + note + images) · Personal note (private text + voice + images) · Complaint last  
- Action sheets: NoteAttachField (+ voice · photo)  
- Edit order: HowManyLineNote + persist item.note; display on detail  

## Explicitly deferred / rejected

- Orders **list** card redesign (separate ask)  
- Voice on Manual order no. sheet  
- Voice/photo on line item notes  
- Notifications for manual/personal note edits  

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation / `@functional` journeys: Yes  
