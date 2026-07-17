// ModerationService
//
// The ONLY entry point for moderation business operations from the client.
// Every method is a thin wrapper around a database RPC that already enforces
// authorization, validation, and audit logging. Client-side validation runs
// first (see `./validation`) so obvious mistakes fail fast without a
// round-trip; server-side validation remains authoritative.
//
// This service never inserts into `moderation_case_events` — the timeline is
// produced exclusively by database triggers (see `./timelineService`).

import { supabase } from "@/integrations/supabase/client";
import { mapPostgresError, ModerationError } from "./errors";
import { ModerationTimelineService } from "./timelineService";
import type {
  ModerationAction,
  ModerationActionKey,
  ModerationCase,
  ModerationCaseDetails,
  ModerationCaseListRow,
  ModerationCaseNote,
  ModerationCaseStatus,
  ModerationCategoryKey,
  ModerationEvidence,
  ModerationPriority,
  ModerationTargetTypeKey,
} from "./types";
import {
  assertTransition,
  validateAssignment,
  validateCreateCase,
  validateEvidence,
  validateNote,
  type AddEvidenceInput,
  type CreateCaseInput,
} from "./validation";

// Cast the Supabase client's `rpc` to a permissive signature. The generated
// types will pick up these RPCs on the next codegen; until then this keeps the
// service usable and type-safe at the call sites.
const rpc = (supabase.rpc as unknown) as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: any; error: any }>;

async function callRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(fn, args);
  if (error) throw mapPostgresError(error);
  return data as T;
}

export const ModerationService = {
  timeline: ModerationTimelineService,

  // ---- Create ----------------------------------------------------------

  async createCase(input: CreateCaseInput): Promise<ModerationCase> {
    validateCreateCase(input);
    return callRpc<ModerationCase>("create_moderation_case", {
      _category_key: input.category_key,
      _target_type_key: input.target_type_key,
      _target_id: input.target_id,
      _title: input.title.trim(),
      _summary: input.summary ?? null,
      _priority: input.priority ?? null,
      _reporter_id: input.reporter_id ?? null,
      _reporter_email: input.reporter_email ?? null,
      _reporter_reason: input.reporter_reason ?? null,
      _target_snapshot: input.target_snapshot ?? null,
      _metadata: input.metadata ?? {},
    });
  },

  // ---- Assignment ------------------------------------------------------

  async assignModerator(caseId: string, moderatorId: string, currentAssignee: string | null = null): Promise<ModerationCase> {
    validateAssignment(currentAssignee, moderatorId);
    return callRpc<ModerationCase>("assign_moderator", { _case_id: caseId, _moderator_id: moderatorId });
  },

  async unassignModerator(caseId: string): Promise<ModerationCase> {
    if (!caseId) throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "case_id required" });
    return callRpc<ModerationCase>("unassign_moderator", { _case_id: caseId });
  },

  // ---- Status / priority ----------------------------------------------

  async changeStatus(
    caseId: string,
    from: ModerationCaseStatus,
    next: ModerationCaseStatus,
    note?: string,
  ): Promise<ModerationCase> {
    assertTransition(from, next);
    return callRpc<ModerationCase>("change_case_status", {
      _case_id: caseId,
      _next_status: next,
      _note: note ?? null,
    });
  },

  async changePriority(caseId: string, priority: ModerationPriority): Promise<ModerationCase> {
    return callRpc<ModerationCase>("change_case_priority", { _case_id: caseId, _priority: priority });
  },

  // ---- Satellite writes ------------------------------------------------

  async addEvidence(input: AddEvidenceInput): Promise<ModerationEvidence> {
    validateEvidence(input);
    return callRpc<ModerationEvidence>("add_case_evidence", {
      _case_id: input.case_id,
      _kind: input.kind,
      _url: input.url ?? null,
      _content: input.content ?? null,
      _snapshot: input.snapshot ?? null,
    });
  },

  async addNote(caseId: string, body: string, isInternal = true): Promise<ModerationCaseNote> {
    validateNote(body);
    return callRpc<ModerationCaseNote>("add_case_note", {
      _case_id: caseId,
      _body: body.trim(),
      _is_internal: isInternal,
    });
  },

  async addAction(input: {
    case_id: string;
    action_key: ModerationActionKey;
    reason?: string;
    parameters?: Record<string, unknown>;
    target_type_key?: ModerationTargetTypeKey;
    target_id?: string;
  }): Promise<ModerationAction> {
    if (!input.case_id) throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "case_id required" });
    if (!input.action_key) throw new ModerationError("MOD_INVALID_ACTION");
    return callRpc<ModerationAction>("add_case_action", {
      _case_id: input.case_id,
      _action_key: input.action_key,
      _reason: input.reason ?? null,
      _parameters: input.parameters ?? {},
      _target_type_key: input.target_type_key ?? null,
      _target_id: input.target_id ?? null,
    });
  },

  async reverseAction(actionId: string, reason: string): Promise<ModerationAction> {
    if (!actionId) throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "action_id required" });
    return callRpc<ModerationAction>("reverse_case_action", { _action_id: actionId, _reason: reason });
  },

  // ---- Terminal transitions -------------------------------------------

  async closeCase(caseId: string, opts?: { resolution_notes?: string; resolution_action_key?: ModerationActionKey }): Promise<ModerationCase> {
    return callRpc<ModerationCase>("close_case", {
      _case_id: caseId,
      _resolution_notes: opts?.resolution_notes ?? null,
      _resolution_action_key: opts?.resolution_action_key ?? null,
    });
  },

  async reopenCase(caseId: string, reason?: string): Promise<ModerationCase> {
    return callRpc<ModerationCase>("reopen_case", { _case_id: caseId, _reason: reason ?? null });
  },

  // ---- Reads -----------------------------------------------------------

  async getCase(caseId: string): Promise<ModerationCaseDetails> {
    if (!caseId) throw new ModerationError("MOD_CASE_NOT_FOUND");
    return callRpc<ModerationCaseDetails>("get_moderation_case_details", { _case_id: caseId });
  },

  async listCases(filters: {
    statuses?: ModerationCaseStatus[];
    priorities?: ModerationPriority[];
    categoryKeys?: ModerationCategoryKey[];
    targetTypeKeys?: ModerationTargetTypeKey[];
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ModerationCaseListRow[]> {
    return callRpc<ModerationCaseListRow[]>("list_moderation_cases", {
      _statuses: filters.statuses ?? null,
      _priorities: filters.priorities ?? null,
      _category_keys: filters.categoryKeys ?? null,
      _target_type_keys: filters.targetTypeKeys ?? null,
      _assigned_to: filters.assignedTo ?? null,
      _search: filters.search ?? null,
      _limit: filters.limit ?? 50,
      _offset: filters.offset ?? 0,
    });
  },

  getTimeline: ModerationTimelineService.getTimeline,
};

export type ModerationServiceType = typeof ModerationService;
