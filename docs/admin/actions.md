# Admin Action Pattern

Every admin module must express row-level and bulk operations through the
`AdminAction<Row>` contract in `src/lib/adminActions.tsx`.

## Canonical action ids

`view`, `edit`, `duplicate`, `archive`, `delete`, `retry`, `cancel`,
`approve`, `reject`.

Modules may add domain-specific ids (e.g. `send-test`), but the shared ids
must keep their icon, label and tone.

## Contract

```ts
interface AdminAction<Row> {
  id: AdminActionId | string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  confirm?: { title; description?; confirmLabel?; tone? };
  isAvailable?: (row) => boolean;
  isDisabled?: (row) => boolean;
  onSelect: (row) => void | Promise<void>;
}
```

## Presets

`ADMIN_ACTIONS.view/edit/duplicate/archive/delete/retry/cancel/approve/reject`
return prewired `AdminAction` objects. Spread and override as needed:

```ts
const actions: AdminAction<Campaign>[] = [
  ADMIN_ACTIONS.view(openDetails),
  ADMIN_ACTIONS.duplicate(duplicate),
  { ...ADMIN_ACTIONS.retry(retry), isAvailable: (c) => c.status === "failed" },
  { ...ADMIN_ACTIONS.cancel(cancel), isAvailable: (c) => c.status === "sending" },
  ADMIN_ACTIONS.delete(remove),
];
```

## Wiring with RowActions + useConfirmAction

```tsx
const confirm = useConfirmAction();
<RowActions
  row={row}
  actions={actions}
  onRequestConfirm={(action, r) =>
    confirm.request(
      {
        title: action.confirm!.title,
        description: action.confirm!.description,
        confirmLabel: action.confirm!.confirmLabel,
        tone: action.confirm!.tone,
        successMessage: `${action.label} succeeded`,
      },
      () => action.onSelect(r),
    )
  }
/>
<ConfirmDialog
  open={confirm.open}
  onOpenChange={confirm.setOpen}
  title={confirm.config?.title ?? ""}
  description={confirm.config?.description}
  confirmLabel={confirm.config?.confirmLabel}
  tone={confirm.config?.tone}
  loading={confirm.loading}
  onConfirm={confirm.confirm}
/>
```

Result: every admin module confirms destructive actions the same way, uses
the same icons, and surfaces the same toast copy.
