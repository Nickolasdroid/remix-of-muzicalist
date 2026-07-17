// Central error catalog for the Communications platform.
//
// Every module in the pipeline / dispatcher / provider chain surfaces
// failures using a well-known code from `CommErrorCode`. Callers should
// never assemble ad-hoc error strings — use `commError()` or throw a
// `CommunicationError` so upstream consumers (UI, logs, metrics) can rely
// on a stable identifier.

export type CommErrorCode =
  | "COMM_TEMPLATE_NOT_FOUND"
  | "COMM_ACTIVE_VERSION_NOT_FOUND"
  | "COMM_VERSION_NOT_FOUND"
  | "COMM_INVALID_VARIABLE"
  | "COMM_RENDER_FAILED"
  | "COMM_PROVIDER_UNAVAILABLE"
  | "COMM_DELIVERY_FAILED"
  | "COMM_PERMISSION_DENIED"
  | "COMM_RECIPIENT_INVALID"
  | "COMM_CONFIG_MISSING";

export const COMM_ERROR_MESSAGES: Record<CommErrorCode, string> = {
  COMM_TEMPLATE_NOT_FOUND: "The requested template does not exist.",
  COMM_ACTIVE_VERSION_NOT_FOUND: "The template has no active version.",
  COMM_VERSION_NOT_FOUND: "The referenced template version was not found.",
  COMM_INVALID_VARIABLE: "One or more variable tokens failed validation.",
  COMM_RENDER_FAILED: "The template renderer could not produce output.",
  COMM_PROVIDER_UNAVAILABLE: "No provider is registered for the given channel.",
  COMM_DELIVERY_FAILED: "The provider rejected or failed the delivery.",
  COMM_PERMISSION_DENIED: "The caller is not authorized for this operation.",
  COMM_RECIPIENT_INVALID: "Recipient descriptor is missing required fields.",
  COMM_CONFIG_MISSING: "Required configuration or secret is not available.",
};

export interface CommErrorShape {
  code: CommErrorCode;
  message: string;
  details?: unknown;
}

export function commError(
  code: CommErrorCode,
  message?: string,
  details?: unknown,
): CommErrorShape {
  return {
    code,
    message: message ?? COMM_ERROR_MESSAGES[code],
    details,
  };
}

export class CommunicationError extends Error {
  readonly code: CommErrorCode;
  readonly details?: unknown;
  constructor(code: CommErrorCode, message?: string, details?: unknown) {
    super(message ?? COMM_ERROR_MESSAGES[code]);
    this.name = "CommunicationError";
    this.code = code;
    this.details = details;
  }
}
