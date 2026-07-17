// Foundation types & mock store for the Email Templates module.
// Backend wiring will replace this store in a future sprint.

export const TEMPLATE_CATEGORIES = ["Marketing", "Transactional", "System"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_TYPES = [
  "Welcome",
  "Email Verification",
  "Password Reset",
  "Subscription",
  "Payment",
  "Artist Approval",
  "Artist Rejection",
  "Notification",
  "Campaign",
  "Custom",
] as const;
export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const TEMPLATE_STATUSES = ["Draft", "Active", "Archived"] as const;
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  status: TemplateStatus;
  updated_at: string; // ISO
  updated_by: string | null;
}

const KEY = "muzicalist.emailTemplates.v1";

function read(): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmailTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: EmailTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export async function listTemplates(): Promise<EmailTemplate[]> {
  // Simulated latency so skeletons show briefly.
  await new Promise((r) => setTimeout(r, 250));
  return read().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

export async function createTemplate(
  input: Omit<EmailTemplate, "id" | "updated_at">,
): Promise<EmailTemplate> {
  const t: EmailTemplate = {
    ...input,
    id: crypto.randomUUID(),
    updated_at: new Date().toISOString(),
  };
  write([t, ...read()]);
  return t;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Omit<EmailTemplate, "id">>,
): Promise<EmailTemplate | null> {
  const list = read();
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
  write(list);
  return list[idx];
}

export async function duplicateTemplate(id: string): Promise<EmailTemplate | null> {
  const list = read();
  const src = list.find((t) => t.id === id);
  if (!src) return null;
  const copy: EmailTemplate = {
    ...src,
    id: crypto.randomUUID(),
    name: `${src.name} (Copy)`,
    status: "Draft",
    updated_at: new Date().toISOString(),
  };
  write([copy, ...list]);
  return copy;
}

export async function deleteTemplate(id: string): Promise<void> {
  write(read().filter((t) => t.id !== id));
}
