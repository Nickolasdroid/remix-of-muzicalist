// Email Templates — Supabase-backed API layer.
// Templates are stored in `email_templates`; each edit produces a new row in
// `email_template_versions`. `active_version_id` points at the currently
// published version, which is what campaigns and the send pipeline consume.
import { supabase } from "@/integrations/supabase/client";
import { createVersion, publishVersion } from "@/lib/emailTemplateVersions";

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
  updated_at: string;
  updated_by: string | null;
  active_version_id: string | null;
}

type Row = {
  id: string;
  name: string;
  category: string;
  type: string;
  status: string;
  updated_at: string;
  created_by: string | null;
  active_version_id: string | null;
};

const SELECT = "id, name, category, type, status, updated_at, created_by, active_version_id";

const mapRow = (r: Row): EmailTemplate => ({
  id: r.id,
  name: r.name,
  category: r.category as TemplateCategory,
  type: r.type as TemplateType,
  status: r.status as TemplateStatus,
  updated_at: r.updated_at,
  updated_by: r.created_by,
  active_version_id: r.active_version_id,
});

export async function listTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from("email_templates")
    .select(SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Row));
}

export async function getTemplate(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function createTemplate(input: {
  name: string;
  category: TemplateCategory;
  type: TemplateType;
  status?: TemplateStatus;
}): Promise<EmailTemplate> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      name: input.name,
      category: input.category,
      type: input.type,
      status: input.status ?? "Draft",
      created_by: uid,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return mapRow(data as Row);
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<EmailTemplate, "name" | "category" | "type" | "status">>,
): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from("email_templates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(SELECT)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Row) : null;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateTemplate(id: string): Promise<EmailTemplate | null> {
  const src = await getTemplate(id);
  if (!src) return null;
  const copy = await createTemplate({
    name: `${src.name} (Copy)`,
    category: src.category,
    type: src.type,
    status: "Draft",
  });
  // Best-effort: seed a draft version from the source's active version content.
  if (src.active_version_id) {
    const { data: srcVer } = await supabase
      .from("email_template_versions")
      .select("subject, html_content, text_content")
      .eq("id", src.active_version_id)
      .maybeSingle();
    if (srcVer) {
      try {
        await createVersion({
          templateId: copy.id,
          subject: srcVer.subject,
          html_content: srcVer.html_content ?? "",
          text_content: srcVer.text_content ?? "",
        });
      } catch {
        /* non-fatal — user can add a version later */
      }
    }
  }
  return copy;
}

/**
 * Loads the version we should open in the editor for an existing template:
 * the active (published) version if any, otherwise the latest draft/version.
 */
export async function getEditableVersion(templateId: string): Promise<{
  id: string | null;
  subject: string;
  html_content: string;
  text_content: string;
} | null> {
  const tpl = await getTemplate(templateId);
  if (!tpl) return null;

  if (tpl.active_version_id) {
    const { data, error } = await supabase
      .from("email_template_versions")
      .select("id, subject, html_content, text_content")
      .eq("id", tpl.active_version_id)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      return {
        id: data.id,
        subject: data.subject ?? "",
        html_content: data.html_content ?? "",
        text_content: data.text_content ?? "",
      };
    }
  }

  const { data, error } = await supabase
    .from("email_template_versions")
    .select("id, subject, html_content, text_content")
    .eq("template_id", templateId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { id: null, subject: "", html_content: "", text_content: "" };
  }
  return {
    id: data.id,
    subject: data.subject ?? "",
    html_content: data.html_content ?? "",
    text_content: data.text_content ?? "",
  };
}

/**
 * Creates a new draft version for `templateId`. If `publish` is true, the
 * version is immediately published and becomes the template's active version.
 */
export async function saveTemplateVersion(input: {
  templateId: string;
  subject: string;
  html_content: string;
  text_content: string;
  publish: boolean;
}): Promise<void> {
  const v = await createVersion({
    templateId: input.templateId,
    subject: input.subject,
    html_content: input.html_content,
    text_content: input.text_content,
  });
  if (input.publish) {
    await publishVersion(v.id);
  }
}
