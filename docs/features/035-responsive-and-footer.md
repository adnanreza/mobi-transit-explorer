# Feature 035 - Responsive Polish & Footer

Branch: `feature/responsive-footer`

## Goal

Make the experience genuinely good on phones and tablets (not just desktop),
and replace the congested footer with a clean, linked reference layout. Driven
by a hands-on breakpoint audit (390px and 768px, real rendered screenshots).

## Findings & fixes

- **Opportunities table broke on mobile (real bug):** the 5-column table clipped
  the Evidence and Priority columns off-screen with unreachable content and huge
  empty row gaps. Now renders as **stacked cards below `md`** (rank + priority,
  station, type, full evidence) and the ranked table at `md+`. Eliminates the
  page's only horizontal overflow.
- **Congested footer → clean linked footer:** replaced the two run-on paragraphs
  with a responsive multi-column footer (Built by · Data sources · Basemap),
  every reference now a real link (Mobi system data, Mobi GBFS, City of
  Vancouver Open Data, Environment & Climate Change Canada, OpenFreeMap,
  OpenStreetMap), with the non-affiliation + licence disclaimer on its own row.
  Stacks on mobile, 4-up on desktop.
- **Nav wrapped "Nine years" to two lines at every width:** added
  `whitespace-nowrap` + `shrink-0`; hid the mobile scroll-strip scrollbar
  (`.no-scrollbar`) for a cleaner sticky header.
- **Map buried under filters on mobile:** the Explorer grid now uses `order`
  so the **map leads on mobile** (controls and detail follow); the `xl`
  3-column layout (controls · map · detail) is unchanged.
- **Flows ranked lists** reflow cleanly on mobile (flexible truncating names,
  decorative bars hidden below `sm`).
- **Hero copy:** bounded the leftover "every trip file ever published" overclaim
  (the App.tsx twin of the README fix from spec 034).

## Verification

72 Vitest + typecheck + build pass; breakpoint review at 390/768/1440 confirms
no horizontal overflow, readable opportunities on mobile, clean footer and nav,
map-first mobile ordering, intact desktop columns; deploy.
