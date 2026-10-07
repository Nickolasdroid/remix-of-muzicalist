import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { StoryPlanError, publishStory } from "@/lib/stories";

interface StoryComposerDialogProps {
  open: boolean;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onPublished: () => void;
}

const MAX_INPUT_BYTES = 20 * 1024 * 1024; // before downscaling

/** Pick one image, preview it in story format and publish it for 24 hours. */
const StoryComposerDialog = ({ open, userId, onOpenChange, onPublished }: StoryComposerDialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [planBlocked, setPlanBlocked] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setProgress(0);
      setPlanBlocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Only images can be published as stories", variant: "destructive" });
      return;
    }
    if (f.size > MAX_INPUT_BYTES) {
      toast({ title: "The image is too large (max 20 MB)", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handlePublish = async () => {
    if (!file) return;
    setPublishing(true);
    setProgress(0);
    try {
      await publishStory(userId, file, setProgress);
      toast({ title: "Story published", description: "It will be visible for 24 hours." });
      onPublished();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof StoryPlanError) setPlanBlocked(true);
      else toast({ title: "Couldn't publish the story", description: "Please try again.", variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !publishing && onOpenChange(o)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New story</DialogTitle>
          <DialogDescription>Images only. Your story stays visible for 24 hours.</DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
        />

        {planBlocked ? (
          <div className="space-y-3 text-center py-4">
            <p className="text-sm text-muted-foreground">Stories are available on the Standard and Premium plans.</p>
            <Button asChild><Link to="/my-plan" onClick={() => onOpenChange(false)}>See plans</Link></Button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={publishing}
              className="relative mx-auto w-full max-w-[240px] aspect-[9/16] rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/40 flex items-center justify-center hover:border-primary transition-colors"
            >
              {preview ? (
                <>
                  <img src={preview} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50" />
                  <img src={preview} alt="" className="absolute inset-0 w-full h-full object-contain" />
                </>
              ) : (
                <span className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                  <ImagePlus className="h-8 w-8" />
                  Choose an image
                </span>
              )}
            </button>

            {publishing && <Progress value={progress} className="h-1.5" />}

            <div className="flex gap-2">
              {file && (
                <Button variant="outline" className="flex-1" onClick={() => inputRef.current?.click()} disabled={publishing}>
                  Change
                </Button>
              )}
              <Button className="flex-1" onClick={handlePublish} disabled={!file || publishing}>
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish story"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoryComposerDialog;
