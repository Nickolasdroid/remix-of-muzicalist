import { useSyncExternalStore } from "react";

export type CampaignStatus = "pending" | "sending" | "completed" | "failed";

export interface CampaignRecipientSnapshot {
  name: string;
  email: string;
}

export interface CampaignInvalidSnapshot extends CampaignRecipientSnapshot {
  error: "missing_email" | "invalid_format";
}

/**
 * Forward-compatible campaign model.
 * Fields marked "future" are already defined so later features
 * (progress, scheduling, logs, reports) don't require refactoring.
 */
export interface Campaign {
  id: string;
  name: string;
  templateId: string;
  templateLabel: string;

  fileName: string;
  totalRecipients: number;
  validCount: number;
  invalidCount: number;

  // Snapshots kept locally so the View page can render details.
  validRecipients: CampaignRecipientSnapshot[];
  invalidRecipients: CampaignInvalidSnapshot[];

  status: CampaignStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // ---- Future-ready fields (unused for now) ----
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  estimatedDurationMs?: number;
  actualDurationMs?: number;
  progress?: number; // 0..1
  sentCount?: number;
  failedCount?: number;
  logs?: Array<{ at: string; level: "info" | "warn" | "error"; message: string }>;
  report?: {
    delivered?: number;
    bounced?: number;
    opened?: number;
    clicked?: number;
    unsubscribed?: number;
  };
}

const STORAGE_KEY = "muzicalist.admin.campaigns.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

const readStorage = (): Campaign[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Campaign[]) : [];
  } catch {
    return [];
  }
};

let cache: Campaign[] = readStorage();

const writeStorage = (next: Campaign[]) => {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
};

const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const campaignStore = {
  getAll: () => cache,
  getById: (id: string) => cache.find((c) => c.id === id),
  create: (
    input: Omit<Campaign, "id" | "status" | "createdAt" | "updatedAt">,
  ): Campaign => {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      ...input,
      id: `cmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      sentCount: 0,
      failedCount: 0,
      progress: 0,
      logs: [],
    };
    writeStorage([campaign, ...cache]);
    return campaign;
  },
  updateStatus: (id: string, status: CampaignStatus) => {
    writeStorage(
      cache.map((c) =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c,
      ),
    );
  },
};

/**
 * Rough estimate: ~2 emails/second (typical provider throughput).
 * Purely a UI hint — will be replaced by real timings later.
 */
export const estimateSendingMs = (validCount: number): number =>
  Math.max(1, validCount) * 500;

export const formatDuration = (ms: number): string => {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem ? `${m}m ${rem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h ${mm}m` : `${h}h`;
};

export const useCampaigns = (): Campaign[] =>
  useSyncExternalStore(subscribe, () => cache, () => cache);
