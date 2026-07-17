// Central error catalog for the Moderation Center.
//
// Every service / RPC wrapper surfaces failures using a stable code from
// `ModerationErrorCode`. UI and logs should switch on the code rather than
// parse error messages.
//
// The database RPCs raise `RAISE EXCEPTION 'MOD_...'`; `mapPostgresError`
// converts those into `ModerationError` instances.

export type ModerationErrorCode =
  | "MOD_CASE_NOT_FOUND"
  | "MOD_ACTION_NOT_FOUND"
  | "MOD_ACTION_NOT_REVERSIBLE"
  | "MOD_ACTION_ALREADY_REVERSED"
  | "MOD_ACTION_FAILED"
  | "MOD_INVALID_STATUS"
  | "MOD_INVALID_TRANSITION"
  | "MOD_INVALID_PRIORITY"
  | "MOD_INVALID_CATEGORY"
  | "MOD_INVALID_TARGET"
  | "MOD_INVALID_ACTION"
  | "MOD_INVALID_ASSIGNEE"
  | "MOD_PERMISSION_DENIED"
  | "MOD_ALREADY_ASSIGNED"
  | "MOD_NOT_ASSIGNED"
  | "MOD_EVIDENCE_REQUIRED"
  | "MOD_VALIDATION_FAILED"
  | "MOD_UNKNOWN";

export const MODERATION_ERROR_MESSAGES: Record<ModerationErrorCode, string> = {
  MOD_CASE_NOT_FOUND: "The requested moderation case does not exist.",
  MOD_ACTION_NOT_FOUND: "The requested moderation action does not exist.",
  MOD_ACTION_NOT_REVERSIBLE: "This action type cannot be reversed.",
  MOD_ACTION_ALREADY_REVERSED: "This action has already been reversed.",
  MOD_ACTION_FAILED: "Applying the moderation action failed.",
  MOD_INVALID_STATUS: "The provided case status is not recognized.",
  MOD_INVALID_TRANSITION: "This status transition is not allowed.",
  MOD_INVALID_PRIORITY: "The provided priority is not recognized.",
  MOD_INVALID_CATEGORY: "The provided category is not recognized.",
  MOD_INVALID_TARGET: "The provided target type is not recognized.",
  MOD_INVALID_ACTION: "The provided action type is not recognized.",
  MOD_INVALID_ASSIGNEE: "The specified user cannot be assigned as moderator.",
  MOD_PERMISSION_DENIED: "The caller is not authorized to perform this operation.",
  MOD_ALREADY_ASSIGNED: "This moderator is already assigned to the case.",
  MOD_NOT_ASSIGNED: "The case has no moderator assigned.",
  MOD_EVIDENCE_REQUIRED: "Evidence must include a URL, content, or snapshot.",
  MOD_VALIDATION_FAILED: "Input validation failed.",
  MOD_UNKNOWN: "An unknown moderation error occurred.",
};

export class ModerationError extends Error {
  readonly code: ModerationErrorCode;
  readonly hint?: string;
  readonly cause?: unknown;
  constructor(code: ModerationErrorCode, opts?: { hint?: string; cause?: unknown; message?: string }) {
    super(opts?.message ?? MODERATION_ERROR_MESSAGES[code]);
    this.name = "ModerationError";
    this.code = code;
    this.hint = opts?.hint;
    this.cause = opts?.cause;
  }
}

const KNOWN: Set<string> = new Set(Object.keys(MODERATION_ERROR_MESSAGES));

/** Convert a raw Postgres/PostgREST error into a typed ModerationError. */
export function mapPostgresError(err: unknown): ModerationError {
  if (err instanceof ModerationError) return err;
  const raw = err as { message?: string; hint?: string; details?: string; code?: string } | null;
  const msg = (raw?.message ?? "").trim();
  const token = msg.split(/\s|:/)[0];
  if (token && KNOWN.has(token)) {
    return new ModerationError(token as ModerationErrorCode, { hint: raw?.hint ?? raw?.details, cause: err });
  }
  return new ModerationError("MOD_UNKNOWN", { hint: msg || raw?.hint, cause: err });
}
