// Deno mirror of src/lib/communicationMetrics.ts (types only).

import type { CommunicationChannel } from "./types.ts";

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

export async function timed<T>(
  fn: () => Promise<T> | T,
): Promise<{ result: T; duration_ms: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, duration_ms: Date.now() - start };
}
