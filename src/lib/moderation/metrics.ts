// Shared moderation metrics types.
//
// These are pure descriptors used across the service layer, analytics, and
// (eventually) dashboards. No collection backend is wired yet — a future
// module will emit these into logs or an analytics sink.

export type ModerationMetricName =
  | "processing_time_ms"
  | "case_age_ms"
  | "status_changes"
  | "actions_count"
  | "notes_count"
  | "evidence_count"
  | "reports_count";

export interface ModerationMetricSample {
  name: ModerationMetricName;
  value: number;
  case_id?: string;
  labels?: Record<string, string>;
  at: string; // ISO timestamp
}

export interface CaseMetricsSnapshot {
  case_id: string;
  case_age_ms: number;
  status_changes: number;
  actions_count: number;
  notes_count: number;
  evidence_count: number;
  reports_count: number;
  time_to_first_review_ms: number | null;
  time_to_resolution_ms: number | null;
}

export function makeSample(
  name: ModerationMetricName,
  value: number,
  extra?: Pick<ModerationMetricSample, "case_id" | "labels">,
): ModerationMetricSample {
  return { name, value, at: new Date().toISOString(), ...extra };
}

/** Time a promise-returning operation and return `{ result, elapsed_ms }`. */
export async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; elapsed_ms: number }> {
  const start =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  const result = await fn();
  const end =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? performance.now()
      : Date.now();
  return { result, elapsed_ms: Math.max(0, end - start) };
}
