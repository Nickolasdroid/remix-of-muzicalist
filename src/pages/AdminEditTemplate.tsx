import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  createTemplate,
  getEditableVersion,
  getTemplate,
  saveTemplateVersion,
  updateTemplate,
  type EmailTemplate,
  type TemplateCategory,
  type TemplateType,
} from "@/lib/emailTemplates";
import EmailVariablesPanel from "@/components/admin/EmailVariablesPanel";
import { validateTemplateContent } from "@/lib/emailVariables";

type Props = { mode: "new" | "edit" };

const AdminEditTemplate = ({ mode }: Props) => {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState<null | "draft" | "publish">(null);

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("Marketing");
  const [type, setType] = useState<TemplateType>("Campaign");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (mode !== "edit" || !routeId) return;
    (async () => {
      try {
        const t = await getTemplate(routeId);
        if (cancelled) return;
        if (!t) {
          toast.error("Template not found.");
          navigate("/admin/communications/templates");
          return;
        }
        setTemplate(t);
        setName(t.name);
        setCategory(t.category);
        setType(t.type);
        const v = await getEditableVersion(t.id);
        if (cancelled) return;
        if (v) {
          setSubject(v.subject);
          setHtml(v.html_content);
          setText(v.text_content);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load template.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, routeId, navigate]);

  const validation = useMemo(
    () => validateTemplateContent(`${subject}\n${html}\n${text}`),
    [subject, html, text],
  );

  const canSave =
    name.trim().length > 0 && subject.trim().length > 0 && html.trim().length > 0;

  const handleSave = async (publish: boolean) => {
    if (!canSave) {
      toast.error("Name, subject and HTML body are required.");
      return;
    }
    if (publish && !validation.ok) {
      toast.error("Fix template variable errors before publishing.");
      return;
    }
    setSaving(publish ? "publish" : "draft");
    try {
      let target = template;
      if (!target) {
        target = await createTemplate({ name: name.trim(), category, type, status: "Draft" });
      } else {
        // Sync metadata if it changed.
        if (
          target.name !== name.trim() ||
          target.category !== category ||
          target.type !== type
        ) {
          const patched = await updateTemplate(target.id, {
            name: name.trim(),
            category,
            type,
          });
          if (patched) target = patched;
        }
      }

      await saveTemplateVersion({
        templateId: target.id,
        subject: subject.trim(),
        html_content: html,
        text_content: text,
        publish,
      });

      if (publish) {
        // Ensure template is marked Active when a version is published.
        if (target.status !== "Active") {
          await updateTemplate(target.id, { status: "Active" });
        }
        toast.success("Template published.");
      } else {
        toast.success("Draft saved.");
      }

      navigate("/admin/communications/templates");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/communications/templates")}
            className="rounded-lg -ml-2 hidden md:inline-flex"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {mode === "new" ? "New Template" : "Edit Template"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Editing creates a new version. Publishing makes it the active version used by
              campaigns and test sends.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="rounded-lg border-border p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <Card className="rounded-lg border-border p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="tpl-name">Template Name</Label>
                  <Input
                    id="tpl-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Legacy Artist Reactivation"
                    className="rounded-lg h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {TEMPLATE_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as TemplateType)}>
                    <SelectTrigger className="rounded-lg h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {TEMPLATE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-subject">Subject</Label>
                <Input
                  id="tpl-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line — variables like {{artist.name}} are supported"
                  className="rounded-lg h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-html">HTML Body</Label>
                <Textarea
                  id="tpl-html"
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<html>…</html>"
                  className="rounded-lg font-mono text-xs min-h-[320px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-text">Plain Text Body (optional)</Label>
                <Textarea
                  id="tpl-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Plain-text fallback for clients that don't render HTML."
                  className="rounded-lg font-mono text-xs min-h-[140px]"
                />
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Variable validation
                </div>
                {validation.ok ? (
                  <div className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    {validation.used.length === 0
                      ? "No variables used."
                      : `${validation.used.length} variable${validation.used.length === 1 ? "" : "s"} used, all valid.`}
                  </div>
                ) : (
                  <ul className="text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-2 space-y-1">
                    {validation.errors.map((err, i) => (
                      <li key={i}>
                        <span className="font-mono">{err.match}</span> — {err.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  className="rounded-lg h-11"
                  disabled={!!saving || !canSave}
                  onClick={() => handleSave(false)}
                >
                  {saving === "draft" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  Save Draft
                </Button>
                <Button
                  className="rounded-lg h-11"
                  disabled={!!saving || !canSave || !validation.ok}
                  onClick={() => handleSave(true)}
                >
                  {saving === "publish" ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  Publish Version
                </Button>
              </div>
            </Card>

            <EmailVariablesPanel className="h-fit" />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminEditTemplate;
