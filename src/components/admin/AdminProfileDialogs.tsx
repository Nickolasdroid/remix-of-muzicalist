import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { AdminProfile } from "./adminProfileTypes";

export function EditProfileDialog({
  editing,
  setEditing,
  saving,
  onSave,
}: {
  editing: AdminProfile | null;
  setEditing: (p: AdminProfile | null) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
      <DialogContent className="rounded-lg max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>Update basic account information.</DialogDescription>
        </DialogHeader>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                className="rounded-lg"
                value={editing.first_name ?? ""}
                onChange={(e) => setEditing({ ...editing, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                className="rounded-lg"
                value={editing.last_name ?? ""}
                onChange={(e) => setEditing({ ...editing, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Stage name</Label>
              <Input
                className="rounded-lg"
                value={editing.stage_name ?? ""}
                onChange={(e) => setEditing({ ...editing, stage_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                className="rounded-lg"
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                className="rounded-lg"
                value={editing.phone ?? ""}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input
                className="rounded-lg"
                value={editing.country ?? ""}
                onChange={(e) => setEditing({ ...editing, country: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Input
                className="rounded-lg"
                value={editing.plan ?? ""}
                onChange={(e) => setEditing({ ...editing, plan: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" className="rounded-lg" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button className="rounded-lg" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteProfileDialog({
  target,
  setTarget,
  deleting,
  onConfirm,
}: {
  target: AdminProfile | null;
  setTarget: (p: AdminProfile | null) => void;
  deleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
      <AlertDialogContent className="rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the account and all associated data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
