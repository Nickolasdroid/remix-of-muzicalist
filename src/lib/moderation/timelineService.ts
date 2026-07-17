// ModerationTimelineService
//
// The moderation timeline is written *exclusively* by database triggers —
// application code MUST NOT insert into `moderation_case_events` directly.
// This service is the read side: it fetches the immutable event stream and
// exposes helpers to shape it for the UI (formatting, grouping, iconography
// hints) without ever mutating history.
//
// The list of event types emitted by the database is enumerated here so the
// UI can render every one exhaustively.

import { supabase } from "@/integrations/supabase/client";
import { mapPostgresError, ModerationError } from "./errors";
import type { ModerationCaseEvent, ModerationEventType } from "./types";

export const EMITTED_EVENT_TYPES: readonly ModerationEventType[] = [
  "case_created",
  "case_assigned",
  "case_unassigned",
  "status_changed",
  "priority_changed",
  "category_changed",
  "report_added",
  "evidence_added",
  "note_added",
  "action_applied",
  "action_reversed",
  "case_resolved",
  "case_closed",
  "case_reopened",
] as const;

const TITLES: Record<ModerationEventType, string> = {
  case_created: "Case created",
  case_assigned: "Moderator assigned",
  case_unassigned: "Moderator unassigned",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  category_changed: "Category changed",
  report_added: "Report added",
  evidence_added: "Evidence added",
  note_added: "Note added",
  action_applied: "Action applied",
  action_reversed: "Action reversed",
  decision_changed: "Decision changed",
  appeal_received: "Appeal received",
  case_reopened: "Case reopened",
  case_resolved: "Case resolved",
  case_closed: "Case closed",
  system_note: "System note",
};

export function formatEventTitle(e: Pick<ModerationCaseEvent, "event_type">): string {
  return TITLES[e.event_type] ?? e.event_type;
}

/**
 * Guard used in tests and defensive code paths to prove no writer touches the
 * timeline directly. Throws if called.
 */
export function assertNoDirectTimelineWrites(): never {
  throw new ModerationError("MOD_PERMISSION_DENIED", {
    hint: "moderation_case_events is append-only via database triggers",
  });
}

export const ModerationTimelineService = {
  emittedEventTypes: EMITTED_EVENT_TYPES,
  formatEventTitle,
  assertNoDirectTimelineWrites,

  async getTimeline(caseId: string): Promise<ModerationCaseEvent[]> {
    const { data, error } = await (supabase.rpc as any)("get_moderation_case_timeline", {
      _case_id: caseId,
    });
    if (error) throw mapPostgresError(error);
    return (data ?? []) as ModerationCaseEvent[];
  },
};

export type ModerationTimelineServiceType = typeof ModerationTimelineService;
