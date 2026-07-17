// Communication Pipeline — single entry point for all future outbound
// communications (email, SMS, push, in-app, webhook).
//
// Responsibilities:
//   1. Load the template row.
//   2. Load its active version.
//   3. Validate variables against the registry.
//   4. Render subject / html / text via the pure renderer.
//   5. Return a Communication Payload — NEVER delivers.
//
// The renderer stays pure; only this pipeline layer touches the database.

import { supabase } from "@/integrations/supabase/client";
import {
  renderTemplate,
  type RenderError,
  type RenderWarning,
  type VariableBag,
} from "@/lib/templateRenderer";
import {
  validateTemplateContent,
  type ValidationError,
  type VariableDefinition,
} from "@/lib/emailVariables";
import {
  COMM_ERROR_MESSAGES,
  type CommErrorCode,
} from "@/lib/communicationErrors";

export type CommunicationChannel =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "webhook";

export interface SendCommunicationInput {
  templateId: string;
  channel: CommunicationChannel;
  variables?: VariableBag;
  /** Optional override — otherwise the built-in registry is used. */
  registry?: VariableDefinition[];
  /** Optional recipient descriptor propagated on the payload metadata. */
  recipient?: {
    id?: string | null;
    email?: string | null;
    phone?: string | null;
    locale?: string | null;
  };
  /** Free-form metadata merged into payload.metadata.context. */
  context?: Record<string, unknown>;
}

export interface CommunicationTemplateRef {
  id: string;
  name: string;
  category: string | null;
  type: string | null;
  active_version_id: string | null;
}

export interface CommunicationVersionRef {
  id: string;
  version_number: number;
  status: string;
  subject: string;
  html_content: string | null;
  text_content: string | null;
}

export interface CommunicationPayload {
  ok: boolean;
  channel: CommunicationChannel;
  subject: string;
  html: string;
  text: string;
  warnings: RenderWarning[];
  validation_errors: (RenderError | ValidationError)[];
  metadata: {
    template: CommunicationTemplateRef;
    version: CommunicationVersionRef;
    recipient?: SendCommunicationInput["recipient"];
    used_variables: string[];
    missing_variables: string[];
    unknown_variables: string[];
    rendered_at: string;
    context?: Record<string, unknown>;
  };
}

export class CommunicationPipelineError extends Error {
  code: "template_not_found" | "no_active_version" | "version_not_found";
  constructor(code: CommunicationPipelineError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

// --- Data loaders (thin wrappers; kept isolated for testability) ----------

async function loadTemplate(templateId: string): Promise<CommunicationTemplateRef> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("id, name, category, type, active_version_id")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new CommunicationPipelineError(
      "template_not_found",
      `Template ${templateId} not found.`,
    );
  }
  return data as CommunicationTemplateRef;
}

async function loadActiveVersion(
  template: CommunicationTemplateRef,
): Promise<CommunicationVersionRef> {
  if (!template.active_version_id) {
    throw new CommunicationPipelineError(
      "no_active_version",
      `Template "${template.name}" has no active version.`,
    );
  }
  const { data, error } = await supabase
    .from("email_template_versions")
    .select("id, version_number, status, subject, html_content, text_content")
    .eq("id", template.active_version_id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new CommunicationPipelineError(
      "version_not_found",
      `Active version ${template.active_version_id} not found.`,
    );
  }
  return data as CommunicationVersionRef;
}

// --- Public API -----------------------------------------------------------

/**
 * Build a Communication Payload for a template. Loads the template + active
 * version, validates tokens, renders every channel field, and returns the
 * payload. Does NOT deliver — a future channel-specific dispatcher consumes
 * this output.
 */
export async function sendCommunication(
  input: SendCommunicationInput,
): Promise<CommunicationPayload> {
  const template = await loadTemplate(input.templateId);
  const version = await loadActiveVersion(template);

  const variables = input.variables ?? {};

  // Static template-content validation (unknown/malformed/duplicate tokens).
  const staticValidation = [
    validateTemplateContent(version.subject ?? "", input.registry),
    validateTemplateContent(version.html_content ?? "", input.registry),
    validateTemplateContent(version.text_content ?? "", input.registry),
  ];
  const validation_errors: (RenderError | ValidationError)[] = [];
  for (const v of staticValidation) validation_errors.push(...v.errors);

  // Pure render (safe for any channel; HTML-escapes values in html field).
  const rendered = renderTemplate({
    subject: version.subject ?? "",
    html: version.html_content ?? "",
    text: version.text_content ?? "",
    variables,
    registry: input.registry,
  });
  validation_errors.push(...rendered.errors);

  return {
    ok: validation_errors.length === 0,
    channel: input.channel,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    warnings: rendered.warnings,
    validation_errors,
    metadata: {
      template,
      version,
      recipient: input.recipient,
      used_variables: rendered.usedVariables,
      missing_variables: rendered.missingVariables,
      unknown_variables: rendered.unknownVariables,
      rendered_at: new Date().toISOString(),
      context: input.context,
    },
  };
}
