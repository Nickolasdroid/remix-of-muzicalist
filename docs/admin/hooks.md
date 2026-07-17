# Admin Hooks

Reusable state hooks that keep every admin module consistent. All are exported
from `@/hooks/admin`.

## usePagination

Client-side pagination state with PostgREST-friendly range bounds.

```ts
const p = usePagination({ pageSize: 25, total });
supabase.from("x").select("*").range(p.from, p.to);
```

Returns: `page`, `pageSize`, `totalPages`, `from`, `to`, `canPrev`, `canNext`,
`setPage`, `next`, `prev`, `setPageSize`, `reset`.

## useSorting

```ts
const s = useSorting<"created_at" | "name">({ initialKey: "created_at" });
const sorted = s.compare(rows, (row, key) => row[key]);
```

`toggle(key)` sets the key and flips direction; `compare()` is a pure sort
helper for client-side lists.

## useFiltering

Typed object state with `activeCount` (based on differences from the initial
values). Use to drive the `FilterBar` reset button.

```ts
const f = useFiltering({ q: "", status: "all" as Status });
f.setFilter("status", "sent");
f.reset();
```

## useSelection

Multi-row selection tuned to plug straight into `DataTable`.

```ts
const sel = useSelection();
<DataTable
  selectedIds={sel.selected}
  onToggleSelect={sel.toggle}
  onToggleSelectAll={() => sel.toggleAll(rows.map(r => r.id))}
/>
```

## useConfirmAction

Two-step confirm pattern for destructive actions. Pair with `ConfirmDialog`
and `RowActions`.

```ts
const confirm = useConfirmAction();
confirm.request(
  { title: "Delete?", tone: "danger", successMessage: "Deleted" },
  () => api.delete(id),
);
```

## useRealtimeTable

Existing hook, re-exported so hooks are importable from a single namespace.
See `src/hooks/useRealtimeTable.ts` for the full contract.
