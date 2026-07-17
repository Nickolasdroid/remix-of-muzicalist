# Admin Platform Foundation

The Admin Platform Foundation is a set of shared UI primitives, hooks, action
patterns and layout utilities that every admin module in Muzicalist must reuse.
It exists so that new modules (users, artists, bookings, ads, moderation, etc.)
inherit the same look, feel and behavior as the Communications module without
re-implementing tables, filters, drawers, confirmations or realtime plumbing.

## Contents

- [Component usage](./components.md) — DataTable, FilterBar, SearchBar,
  BulkActionBar, StatusBadge, EmptyState, ErrorState, LoadingState,
  ConfirmDialog, DetailsDrawer, PageHeader, StatsCard/Grid, Toolbar,
  SectionCard, PageContainer, RowActions.
- [Hooks](./hooks.md) — `usePagination`, `useSorting`, `useFiltering`,
  `useSelection`, `useConfirmAction`, `useRealtimeTable`.
- [Action pattern](./actions.md) — Canonical admin action ids and presets.
- [Design guide](./design-guide.md) — Naming, folders, state, realtime,
  spacing, error handling.
- [Migration report](./migration-report.md) — What we extracted, where it came
  from, and which future modules can consume it.

## Import surface

```ts
// UI primitives + row actions menu
import {
  DataTable,
  FilterBar,
  SearchBar,
  BulkActionBar,
  StatusBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  ConfirmDialog,
  DetailsDrawer,
  PageHeader,
  PageContainer,
  StatsCard,
  StatsGrid,
  Toolbar,
  SectionCard,
  RowActions,
} from "@/components/admin/platform";

// Hooks
import {
  usePagination,
  useSorting,
  useFiltering,
  useSelection,
  useConfirmAction,
  useRealtimeTable,
} from "@/hooks/admin";

// Action pattern
import { ADMIN_ACTIONS, type AdminAction } from "@/lib/adminActions";
```

## Non-goals

- Not a redesign of existing pages.
- Not a replacement for shadcn primitives — it composes them.
- Not tied to any specific data source; hooks are storage-agnostic.
