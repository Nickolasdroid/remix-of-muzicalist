import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, ShieldCheck, Upload, Clock, AlertCircle, Loader2, Camera, RefreshCw, X } from "lucide-react";

type Status = "unverified" | "pending" | "verified" | "rejected";

interface Props {
  profileId: string;
}

const MAX_FILE_MB = 8;

const VerificationCard = ({ profileId }: Props) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("unverified");
  const [rejectionNote, setRejectionNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Camera capture state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles")
      .select("verification_status")
      .eq("id", profileId)
      .maybeSingle();
    setStatus(((prof as any)?.verification_status as Status) ?? "unverified");

    const { data: last } = await supabase
      .from("verification_requests" as any)
      .select("status, admin_notes, created_at")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRejectionNote(((last as any)?.status === "rejected" ? ((last as any)?.admin_notes ?? null) : null));
    setLoading(false);
  };

  useEffect(() => {
    if (profileId) refresh();
  }, [profileId]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setCameraOpen(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported on this device/browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access in your browser settings."
          : e?.message || "Could not access the camera.";
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelfieFile(file);
        setSelfiePreview(URL.createObjectURL(blob));
        closeCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = (f: File | null) => {
    if (!f) return "Please select a file.";
    if (!/^image\/(jpe?g|png|webp|heic|heif)$/i.test(f.type) && f.type !== "application/pdf") {
      return "Only JPG, PNG, WEBP or PDF files are allowed.";
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) return `File must be under ${MAX_FILE_MB}MB.`;
    return null;
  };

  const handleSubmit = async () => {
    const idErr = validateFile(idFile);
    const selfieErr = validateFile(selfieFile);
    if (idErr || selfieErr) {
      toast({ title: "Invalid file", description: idErr || selfieErr || "", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const ts = Date.now();
      const idExt = idFile!.name.split(".").pop() || "bin";
      const selfieExt = selfieFile!.name.split(".").pop() || "bin";
      const idPath = `${profileId}/${ts}-id.${idExt}`;
      const selfiePath = `${profileId}/${ts}-selfie.${selfieExt}`;

      const up1 = await supabase.storage.from("verification-docs").upload(idPath, idFile!, { upsert: false });
      if (up1.error) throw up1.error;
      const up2 = await supabase.storage.from("verification-docs").upload(selfiePath, selfieFile!, { upsert: false });
      if (up2.error) throw up2.error;

      const { error: insErr } = await supabase
        .from("verification_requests" as any)
        .insert({
          profile_id: profileId,
          id_document_path: idPath,
          selfie_path: selfiePath,
        } as any);
      if (insErr) throw insErr;

      toast({ title: "Submitted", description: "Your verification request is pending review." });
      setOpen(false);
      setIdFile(null);
      setSelfieFile(null);
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
        setSelfiePreview(null);
      }
      refresh();
    } catch (e: any) {
      toast({ title: "Could not submit", description: e?.message || "Try again later.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  const statusUI = (() => {
    switch (status) {
      case "verified":
        return {
          icon: <BadgeCheck className="h-5 w-5 text-sky-400" />,
          title: "Identity verified",
          desc: "Your profile shows a verified badge to everyone.",
          badge: <Badge className="rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">Verified</Badge>,
          cta: null as React.ReactNode,
        };
      case "pending":
        return {
          icon: <Clock className="h-5 w-5 text-amber-400" />,
          title: "Verification in review",
          desc: "We'll notify you once your documents are reviewed (usually within 48h).",
          badge: <Badge className="rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">Pending</Badge>,
          cta: null,
        };
      case "rejected":
        return {
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
          title: "Verification rejected",
          desc: rejectionNote || "Your last submission was rejected. Please submit clearer documents.",
          badge: <Badge variant="destructive" className="rounded-lg">Rejected</Badge>,
          cta: (
            <Button size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" /> Resubmit
            </Button>
          ),
        };
      default:
        return {
          icon: <ShieldCheck className="h-5 w-5 text-accent" />,
          title: "Get your profile verified",
          desc: "Confirm your identity with an ID document and a selfie. Verified artists earn trust and a badge on their profile.",
          badge: null,
          cta: (
            <Button size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Start verification
            </Button>
          ),
        };
    }
  })();

  return (
    <>
      <div className="mx-4 md:mx-0 mt-3 md:mt-4 rounded-xl border border-border bg-secondary/40 p-3 md:p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{statusUI.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm md:text-base font-semibold text-foreground">{statusUI.title}</h3>
              {statusUI.badge}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{statusUI.desc}</p>
          </div>
          {statusUI.cta && <div className="flex-shrink-0">{statusUI.cta}</div>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) closeCamera(); }}>
        <DialogContent className="rounded-lg max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" /> Identity verification
            </DialogTitle>
            <DialogDescription>
              Upload a clear photo of your government-issued ID and take a live selfie. Documents are private and only seen by admins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ID document (passport or national ID)</label>
              <input
                ref={idInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-accent file:text-accent-foreground file:font-medium hover:file:bg-accent/90"
              />
              {idFile && <p className="text-xs text-muted-foreground truncate">{idFile.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Selfie</label>

              {selfiePreview ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                    <img src={selfiePreview} alt="Selfie preview" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => {
                        if (selfiePreview) URL.revokeObjectURL(selfiePreview);
                        setSelfiePreview(null);
                        setSelfieFile(null);
                        startCamera();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" /> Retake
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg w-full"
                  onClick={startCamera}
                >
                  <Camera className="h-4 w-4 mr-1.5" /> Take selfie
                </Button>
              )}

            </div>

            <p className="text-xs text-muted-foreground">
              Max {MAX_FILE_MB}MB per file. JPG, PNG, WEBP or PDF.
            </p>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 space-x-0">
            <Button variant="outline" className="rounded-lg" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button className="rounded-lg" onClick={handleSubmit} disabled={submitting || !idFile || !selfieFile}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
              Submit for review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cameraOpen} onOpenChange={(v) => { if (!v) closeCamera(); }}>
        <DialogContent className="rounded-lg max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" /> Take a selfie
            </DialogTitle>
            <DialogDescription>
              Hold your ID next to your face and make sure both are clearly visible.
            </DialogDescription>
          </DialogHeader>

          <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
            {cameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 z-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {cameraError ? (
              <div className="p-4 text-center text-sm text-destructive-foreground bg-destructive/80 rounded-lg m-4">
                {cameraError}
              </div>
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
          </div>

          <DialogFooter className="flex-row justify-end gap-2 space-x-0">
            <Button variant="outline" className="rounded-lg" onClick={closeCamera}>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
            <Button className="rounded-lg" onClick={capturePhoto} disabled={!!cameraError || cameraLoading}>
              <Camera className="h-4 w-4 mr-1.5" /> Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationCard;
