// Shared moderation types — mirrored from database enums.
// The DB enums are the source of truth; keep these in sync when either changes.

export type ModerationCaseStatus =
  | "open"
  | "triaged"
  | "in_review"
  | "waiting_for_response"
  | "resolved"
  | "closed"
  | "reopened";

export type ModerationPriority = "low" | "medium" | "high" | "critical";

export type ModerationEventType =
  | "case_created"
  | "case_assigned"
  | "case_unassigned"
  | "status_changed"
  | "priority_changed"
  | "category_changed"
  | "report_added"
  | "evidence_added"
  | "note_added"
  | "action_applied"
  | "action_reversed"
  | "decision_changed"
  | "appeal_received"
  | "case_reopened"
  | "case_resolved"
  | "case_closed"
  | "system_note";

/** Seeded category keys. New keys can be added at runtime without code changes. */
export type ModerationCategoryKey =
  | "spam"
  | "harassment"
  | "fake_profile"
  | "inappropriate_content"
  | "copyright"
  | "impersonation"
  | "fraud"
  | "other"
  | (string & {});

/** Seeded target types. */
export type ModerationTargetTypeKey =
  | "artist"
  | "user"
  | "post"
  | "review"
  | "advertisement"
  | "gallery_image"
  | "video"
  | "comment"
  | "message"
  | (string & {});

/** Seeded action types. */
export type ModerationActionKey =
  | "warn"
  | "request_info"
  | "hide_content"
  | "remove_content"
  | "restore_content"
  | "suspend_user"
  | "ban_user"
  | "escalate"
  | "dismiss"
  | "no_action"
  | (string & {});

export interface ModerationCase {
  id: string;
  case_number: string;
  status: ModerationCaseStatus;
  priority: ModerationPriority;
  category_id: string;
  target_type_id: string;
  target_id: string;
  target_snapshot: unknown | null;
  reporter_id: string | null;
  assigned_moderator_id: string | null;
  title: string;
  summary: string | null;
  resolution_notes: string | null;
  resolution_action_id: string | null;
  metadata: Record<string, unknown>;
  reports_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  triaged_at: string | null;
  first_review_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  reopened_at: string | null;
}

export interface ModerationCaseListRow {
  id: string;
  case_number: string;
  status: ModerationCaseStatus;
  priority: ModerationPriority;
  category_key: string;
  category_label: string;
  target_type_key: string;
  target_id: string;
  title: string;
  summary: string | null;
  reporter_id: string | null;
  assigned_moderator_id: string | null;
  reports_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  total_count: number;
}

export interface ModerationCaseNote {
  id: string;
  case_id: string;
  author_id: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface ModerationEvidence {
  id: string;
  case_id: string;
  kind: string;
  url: string | null;
  content: string | null;
  snapshot: unknown | null;
  added_by: string | null;
  created_at: string;
}

export interface ModerationAction {
  id: string;
  case_id: string;
  action_type_id: string;
  performed_by: string | null;
  target_type_id: string | null;
  target_id: string | null;
  reason: string | null;
  parameters: Record<string, unknown>;
  is_reversed: boolean;
  reversed_by: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
  created_at: string;
}

export interface ModerationCaseEvent {
  id: string;
  case_id: string;
  event_type: ModerationEventType;
  actor_id: string | null;
  actor_role: string | null;
  from_value: unknown | null;
  to_value: unknown | null;
  payload: Record<string, unknown>;
  message: string | null;
  created_at: string;
}

export interface ModerationCaseDetails {
  case: ModerationCase;
  category: { id: string; key: string; label: string; default_priority: ModerationPriority };
  target_type: { id: string; key: string; label: string; table_name: string | null };
  reports_count: number;
  evidence_count: number;
  notes_count: number;
  actions_count: number;
  events_count: number;
}
