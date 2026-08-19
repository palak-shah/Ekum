## Summary
- Traveling browse shortlist across Explore, albums, Saved, and business shop (Select / long-press → sticky Curate / Order dock).
- Multi-supplier `POST /orders/batch` with confirmation links per supplier chat.
- Curated publish Who ceiling: fade invalid audiences; keep publish errors in the sheet (not under Name).
- Business shop: 2-col grid, design select, connected contact name (phone only if opted in).
- Explore businesses: feed rows + directory tiles — no fake “N designs” collage.

## Test plan
- [ ] Explore: long-press design → dock stays while scrolling; no Select beside search
- [ ] Album: Select / Select all → Order or Ask rates clears selection (e2e `collections.journey` passes)
- [ ] Business shop Designs: Select + long-press → same shortlist dock
- [ ] Connected company: contact name; phone only when `showPhone`
- [ ] Curated pack Visibility: wider Who options disabled; no sticky red under Name
- [ ] Multi-supplier Order: two suppliers → confirm sheet with per-chat links
- [ ] Explore Businesses tab: 2-col tiles; shelves show buys/sells line not album collage
