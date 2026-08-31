import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Ban, Flag, Link2, Pencil, Settings, Share2, ShieldCheck } from "lucide-react";
import PostActionsMenu, { type PostAction } from "@/components/PostActionsMenu";
import ReportContentDialog from "@/components/ReportContentDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ProfileActionsMenuProps {
  /** UUID of the viewed profile */
  profileId: string;
  profileName?: string | null;
  isOwnProfile: boolean;
  currentUserId: string | null;
  /** Artist profiles manage themselves in /dashboard, users in /user-dashboard */
  isArtist?: boolean;
}

/**
 * Secondary actions for public profiles (artist + user).
 * Mobile → bottom sheet, desktop → dropdown (shared with the post menu).
 */
const ProfileActionsMenu = ({
  profileId,
  profileName,
  isOwnProfile,
  currentUserId,
  isArtist,
}: ProfileActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!currentUserId || isOwnProfile) {
        setIsBlocked(false);
        return;
      }
      const { data } = await (supabase as any)
        .from("user_blocks")
        .select("id")
        .eq("blocker_user_id", currentUserId)
        .eq("blocked_user_id", profileId)
        .maybeSingle();
      if (!cancelled) setIsBlocked(!!data);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, profileId, isOwnProfile]);

  const profileUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    const title = profileName
      ? `${profileName} — Muzicalist`
      : "Muzicalist";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, url: profileUrl });
        return;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
    }
    await handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({ title: t("profileMenu.linkCopied", "Profile link copied.") });
    } catch {
      toast({
        title: t("profileMenu.linkCopyFailed", "Unable to copy link"),
        description: profileUrl,
        variant: "destructive",
      });
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    if (working) return;
    setWorking(true);
    try {
      if (isBlocked) {
        const { error } = await (supabase as any)
          .from("user_blocks")
          .delete()
          .eq("blocker_user_id", currentUserId)
          .eq("blocked_user_id", profileId);
        if (error) throw error;
        setIsBlocked(false);
        toast({ title: t("profileMenu.unblocked", "Profile unblocked") });
      } else {
        const { error } = await (supabase as any)
          .from("user_blocks")
          .insert({ blocker_user_id: currentUserId, blocked_user_id: profileId });
        if (error && (error as any).code !== "23505") throw error;
        setIsBlocked(true);
        toast({
          title: t("profileMenu.blocked", "Profile blocked"),
          description: t(
            "profileMenu.blockedDesc",
            "You can no longer follow or message each other."
          ),
        });
      }
    } catch (e: any) {
      toast({
        title: t("profileMenu.blockFailed", "Action failed"),
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  const actions: PostAction[] = isOwnProfile
    ? [
        {
          key: "edit",
          label: t("profileMenu.editProfile", "Edit profile"),
          icon: Pencil,
          onSelect: () =>
            navigate(isArtist ? "/dashboard?tab=profile" : "/user-dashboard?tab=profile"),
        },
        {
          key: "share",
          label: t("profileMenu.shareProfile", "Share profile"),
          icon: Share2,
          onSelect: handleShare,
        },
        {
          key: "copy",
          label: t("profileMenu.copyLink", "Copy profile link"),
          icon: Link2,
          onSelect: handleCopy,
        },
        {
          key: "settings",
          label: t("profileMenu.settings", "Settings"),
          icon: Settings,
          onSelect: () =>
            navigate(isArtist ? "/dashboard?tab=settings" : "/user-dashboard?tab=settings"),
        },
      ]
    : [
        {
          key: "block",
          label: isBlocked
            ? t("profileMenu.unblock", "Unblock")
            : t("profileMenu.block", "Block"),
          icon: isBlocked ? ShieldCheck : Ban,
          onSelect: handleBlockToggle,
          destructive: !isBlocked,
        },
        {
          key: "report",
          label: t("profileMenu.reportProfile", "Report profile"),
          icon: Flag,
          onSelect: () => {
            if (!currentUserId) {
              navigate("/login");
              return;
            }
            setReportOpen(true);
          },
        },
        {
          key: "share",
          label: t("profileMenu.shareProfile", "Share profile"),
          icon: Share2,
          onSelect: handleShare,
        },
        {
          key: "copy",
          label: t("profileMenu.copyLink", "Copy profile link"),
          icon: Link2,
          onSelect: handleCopy,
        },
      ];

  return (
    <>
      <PostActionsMenu
        actions={actions}
        open={open}
        onOpenChange={setOpen}
        title={t("profileMenu.title", "Profile options")}
      />
      <ReportContentDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        contentType="profile"
        contentId={profileId}
      />
    </>
  );
};

export default ProfileActionsMenu;
