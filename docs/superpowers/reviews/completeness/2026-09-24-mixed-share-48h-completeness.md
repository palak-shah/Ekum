# Feature Completeness Review — Mixed share keeps 48h (two doors)

**Date:** 2026-09-24  
**Module / ask:** Selection Share of 1 collection + 1 design already posts two chat cards; do not hide **Share a link · 48 hours** — mint one 48h door per chat unit  
**Anchors:** `docs/features/explore.md`, `docs/features/collections.md`, `2026-09-16-design-album-share`, `2026-08-22-share-link-48h`  
**Disposition:** Proceed

> Completeness keeps Ekum **coherent**. A mix is two doors, not one fake Collection and not a hidden 48h row.

---

## Lenses

| Lens | Summary findings |
|------|------------------|
| Product Manager | Off-app share must match chat: pack card + design card. Hiding 48h on a mix forces WhatsApp-only traders to skip the door. |
| UX Designer | Same quiet **Share a link · 48 hours**. One tap. Both URLs in the message body (WhatsApp drops extra `url` fields). Toast names N when copied. |
| Solution Architect | Existing XOR `POST /share-links` — N sequential posts. No batch token. No combined kind. |

---

## Platform consistency (required)

1. **Existing patterns?** CatalogShareSheet 48h row; share-link kinds `collection` / `product` / `designs`.  
2. **Duplicates another feature?** No — not Curate, not a virtual pack.  
3. **Should reuse an existing workflow?** Reuse mint + `shareOrCopyInvite`; one control.  
4. **Naming matches the app?** **Share a link · 48 hours**; **N links copied · 48 hours**.

**Philosophy conflict?** No.

---

## Checklist scan

| Area | Status | Notes |
|------|--------|-------|
| Functionality | OK | One door per chat unit |
| Business rules | OK | Same shareability as each card |
| Workflows | OK | Same sheet footer |
| Edge cases | OK | 2 albums; 1 album + 2+ designs; solo unchanged |
| Permissions | OK | Existing POST |
| User states | OK | Empty network still shows 48h |
| Notifications | N/A | |
| Error handling | OK | In-sheet notice; do not share a partial set |
| Scalability | OK | Typical 1–few units |
| Mobile interactions | OK | Footer CTA + quiet link; BM-07 unchanged |
| Accessibility | OK | Same control |
| Platform consistency | OK | |

---

## Approved scope for this slice

- `canLink` when at least one shareable unit exists (including mix).  
- Each album → `collectionId`; 1 leftover design → `productId`; 2+ leftover designs → `productIds`.  
- One OS share / copy; all URLs in the body. Toast **N links copied · 48 hours** when N>1.

## Explicitly deferred / rejected

- One combined token or fake Collection.  
- Chat attach ＋ (still separate Send cards).  
- New e2e (unit covers mint).

## Sign-off

Required gaps closed or deferred in writing: Yes  
Ready for implementation: Yes  
