# Feature 005 - Filter Panel

Branch: `feature/filter-panel`

## Goal

Create filter controls that make the app feel interactive and analytical.

## Scope

Build `src/components/FilterPanel.tsx` to control shared app state.

## Filters

- Month: April 2026, May 2026
- Day type: All, Weekday, Weekend
- Time of day: All, Morning commute, Midday, Evening commute, Late night
- Bike type: All, Classic, E-bike
- Transit distance: 150m, 300m, 500m

## shadcn/ui Components

Use `Select`, `Button`, `Badge`, `Card`, and `Separator`.

## Behavior

- Filters update shared app state.
- The UI visibly reflects selected filters.
- Filtering can be lightweight for MVP but should feel real.
- Include a reset filters action.

## Tests

- Filter labels render.
- User can change filter values.
- Reset restores defaults.
- Filter state is passed upward.

## Acceptance Criteria

- Filter state works.
- UI feels interactive.
- Filters are not static decoration.
- Styling is consistent with shadcn/Tailwind.
