# Feature Completeness Review — Business Profile Completeness Nudge (3D)

**Date:** 2026-11-16  
**Module / ask:** Owner-only Home prompt: "Only you see this · Complete your business profile"  
**Anchors:** `docs/features/00-concepts.md`, `docs/features/company.md`, `docs/features/home.md`, `docs/features/settings.md`  
**Disposition:** **Proceed** — UX approved 2026-11-16; implement with Showcase grid/feed browse in the same slice.

## Locked UX

- Placement: after Home pills, before Showcase.
- Gaps (priority, max 3): logoUrl, coverUrl, about, sellCategories.
- Dismiss: localStorage fingerprint of incomplete set.
- Exclude: phones, GST verification/GSTIN, visitor/stub, yellow banner.

## Showcase browse (same slice)

View Showcase → Sheet grid/feed (BrowseLayoutToggle) → PhotoViewer on tap. No Select/rates.

## Gaps retained

### G-001 — Contact phones lack edit UI
Exclude from nudge until edit surface ships.

### G-002 — GSTIN vs verification (FG-003)
Do not nudge verification.
