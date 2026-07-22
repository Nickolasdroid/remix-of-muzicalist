import { toast } from "@/hooks/use-toast";

export async function sharePost(opts: {
  profileId: string;
  stageName?: string | null;
  type?: "post" | "announcement";
}) {
  const url = `${window.location.origin}/artist/${opts.profileId}`;
  const title = opts.stageName ? `${opts.stageName} on Muzicalist` : "Muzicalist";
  const text =
    opts.type === "announcement"
      ? `Check out this announcement on Muzicalist`
      : `Check out this post on Muzicalist`;

  try {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title, text, url });
      return;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "The link has been copied to your clipboard." });
  } catch {
    toast({ title: "Unable to share", description: url, variant: "destructive" });
  }
}
