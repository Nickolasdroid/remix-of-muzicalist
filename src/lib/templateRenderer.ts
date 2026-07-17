// Communication Rendering Engine.
// Pure, dependency-free renderer shared by email, push, SMS and in-app
// notifications. Given a template (subject/html/text) plus a variable bag,
// it substitutes registered {{namespace.identifier}} tokens, escapes HTML in
// user-provided values, and reports unknown/missing variables without
// throwing.
//
// No database, Supabase, React or Node-only APIs — safe for unit tests and
// edge functions alike.

import {
  getVariableRegistrySync,
  type VariableDefinition,
} from "./emailVariables";

export type VariableValue = string | number | boolean | null | undefined;
export type VariableBag = Record<string, VariableValue>;

export interface RenderInput {
  subject?: string;
  html?: string;
  text?: string;
  variables: VariableBag;
  /** Optional override; defaults to the built-in variable registry. */
  registry?: VariableDefinition[];
  /** When true (default) HTML output escapes substituted values. */
  escapeHtmlValues?: boolean;
}

export type RenderWarningType =
  | "unknown_variable"
  | "unregistered_value"
  | "malformed_token";

export interface RenderWarning {
  type: RenderWarningType;
  token: string;
  message: string;
}

export type RenderErrorType = "missing_required";

export interface RenderError {
  type: RenderErrorType;
  key: string;
  message: string;
}

export interface RenderOutput {
  subject: string;
  html: string;
  text: string;
  usedVariables: string[];
  missingVariables: string[];
  unknownVariables: string[];
  warnings: RenderWarning[];
  errors: RenderError[];
  ok: boolean;
}

// --- Helpers --------------------------------------------------------------

const TOKEN_RE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const CLEAN_TOKEN_RE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/** Minimal, allocation-light HTML escape. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stringify(value: VariableValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return String(value);
}

interface FieldRenderResult {
  output: string;
  used: Set<string>;
  unknown: Set<string>;
  warnings: RenderWarning[];
}

function renderField(
  input: string,
  variables: VariableBag,
  known: Set<string>,
  escapeValues: boolean,
): FieldRenderResult {
  const used = new Set<string>();
  const unknown = new Set<string>();
  const warnings: RenderWarning[] = [];

  if (!input) {
    return { output: "", used, unknown, warnings };
  }

  const output = input.replace(TOKEN_RE, (raw, innerRaw: string) => {
    const inner = (innerRaw ?? "").trim();

    if (!inner || !CLEAN_TOKEN_RE.test(inner)) {
      warnings.push({
        type: "malformed_token",
        token: raw,
        message: `Malformed variable token "${raw}" left unchanged.`,
      });
      return raw;
    }

    if (!known.has(inner)) {
      unknown.add(inner);
      warnings.push({
        type: "unknown_variable",
        token: inner,
        message: `Unknown variable "${inner}" left unchanged.`,
      });
      // Leave the original {{token}} intact per spec.
      return raw;
    }

    used.add(inner);

    if (!(inner in variables)) {
      // Registered but no value supplied — render empty and warn.
      warnings.push({
        type: "unregistered_value",
        token: inner,
        message: `No value provided for "${inner}"; substituted empty string.`,
      });
      return "";
    }

    const value = stringify(variables[inner]);
    return escapeValues ? escapeHtml(value) : value;
  });

  return { output, used, unknown, warnings };
}

// --- Public API -----------------------------------------------------------

/**
 * Render a template across subject / html / text channels.
 * Pure function: same inputs always produce the same output.
 */
export function renderTemplate(input: RenderInput): RenderOutput {
  const registry = input.registry ?? getVariableRegistrySync();
  const known = new Set(registry.map((d) => d.key));
  const escapeValues = input.escapeHtmlValues !== false;
  const vars = input.variables ?? {};

  const subject = renderField(input.subject ?? "", vars, known, false);
  const html = renderField(input.html ?? "", vars, known, escapeValues);
  const text = renderField(input.text ?? "", vars, known, false);

  const usedVariables = Array.from(
    new Set([...subject.used, ...html.used, ...text.used]),
  );
  const unknownVariables = Array.from(
    new Set([...subject.unknown, ...html.unknown, ...text.unknown]),
  );
  const warnings = [...subject.warnings, ...html.warnings, ...text.warnings];

  // Required-variable validation: every registered required variable that
  // appears in at least one field must have a non-empty value in the bag.
  const requiredKeys = registry.filter((d) => d.required).map((d) => d.key);
  const referenced = new Set(usedVariables);
  const errors: RenderError[] = [];
  const missingVariables: string[] = [];

  for (const key of requiredKeys) {
    if (!referenced.has(key)) continue;
    const raw = vars[key];
    const empty =
      raw === undefined ||
      raw === null ||
      (typeof raw === "string" && raw.trim() === "");
    if (empty) {
      missingVariables.push(key);
      errors.push({
        type: "missing_required",
        key,
        message: `Required variable "${key}" is missing or empty.`,
      });
    }
  }

  return {
    subject: subject.output,
    html: html.output,
    text: text.output,
    usedVariables,
    missingVariables,
    unknownVariables,
    warnings,
    errors,
    ok: errors.length === 0,
  };
}

/**
 * Convenience for callers that only render a single field (SMS body, push
 * title, in-app notification text). Uses HTML-escape off by default.
 */
export function renderString(
  template: string,
  variables: VariableBag,
  options: { registry?: VariableDefinition[]; escapeHtmlValues?: boolean } = {},
): RenderOutput {
  return renderTemplate({
    text: template,
    variables,
    registry: options.registry,
    escapeHtmlValues: options.escapeHtmlValues ?? false,
  });
}
