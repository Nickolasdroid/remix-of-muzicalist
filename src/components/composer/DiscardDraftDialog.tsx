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

/** "Discard what you wrote?" — shown when closing a composer that has content. */
const DiscardDraftDialog = ({
  open,
  title,
  onKeep,
  onDiscard,
}: {
  open: boolean;
  title: string;
  onKeep: () => void;
  onDiscard: () => void;
}) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onKeep()}>
    <AlertDialogContent className="rounded-lg">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>What you've written so far will be lost.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="rounded-lg">Keep editing</AlertDialogCancel>
        <AlertDialogAction
          className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onDiscard}
        >
          Discard
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DiscardDraftDialog;
