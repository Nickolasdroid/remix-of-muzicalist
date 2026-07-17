import { ReactNode } from "react";
import {
  Eye,
  Pencil,
  Copy,
  Archive,
  Trash2,
  RefreshCw,
  Ban,
  Check,
  X,
} from "lucide-react";

/**
 * Canonical admin action identifiers. Every module should map its row / bulk
 * actions to one of these ids so we can keep icons, labels and tone consistent
 * across the entire dashboard.
 */
export type AdminActionId =
  | "view"
  | "edit"
  | "duplicate"
  | "archive"
  | "delete"
  | "retry"
  | "cancel"
  | "approve"
  | "reject";

export interface AdminAction<Row = unknown> {
  id: AdminActionId | string;
  label: string;
  icon?: ReactNode;
  /** Optional destructive styling in menus and confirm dialogs. */
  destructive?: boolean;
  /** Whether this action should open a ConfirmDialog before running. */
  confirm?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    tone?: "default" | "danger";
  };
  /** Optionally hide/disable the action for a specific row. */
  isAvailable?: (row: Row) => boolean;
  isDisabled?: (row: Row) => boolean;
  onSelect: (row: Row) => void | Promise<void>;
}

/**
 * Presets for the most common admin actions. Consumers can spread and override
 * fields as needed: `{ ...ADMIN_ACTIONS.delete(handleDelete), confirm: {...} }`.
 */
export const ADMIN_ACTIONS = {
  view: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "view",
    label: "View",
    icon: <Eye className="h-4 w-4" />,
    onSelect,
  }),
  edit: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "edit",
    label: "Edit",
    icon: <Pencil className="h-4 w-4" />,
    onSelect,
  }),
  duplicate: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "duplicate",
    label: "Duplicate",
    icon: <Copy className="h-4 w-4" />,
    onSelect,
  }),
  archive: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "archive",
    label: "Archive",
    icon: <Archive className="h-4 w-4" />,
    confirm: {
      title: "Archive this item?",
      description: "It will be hidden from active lists but preserved for auditing.",
      confirmLabel: "Archive",
    },
    onSelect,
  }),
  delete: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "delete",
    label: "Delete",
    icon: <Trash2 className="h-4 w-4" />,
    destructive: true,
    confirm: {
      title: "Delete this item?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    },
    onSelect,
  }),
  retry: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "retry",
    label: "Retry",
    icon: <RefreshCw className="h-4 w-4" />,
    onSelect,
  }),
  cancel: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "cancel",
    label: "Cancel",
    icon: <Ban className="h-4 w-4" />,
    destructive: true,
    confirm: {
      title: "Cancel this operation?",
      description: "In-flight work will finish, but no new items will be processed.",
      confirmLabel: "Stop it",
      tone: "danger",
    },
    onSelect,
  }),
  approve: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "approve",
    label: "Approve",
    icon: <Check className="h-4 w-4" />,
    onSelect,
  }),
  reject: <Row,>(onSelect: (row: Row) => void): AdminAction<Row> => ({
    id: "reject",
    label: "Reject",
    icon: <X className="h-4 w-4" />,
    destructive: true,
    confirm: {
      title: "Reject this item?",
      description: "The submitter will be notified.",
      confirmLabel: "Reject",
      tone: "danger",
    },
    onSelect,
  }),
} as const;

/** Filter helper: keep only actions available for a given row. */
export function getAvailableActions<Row>(
  actions: AdminAction<Row>[],
  row: Row,
): AdminAction<Row>[] {
  return actions.filter((a) => (a.isAvailable ? a.isAvailable(row) : true));
}
