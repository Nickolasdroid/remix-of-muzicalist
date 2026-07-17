// Reusable metrics primitives for the Communications platform.
// This file intentionally contains only type/interface definitions and small
// helpers — no persistence, no UI. Future observability layers (Grafana,
// Supabase analytics, PostHog) can consume these shapes without churn.

import type { CommunicationChannel } from "@/lib/communicationPipeline";

export interface RenderMetrics {
  render_duration_ms: number;
  warning_count: number;
  error_count: number;
  used_variable_count: number;
  unknown_variable_count: number;
  missing_variable_count: number;
}

export interface DeliveryMetrics {
  provider: string;
  channel: CommunicationChannel | string;
  success: boolean;
  delivery_duration_ms: number;
  retry_count: number;
  http_status?: number | null;
  error_code?: string | null;
}

export interface CommunicationMetrics {
  channel: CommunicationChannel | string;
  template_id?: string;
  version_id?: string;
  render?: RenderMetrics;
  delivery?: DeliveryMetrics;
  captured_at: string;
}

/** Measure `fn` and return its result along with elapsed milliseconds. */
export async function timed<T>(fn: () => Promise<T> | T): Promise<{
  result: T;
  duration_ms: number;
}> {
  const start = Date.now();
  const result = await fn();
  return { result, duration_ms: Date.now() - start };
}

export function emptyRenderMetrics(): RenderMetrics {
  return {
    render_duration_ms: 0,
    warning_count: 0,
    error_count: 0,
    used_variable_count: 0,
    unknown_variable_count: 0,
    missing_variable_count: 0,
  };
}
