import { useState, useEffect, useRef, TouchEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Star,
  Heart,
  Calendar,
  CalendarCheck,
  CalendarX,
  MessageCircle,
  MessageSquare,
  UserPlus,
  FileText,
  Megaphone,
  Info,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import Navigation from "@/components/Navigation";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  reference_type: string | null;
  actor_id: string | null;
  actor_name: string | null;
  read_at: string | null;
  created_at: string;
}

const iconFor = (type: string) => {
  const base = "h-5 w-5";
  switch (type) {
    case "like":
      return <Heart className={cn(base, "text-rose-500 fill-rose-500")} />;
    case "comment":
      return <MessageCircle className={cn(base, "text-sky-400")} />;
    case "message":
      return <MessageSquare className={cn(base, "text-sky-400")} />;
    case "booking_request":
      return <Calendar className={cn(base, "text-amber-400")} />;
    case "booking_update":
      return <CalendarCheck className={cn(base, "text-emerald-400")} />;
    case "booking_declined":
      return <CalendarX className={cn(base, "text-destructive")} />;
    case "review":
      return <Star className={cn(base, "text-yellow-400 fill-yellow-400")} />;
    case "follow":
      return <UserPlus className={cn(base, "text-accent")} />;
    case "new_post":
      return <FileText className={cn(base, "text-accent")} />;
    case "new_announcement":
      return <Megaphone className={cn(base, "text-accent")} />;
    default:
      return <Info className={cn(base, "text-muted-foreground")} />;
  }
};

const groupLabel = (date: Date): "Today" | "Yesterday" | "Earlier" => {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return "Earlier";
};

