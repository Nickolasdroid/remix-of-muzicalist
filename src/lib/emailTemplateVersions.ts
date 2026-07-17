// Email Template Version Engine — API layer.
// Every edit produces a new version; history is never mutated.
import { supabase } from "@/integrations/supabase/client";
import type { EmailTemplate } from "@/lib/emailTemplates";

export const VERSION_STATUSES = ["Draft", "Published", "Archived"] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  subject: string;
  html_content: string | null;
  text_content: string | null;
  status: VersionStatus;
  created_by: string | null;
  created_at: string;
}

/**
 * Ensures a DB row exists for a template row managed by the (currently local)
 * templates store. Idempotent — safe to call before any version action so the
 * FK on email_template_versions.template_id resolves.
 */
export async function ensureTemplateRow(t: EmailTemplate): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;
  const { error } = await supabase
    .from("email_templates")
    .upsert(
      {
        id: t.id,
        name: t.name,
        category: t.category,
        type: t.type,
        status: t.status,
        created_by: uid,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function listVersions(templateId: string): Promise<EmailTemplateVersion[]> {
  const { data, error } = await supabase
    .from("email_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EmailTemplateVersion[];
}

export async function getActiveVersionId(templateId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("active_version_id")
    .eq("id", templateId)
    .maybeSingle();
  if (error) throw error;
  return data?.active_version_id ?? null;
}

export async function createVersion(input: {
  templateId: string;
  subject: string;
  html_content?: string | null;
  text_content?: string | null;
}): Promise<EmailTemplateVersion> {
  const { data, error } = await supabase.rpc("create_email_template_version", {
    _template_id: input.templateId,
    _subject: input.subject,
    _html_content: input.html_content ?? "",
    _text_content: input.text_content ?? "",
  });
  if (error) throw error;
  return data as EmailTemplateVersion;
}

export async function publishVersion(versionId: string): Promise<EmailTemplateVersion> {
  const { data, error } = await supabase.rpc("publish_email_template_version", {
    _version_id: versionId,
  });
  if (error) throw error;
  return data as EmailTemplateVersion;
}

/** Creates a NEW Draft version cloning the selected version's content. */
export async function restoreVersion(versionId: string): Promise<EmailTemplateVersion> {
  const { data, error } = await supabase.rpc("restore_email_template_version", {
    _version_id: versionId,
  });
  if (error) throw error;
  return data as EmailTemplateVersion;
}

/** Duplicates a version by creating a new Draft version with identical content. */
export async function duplicateVersion(v: EmailTemplateVersion): Promise<EmailTemplateVersion> {
  return createVersion({
    templateId: v.template_id,
    subject: v.subject,
    html_content: v.html_content,
    text_content: v.text_content,
  });
}

export async function deleteVersion(versionId: string): Promise<void> {
  const { error } = await supabase
    .from("email_template_versions")
    .delete()
    .eq("id", versionId);
  if (error) throw error;
}
