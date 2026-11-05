import { ChevronRight, CircleDashed, FileText, Lock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type CreateChoice = "post" | "story" | "collab";

interface CreateChooserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stories and collaborations need Standard or Premium; when false they show a lock and lead to the plans. */
  canCreateStories: boolean;
  canCreateCollab: boolean;
  onChoose: (choice: CreateChoice) => void;
  onUpgrade: () => void;
}

const OPTIONS: { k: CreateChoice; icon: typeof FileText; title: string; hint: string }[] = [
  { k: "post", icon: FileText, title: "Post", hint: "Text, photos, a video or when you're free to book" },
  { k: "story", icon: CircleDashed, title: "Story", hint: "Disappears after 24 hours" },
  { k: "collab", icon: Users, title: "Collaboration", hint: "Looking for musicians to play with" },
];

/**
 * What the artist's "+" creates. The same names are used everywhere else:
 * the feed filters, the card tags and the profile chips.
 */
const CreateChooser = ({ open, onOpenChange, canCreateStories, canCreateCollab, onChoose, onUpgrade }: CreateChooserProps) => {
  const allowed: Record<CreateChoice, boolean> = { post: true, story: canCreateStories, collab: canCreateCollab };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[400px] w-[calc(100%-1.5rem)] gap-0 rounded-2xl p-0 overflow-hidden",
          // Phones: a sheet at the bottom, within thumb reach
          "max-md:top-auto max-md:bottom-0 max-md:translate-y-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none max-md:pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <div className="px-5 pt-5 pb-2">
          <DialogTitle className="text-[17px] font-semibold">Create</DialogTitle>
          <DialogDescription className="sr-only">Choose what to create</DialogDescription>
        </div>
        <div className="px-2 pb-3">
          {OPTIONS.map(({ k, icon: Icon, title, hint }) => {
            const ok = allowed[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  if (ok) onChoose(k);
                  else onUpgrade();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", ok ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-[15px] font-semibold", ok ? "text-foreground" : "text-muted-foreground")}>{title}</span>
                    {!ok && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[11px] font-medium text-accent">
                        <Lock className="h-3 w-3" />
                        <span className="notranslate" translate="no">Standard</span>
                      </span>
                    )}
                  </span>
                  <span className="block text-[13px] leading-snug text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChooser;
