// Pure helpers for the Send Test Email feature. Kept dependency-free so
// they can be unit-tested without pulling in Supabase or React.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidTestEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 320) return false;
  return EMAIL_RE.test(trimmed);
}

export interface TestEmailPayload {
  template_id: string;
  template_label: string;
  recipient_email: string;
  recipient_name: string | null;
  campaign_name: string | null;
}

export function buildTestEmailPayload(input: {
  templateId: string;
  templateLabel: string;
  email: string;
  name?: string | null;
  campaignName?: string | null;
}): TestEmailPayload {
  return {
    template_id: input.templateId.trim(),
    template_label: input.templateLabel.trim(),
    recipient_email: input.email.trim().toLowerCase(),
    recipient_name: input.name?.trim() ? input.name.trim() : null,
    campaign_name: input.campaignName?.trim() ? input.campaignName.trim() : null,
  };
}