const notificationTypeToPrefKey = (t: string): string | null => {
  switch (t) {
    case "review": return "reviews";
    case "like": return "likes";
    case "comment": return "comments";
    case "follow": return "followers";
    case "booking_request": return "booking_requests";
    case "booking_update": return "booking_updates";
    case "message": return "messages";
    default: return null;
  }
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean> | null>(null);
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      const { data: roleData } = await supabase
        .from("user_roles").select("user_type").eq("user_id", session.user.id).maybeSingle();
      setUserType(roleData?.user_type || null);
      const { data: profileData } = await supabase
        .from("profiles").select("notification_preferences").eq("id", session.user.id).maybeSingle();
      const prefs = (profileData as any)?.notification_preferences;
      setNotificationPrefs(prefs && typeof prefs === "object" ? (prefs as Record<string, boolean>) : {});
      const { data } = await supabase
        .from("notifications").select("*").eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) setNotifications(data);
      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    const now = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSwipeId(null);
    setSwipeOffset(0);
  };

  const getRoute = (n: Notification): string | null => {
    const { reference_type: refType, type, reference_id: refId } = n;
    if (type === "follow" && n.actor_id) return `/artist/${n.actor_id}`;
    if (type === "message" && refId) return `/messages?conversation=${refId}`;
    if (userType === "user") {
      if (type === "booking_request" || type === "booking_update") return "/booking-requests";
      if (refType === "announcement") return "/user-dashboard";
      return "/user-dashboard";
    }
    if (type === "comment" && refId && (refType === "post" || refType === "announcement")) {
      const section = refType === "post" ? "posts" : "announcements";
      return `/dashboard?tab=profile&section=${section}&commentsId=${refId}&commentsType=${refType}`;
    }
    if (refType === "post") return "/dashboard?tab=profile&section=posts";
    if (refType === "announcement") return "/dashboard?tab=profile&section=announcements";
    if (refType === "review") return "/dashboard?tab=profile";
    if (refType === "booking_request" || type === "booking_request" || type === "booking_update")
      return "/dashboard?tab=profile&section=calendar";
    if (refType === "follower") return n.actor_id ? `/artist/${n.actor_id}` : "/dashboard?tab=profile";
    return "/dashboard?tab=profile";
  };

  const handleClick = async (n: Notification) => {
    if (swipeId === n.id && Math.abs(swipeOffset) > 10) return;
    if (!n.read_at) await markAsRead(n.id);
    const route = getRoute(n);
    if (route) navigate(route);
  };

  const onTouchStart = (e: TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = touchStartX.current;
    setSwipeId(id);
  };
  const onTouchMove = (e: TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const delta = touchCurrentX.current - touchStartX.current;
    if (delta < 0) setSwipeOffset(Math.max(delta, -120));
  };
  const onTouchEnd = (id: string) => {
    if (swipeOffset < -80) {
      deleteNotification(id);
    } else {
      setSwipeOffset(0);
      setSwipeId(null);
    }
  };

  const visible = notifications.filter((n) => {
    if (!notificationPrefs) return true;
    const key = notificationTypeToPrefKey(n.type);
    if (!key) return true;
    return notificationPrefs[key] !== false;
  });

  // Sort: unread first, then by date desc
  const sorted = [...visible].sort((a, b) => {
    if (!!a.read_at !== !!b.read_at) return a.read_at ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Group by day bucket, preserving unread-first section
  const unread = sorted.filter((n) => !n.read_at);
  const read = sorted.filter((n) => n.read_at);
  const groupByDay = (items: Notification[]) => {
    const buckets: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };
    items.forEach((n) => buckets[groupLabel(new Date(n.created_at))].push(n));
    return buckets;
  };
  const readGroups = groupByDay(read);

  const renderCard = (n: Notification) => {
    const isSwiping = swipeId === n.id;
    const offset = isSwiping ? swipeOffset : 0;
    return (
      <div key={n.id} className="relative overflow-hidden">
        {/* Swipe reveal delete */}
        <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-6 bg-destructive/90 w-full">
          <Trash2 className="h-5 w-5 text-destructive-foreground" />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleClick(n)}
          onTouchStart={(e) => onTouchStart(e, n.id)}
          onTouchMove={onTouchMove}
          onTouchEnd={() => onTouchEnd(n.id)}
          style={{ transform: `translateX(${offset}px)` }}
          className={cn(
            "relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors select-none",
            "hover:bg-accent/5 active:bg-accent/10",
            !n.read_at ? "bg-[hsl(38_80%_50%/0.08)]" : "bg-background",
          )}
        >
          <div className="flex-shrink-0 mt-0.5 flex items-center justify-center h-10 w-10 rounded-full bg-secondary/40">
            {iconFor(n.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm leading-snug", !n.read_at ? "text-foreground" : "text-muted-foreground")}>
              {n.actor_name && (
                <span className="font-semibold text-foreground notranslate" translate="no">
                  {n.actor_name}{" "}
                </span>
              )}
              <span>{n.message || n.title}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
            </p>
          </div>
          {!n.read_at && (
            <div className="h-2.5 w-2.5 rounded-full bg-accent flex-shrink-0 mt-2" aria-label="unread" />
          )}
        </div>
      </div>
    );
  };

  const Section = ({ label, items }: { label: string; items: Notification[] }) => {
    if (!items.length) return null;
    return (
      <div>
        <h2 className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h2>
        <div className="divide-y divide-border/40">{items.map(renderCard)}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 pt-16 md:pt-2 pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto md:p-6 md:px-4">
          <div className="hidden md:flex items-center gap-3 mb-4 px-4">
            <Bell className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>

          {loading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-6 py-24">
              <div className="h-16 w-16 rounded-full bg-secondary/40 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No notifications yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                When people interact with you on Muzicalist, you'll see it here.
              </p>
            </div>
          ) : (
            <div>
              {unread.length > 0 && (
                <div>
                  <h2 className="px-4 pt-5 pb-2 text-xs font-semibold uppercase tracking-wider text-accent">
                    New
                  </h2>
                  <div className="divide-y divide-border/40">{unread.map(renderCard)}</div>
                </div>
              )}
              <Section label="Today" items={readGroups.Today} />
              <Section label="Yesterday" items={readGroups.Yesterday} />
              <Section label="Earlier" items={readGroups.Earlier} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
