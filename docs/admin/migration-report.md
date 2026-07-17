# Admin Platform Migration Report

## Scope

Extract a reusable Admin Platform Foundation from the Communications module
without modifying existing pages. No behavior changes.

## Reusable components extracted

Located under `src/components/admin/platform/`:

| Component        | Origin / Inspiration                                  | Purpose                                            |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `DataTable`      | `AdminEmailCampaigns.tsx`, `AdminEmailTemplates.tsx`  | Uniform list rendering with loading/empty/error    |
| `FilterBar`      | `AdminEmailTemplates.tsx` filter row                  | Toolbar container for filter controls              |
| `SearchBar`      | Search inputs across Campaigns / Templates            | Standard search input                              |
| `BulkActionBar`  | New (foundation for future bulk operations)           | Sticky bar when selection > 0                      |
| `StatusBadge`    | `CampaignStatusBadge`, `CampaignDbStatusBadge`        | Generic tone-based pill                            |
| `EmptyState`     | Templates empty state                                 | Consistent empty screens                           |
| `ErrorState`     | Ad-hoc error markup in Campaigns                      | Consistent error screens                           |
| `LoadingState`   | Ad-hoc spinners across admin pages                    | Consistent loading placeholder                     |
| `ConfirmDialog`  | `CampaignConfirmDialog`, cancel confirm dialog        | Generic confirm w/ danger tone                     |
| `DetailsDrawer`  | Recipient drawer in `AdminEmailCampaigns.tsx`         | Row inspection sheet                               |
| `PageHeader`     | Header markup repeated in admin pages                 | Title/description/breadcrumbs/actions              |
| `StatsCard/Grid` | KPI cards on Communications dashboard                 | Standard KPI strip                                 |
| `Toolbar`        | Toolbar rows in Campaigns / Templates                 | Leading/trailing action layout                     |
| `SectionCard`    | Cardified sections throughout the module              | Body sections with header                          |
| `PageContainer`  | Page-level `max-w-*` wrappers                         | Responsive spacing wrapper                         |
| `RowActions`     | Ad-hoc dropdowns in Templates / Campaigns             | Standard `…` menu driven by `AdminAction`          |

Existing module-specific badges (`CampaignStatusBadge`,
`CampaignDbStatusBadge`) are left untouched; new modules should reach for
`StatusBadge` directly.

## Hooks extracted

Located under `src/hooks/admin/`:

| Hook               | Purpose                                                     |
| ------------------ | ----------------------------------------------------------- |
| `usePagination`    | Page state + PostgREST `from`/`to` bounds                   |
| `useSorting`       | Sort key + direction with a client-side `compare()` helper  |
| `useFiltering`     | Object filter state with `activeCount` + reset              |
| `useSelection`     | Multi-row selection tuned for `DataTable`                   |
| `useConfirmAction` | Two-step confirm pattern with toast handling                |
| `useRealtimeTable` | Re-export of the existing Supabase Realtime hook            |

## Utilities extracted

- `src/lib/adminActions.tsx` — Canonical `AdminAction<Row>` contract,
  `AdminActionId` union, and `ADMIN_ACTIONS` presets for view / edit /
  duplicate / archive / delete / retry / cancel / approve / reject.
- `getAvailableActions(actions, row)` filter helper.

## Documentation

- `docs/admin/README.md` — index and import surface.
- `docs/admin/components.md` — per-component API.
- `docs/admin/hooks.md` — per-hook API.
- `docs/admin/actions.md` — action pattern & wiring recipe.
- `docs/admin/design-guide.md` — naming, folders, state, realtime, spacing,
  errors.

## Existing pages

Untouched. `AdminEmailCampaigns`, `AdminCampaignDetail`, `AdminEmailTemplates`,
`AdminNewCampaign`, and `AdminDashboard` continue to use their current
implementations. Migration to the platform primitives can happen incrementally
without user-visible changes.

## Future modules that can consume the foundation

Every planned admin surface benefits immediately:

- **Users & Artists Management** — DataTable + Filters + BulkActions +
  RowActions (approve/reject verification, archive, delete).
- **Verification Queue** — DataTable + DetailsDrawer + approve/reject actions.
- **Bookings Admin** — DataTable + StatusBadge (pending/approved/rejected) +
  cancel / retry actions.
- **Ads & Promotions Moderation** — DataTable + FilterBar + approve/reject
  actions + StatsGrid for daily volume.
- **Subscriptions & Payments** — StatsGrid (MRR, ARPU, churn) + DataTable of
  invoices + retry/cancel actions.
- **Reviews Moderation** — DataTable + reject/delete + DetailsDrawer.
- **Support Tickets / Contact Inbox** — DataTable + DetailsDrawer + realtime
  status.
- **Feature Flags / Announcements** — SectionCard forms + StatusBadge +
  archive/duplicate.
- **Audit Log** — DataTable + FilterBar + realtime.

## Non-goals confirmed

- No visual redesigns.
- No behavior changes to Communications.
- No new end-user features.
