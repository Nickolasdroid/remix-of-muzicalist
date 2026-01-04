import { Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  children: React.ReactNode;
  editContent: React.ReactNode;
  className?: string;
  showEditIcon?: boolean;
}

const EditableField = ({
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  isSaving = false,
  children,
  editContent,
  className,
  showEditIcon = true,
}: EditableFieldProps) => {
  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        {editContent}
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {showEditIcon && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-accent"
          onClick={onStartEdit}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default EditableField;
