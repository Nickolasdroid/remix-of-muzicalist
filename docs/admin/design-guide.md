# Admin Design Guide

## Component usage

- Always compose pages from `PageContainer` → `PageHeader` → optional
  `StatsGrid` → `Toolbar`/`FilterBar` → `DataTable` → optional
  `DetailsDrawer` / `ConfirmDialog`.
- Never build a bespoke table, empty state, or confirm dialog in a module.
  Extend the primitive instead.
- Use `StatusBadge` for every lifecycle label. Do not introduce ad-hoc pill
  colors.
- Use `RowActions` + `AdminAction` for every row menu. Direct icon buttons
  are only acceptable for a single always-visible primary action.

## Naming conventions

- Pages: `Admin<Domain>.tsx` (list) and `Admin<Domain>Detail.tsx` (detail).
  Nested routes: `/admin/<domain>` and `/admin/<domain>/:id`.
- Components: PascalCase, colocated in `src/components/admin/<domain>/`.
- Hooks: `use<Something>.ts`, camelCase, in `src/hooks/admin/` when
  cross-module, otherwise in `src/components/admin/<domain>/`.
- API modules: `src/lib/<domain>Api.ts` (pure functions returning promises).
- Types: colocated with the API module, exported by name.

## Folder conventions

```
src/
  components/admin/
    platform/          # shared primitives (do not fork)
    <domain>/          # module-specific components
  hooks/admin/         # shared hooks
  lib/
    adminActions.tsx   # canonical action registry
    <domain>Api.ts     # data access
  pages/
    Admin<Domain>.tsx
    Admin<Domain>Detail.tsx
docs/admin/            # this guide
```

## State management

- Local UI state: React `useState` + the shared hooks (`usePagination`,
  `useSorting`, `useFiltering`, `useSelection`).
- Server state: direct Supabase calls behind `src/lib/<domain>Api.ts`.
  Add React Query only when caching or invalidation genuinely helps.
- Never store admin-only state in localStorage unless it is user-preference
  (e.g. saved column visibility). Never store row data there.

## Realtime conventions

- Always subscribe with `useRealtimeTable`. Use a `filter` string when the
  page is scoped (`campaign_id=eq.<uuid>`).
- Surface connection status in the UI: reuse the "Live" / "Reconnecting"
  chip pattern from the Campaigns dashboard.
- Realtime is a UI accelerator, not a source of truth. Every mutation should
  still refetch or optimistically update; realtime only reconciles.

## Error handling

- API modules throw `Error` with human-readable messages.
- Pages catch and either:
  - Render an `ErrorState` inside the DataTable, or
  - Surface a destructive `toast()` for background operations.
- Destructive mutations always go through `ConfirmDialog` +
  `useConfirmAction`, which handles success/error toasts automatically.
- Never swallow errors silently. Log to console at minimum.

## Spacing & responsive rules

- All cards, inputs and dialogs use `rounded-lg` (project-wide).
- Page vertical rhythm: `gap-6` inside `PageContainer`, `gap-3` inside
  `SectionCard`.
- Tables scroll horizontally on mobile; do not hide columns silently unless
  the module explicitly implements column visibility controls.
- Prefer `Toolbar` (`sm:flex-row`) over custom flex layouts for filter rows.
