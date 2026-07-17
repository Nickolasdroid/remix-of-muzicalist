# Admin Components

All components live under `src/components/admin/platform/` and are re-exported
from the barrel `@/components/admin/platform`.

## DataTable

Single reusable table for every admin list.

- Props: `columns`, `rows`, `getRowId`, `loading`, `error`, `onRetry`,
  `emptyTitle`, `emptyDescription`, `emptyAction`, `onRowClick`,
  `selectedIds`, `onToggleSelect`, `onToggleSelectAll`, `sortKey`,
  `sortDirection`, `onSortChange`.
- Handles loading / empty / error states internally by delegating to
  `LoadingState`, `EmptyState`, `ErrorState`.
- Columns declare `id`, `header`, `cell`, optional `sortable`, `align`,
  `className`.

## FilterBar / SearchBar / BulkActionBar

- `SearchBar` — standard debounced-friendly search input with icon.
- `FilterBar` — flex container that wraps arbitrary filter controls; supports
  a right-aligned `actions` slot for reset / secondary buttons.
- `BulkActionBar` — sticky bar that appears when rows are selected; renders
  action buttons plus a clear button.

## StatusBadge

Pill component with six tones: `neutral`, `info`, `success`, `warning`,
`danger`, `muted`. Use for lifecycle labels (Draft, Published, Sending,
Failed, Archived, etc.).

## Empty / Error / Loading states

Standardized placeholders. All accept a `className` and render inside a
consistent dashed container so lists feel cohesive.

## ConfirmDialog

Wraps shadcn's AlertDialog with `tone: "danger"` styling for destructive
confirmations. Prefer using it via the `useConfirmAction` hook.

## DetailsDrawer

Right-side sheet used for row inspection. Fixed max-width, sticky header /
footer, scrollable body. Use instead of navigating to a detail page for
lightweight inspection.

## PageHeader / StatsCard / StatsGrid / Toolbar / SectionCard / PageContainer

Layout utilities:

- `PageContainer` — page-level responsive wrapper (`max-w-7xl`, standardized
  padding and vertical rhythm).
- `PageHeader` — title, description, breadcrumbs, right-aligned actions.
- `StatsGrid` + `StatsCard` — 1 / 2 / 4-column KPI strip.
- `Toolbar` — horizontal `leading` / `trailing` slots for filters vs primary
  actions.
- `SectionCard` — cardified content section with title, description, actions,
  standardized body spacing.

## RowActions

Renders a `MoreHorizontal` dropdown from an array of `AdminAction`s. Groups
destructive actions in their own section and delegates confirmation to the
host page via `onRequestConfirm` when the action defines `confirm`.
