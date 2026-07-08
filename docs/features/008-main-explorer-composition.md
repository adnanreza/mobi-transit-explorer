# Feature 008 - Main Explorer Composition

Branch: `feature/main-explorer-composition`

## Goal

Combine filters, map, and station details into the main dashboard experience.

## Scope

Create `src/components/Explorer.tsx`.

## Layout

Desktop:

- Left: Filter panel
- Center: Mobility map
- Right: Station detail panel

Mobile/tablet:

- Filters stack above map or collapse.
- Station detail appears below map or uses a shadcn `Sheet`.

## Behavior

- Filter state lives at the explorer level.
- Selected station state lives at the explorer level.
- Map updates selected station.
- Detail panel reflects selected station.
- Filters visually influence the map or displayed context.

## Tests

- Explorer renders filters, map, and detail panel.
- Selecting a station updates detail panel.
- Changing filters updates displayed filter state.
- Reset filters works.

## Acceptance Criteria

- The core app experience works.
- State flow is clean.
- Components remain reusable.
- The product idea is clear without explanation.
