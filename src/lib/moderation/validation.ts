// Centralised moderation business rules.
//
// This module is the single source of truth for anything that could otherwise
// be duplicated across UI, service, and RPC layers: valid enum values,
// transition matrix, required fields, and permission predicates.
//
// The module is pure — no I/O, no Supabase dependency — so it is trivially
// unit-testable and safely reusable from the browser, from tests, and from
// edge functions.

import { ModerationError } from "./errors";
import type {
  ModerationActionKey,
  ModerationCaseStatus,
  ModerationCategoryKey,
  ModerationPriority,
  ModerationTargetTypeKey,
} from "./types";

export const CASE_STATUSES: readonly ModerationCaseStatus[] = [
  "open",
  "triaged",
  "in_review",
  "waiting_for_response",
  "resolved",
  "closed",
  "reopened",
] as const;

export const PRIORITIES: readonly ModerationPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const SEEDED_CATEGORIES: readonly string[] = [
  "spam",
  "harassment",
  "fake_profile",
  "inappropriate_content",
  "copyright",
  "impersonation",
  "fraud",
  "other",
] as const;

export const SEEDED_TARGET_TYPES: readonly string[] = [
  "artist",
  "user",
  "post",
  "review",
  "advertisement",
  "gallery_image",
  "video",
  "comment",
  "message",
] as const;

export const SEEDED_ACTIONS: readonly string[] = [
  "warn",
  "request_info",
  "hide_content",
  "remove_content",
  "restore_content",
  "suspend_user",
  "ban_user",
  "escalate",
  "dismiss",
  "no_action",
] as const;

/**
 * Allowed status transitions — mirrors `moderation_validate_transition()`
 * in the database. Both sides MUST agree.
 */
export const STATUS_TRANSITIONS: Readonly<Record<ModerationCaseStatus, readonly ModerationCaseStatus[]>> = {
  open: ["triaged", "in_review", "closed"],
  triaged: ["in_review", "waiting_for_response", "closed"],
  in_review: ["waiting_for_response", "resolved", "closed"],
  waiting_for_response: ["in_review", "resolved", "closed"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_review", "triaged", "closed"],
};

// ---- Predicates ----------------------------------------------------------

export const isValidStatus = (v: unknown): v is ModerationCaseStatus =>
  typeof v === "string" && (CASE_STATUSES as readonly string[]).includes(v);

export const isValidPriority = (v: unknown): v is ModerationPriority =>
  typeof v === "string" && (PRIORITIES as readonly string[]).includes(v);

/**
 * Returns true if the seeded taxonomy lists this key. Unknown values are NOT
 * rejected here — new categories/targets/actions can be added at runtime via
 * the lookup tables; final validation happens in the RPC.
 */
export const isSeededCategory = (v: unknown): v is ModerationCategoryKey =>
  typeof v === "string" && SEEDED_CATEGORIES.includes(v);
export const isSeededTargetType = (v: unknown): v is ModerationTargetTypeKey =>
  typeof v === "string" && SEEDED_TARGET_TYPES.includes(v);
export const isSeededAction = (v: unknown): v is ModerationActionKey =>
  typeof v === "string" && SEEDED_ACTIONS.includes(v);

export function canTransition(from: ModerationCaseStatus, to: ModerationCaseStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ModerationCaseStatus, to: ModerationCaseStatus): void {
  if (!canTransition(from, to)) {
    throw new ModerationError("MOD_INVALID_TRANSITION", { hint: `${from} → ${to}` });
  }
}

// ---- Payload validation --------------------------------------------------

export interface CreateCaseInput {
  category_key: ModerationCategoryKey;
  target_type_key: ModerationTargetTypeKey;
  target_id: string;
  title: string;
  summary?: string | null;
  priority?: ModerationPriority | null;
  reporter_id?: string | null;
  reporter_email?: string | null;
  reporter_reason?: string | null;
  target_snapshot?: unknown;
  metadata?: Record<string, unknown>;
}

export function validateCreateCase(input: CreateCaseInput): void {
  if (!input.title || !input.title.trim()) {
    throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "title is required" });
  }
  if (!input.target_id) {
    throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "target_id is required" });
  }
  if (!input.category_key) {
    throw new ModerationError("MOD_INVALID_CATEGORY", { hint: "category_key is required" });
  }
  if (!input.target_type_key) {
    throw new ModerationError("MOD_INVALID_TARGET", { hint: "target_type_key is required" });
  }
  if (input.priority != null && !isValidPriority(input.priority)) {
    throw new ModerationError("MOD_INVALID_PRIORITY", { hint: String(input.priority) });
  }
}

export interface AddEvidenceInput {
  case_id: string;
  kind: string;
  url?: string | null;
  content?: string | null;
  snapshot?: unknown;
}

export function validateEvidence(input: AddEvidenceInput): void {
  if (!input.case_id) throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "case_id required" });
  if (!input.kind || !input.kind.trim()) {
    throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "kind required" });
  }
  if (!input.url && !input.content && input.snapshot == null) {
    throw new ModerationError("MOD_EVIDENCE_REQUIRED");
  }
}

export function validateNote(body: string): void {
  if (!body || !body.trim()) {
    throw new ModerationError("MOD_VALIDATION_FAILED", { hint: "note body required" });
  }
}

export function validateAssignment(currentAssignee: string | null, next: string): void {
  if (!next) throw new ModerationError("MOD_INVALID_ASSIGNEE");
  if (currentAssignee === next) throw new ModerationError("MOD_ALREADY_ASSIGNED");
}
