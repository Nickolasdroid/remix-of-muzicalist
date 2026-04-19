import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: "posts" | "announcements";
  itemId: string | null;
  initialText: string;
  maxLength?: number;
  onSaved?: (newText: string) => void;
}

const EditContentDialog = ({
  open,
  onOpenChange,
  table,
  itemId,
  initialText,
  maxLength = 200,
  onSaved,
}: EditContentDialogProps) => {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  const handleSave = async () => {
    if (!itemId) return;
    const trimmed = text.trim();
    if (!trimmed) {
      toast({ title: "Cannot be empty", description: "Please add some text.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const column = table === "posts" ? "content" : "description";
      const { error } = await supabase
        .from(table)
        .update({ [column]: trimmed })
        .eq("id", itemId);
      if (error) throw error;
      toast({ title: "Updated", description: "Your changes have been saved." });
      onSaved?.(trimmed);
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating:", err);
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit {table === "posts" ? "post" : "announcement"}</DialogTitle>
          <DialogDescription>Update the text content. Media cannot be changed here.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, maxLength))}
          rows={5}
          maxLength={maxLength}
          className="rounded-lg"
        />
        <div className="text-xs text-muted-foreground text-right">
          {text.length}/{maxLength}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditContentDialog;
