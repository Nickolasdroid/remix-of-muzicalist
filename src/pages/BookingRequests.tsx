import { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookingRequestCard from "@/components/BookingRequestCard";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import BookingOfferDialog from "@/components/BookingOfferDialog";
import BookingDetailsDialog from "@/components/BookingDetailsDialog";
import { BOOKING_OFFER_COLUMNS } from "@/lib/bookingOffers";
import { translateSpecialization } from "@/lib/specializationLabel";

// Private contact columns are excluded on purpose (see get_booking_contact RPC).
const BOOKING_REQUEST_COLUMNS =
  "id, profile_id, requester_name, requester_user_id, event_date, event_end_date, event_type, message, status, created_at, updated_at, " +
  BOOKING_OFFER_COLUMNS;

type FilterKey = "all" | "pending" | "accepted" | "completed" | "rejected";


const parseYMD = (s?: string | null) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const BookingRequests = () => {
  usePageTitle("Booking Requests");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [artistProfiles, setArtistProfiles] = useState<
    Record<string, { stage_name?: string | null; avatar_url?: string | null; specialization?: string | null; county?: string | null }>
  >({});
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewerRole, setViewerRole] = useState<"user" | "artist" | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const filter = (searchParams.get("filter") as FilterKey) || "all";
  const tab = (searchParams.get("tab") as "received" | "sent") || "received";

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Detect viewer role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle();
    const userType = (roleRow?.user_type as string) || "user";
    const isArtist = userType !== "user";
    setViewerRole(isArtist ? "artist" : "user");
    setViewerId(user.id);

    // Requests sent by me (as a requester) — available for users AND artists
    // Contact columns are private: fetched per-booking via get_booking_contact.
    const { data: sentData } = await supabase
      .from("booking_requests")
      .select(BOOKING_REQUEST_COLUMNS)
      .eq("requester_user_id", user.id)
      .neq("profile_id", user.id)
      .order("created_at", { ascending: false });
    const sent = sentData || [];
    setSentRequests(sent);

    // Requests received on my artist profile
    let received: any[] = [];
    if (isArtist) {
      const { data: receivedData } = await supabase
        .from("booking_requests")
        .select(BOOKING_REQUEST_COLUMNS)
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });
      received = receivedData || [];
      setReceivedRequests(received);
    }

    // Resolve artist display info for sent requests (and my own stage name, for confirmations)
    const artistIds = Array.from(
      new Set([...sent.map((r: any) => r.profile_id), ...(isArtist ? [user.id] : [])].filter(Boolean))
    );
    if (artistIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, stage_name, avatar_url, specialization, county")
        .in("id", artistIds);
      const map: Record<string, any> = {};
      (profiles || []).forEach((p: any) => (map[p.id] = p));
      setArtistProfiles(map);
    }
    // Keep the open details dialog in sync with the fresh data
    setSelected((prev: any) =>
      prev ? [...sent, ...received].find((r: any) => r.id === prev.id) || prev : prev
    );
    setLoading(false);
  };


  useEffect(() => {
    load();
  }, []);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Categorize each request the same way as the dashboard counters
  const categorize = (r: any): "pending" | "accepted" | "completed" | "rejected" => {
    // An open offer is still waiting for an answer, so it counts as pending
    if (r.status === "pending" || r.status === "offered") return "pending";
    if (r.status === "rejected") return "rejected";
    if (r.status === "accepted") {
      const d = parseYMD(r.event_end_date || r.event_date);
      return d && d < today ? "completed" : "accepted";
    }
    return r.status;
  };


  const isArtistViewer = viewerRole === "artist";
  // Sent view = user account, or artist looking at the "Sent" tab
  const isSentView = !isArtistViewer || tab === "sent";
  const requests = isSentView ? sentRequests : receivedRequests;

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => categorize(r) === filter);
  }, [requests, filter]);

  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, accepted: 0, completed: 0, rejected: 0 } as Record<FilterKey, number>;
    requests.forEach((r) => {
      const k = categorize(r);
      if (k in c) (c as any)[k] += 1;
    });
    return c;
  }, [requests]);


  const declineRequest = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("booking_requests")
      .update({ status: "rejected" })
      .eq("id", id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Booking declined" });
    load();
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from("booking_requests").delete().eq("id", id);
    setIsSaving(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: viewerRole === "user" ? "Booking request cancelled" : "Booking request deleted" });
    setOpen(false);
    load();
  };

  const setFilter = (f: FilterKey) => {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    setSearchParams(next);
  };

  const setTab = (t: "received" | "sent") => {
    const next = new URLSearchParams(searchParams);
    if (t === "received") next.delete("tab");
    else next.set("tab", t);
    next.delete("filter");
    setSearchParams(next);
  };

  // "User view" = viewing requests I sent (as requester)
  const isUserView = isSentView;

  return (
    <>
      <Navigation mobileTitle="Booking Requests" />
      <main className="md:ml-64 pt-14 md:pt-0 pb-6 md:pb-0 min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <div className="hidden md:flex items-center gap-2 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isArtistViewer ? "/dashboard?tab=profile" : "/user-dashboard")}
              className="rounded-lg"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>

          <div className="mb-4 hidden md:flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-accent" />
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {isArtistViewer ? "Booking Requests" : "My Bookings"}
            </h1>
          </div>

          {isArtistViewer && (
            <div className="flex gap-2 mb-4">
              {([
                { k: "received", label: "Received", n: receivedRequests.length },
                { k: "sent", label: "Sent", n: sentRequests.length },
              ] as { k: "received" | "sent"; label: string; n: number }[]).map((t) => (
                <Button
                  key={t.k}
                  size="sm"
                  variant={tab === t.k ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => setTab(t.k)}
                >
                  {t.label}
                  <span className="ml-2 text-xs opacity-70">{t.n}</span>
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">

            {([
              { k: "all", label: "All" },
              { k: "pending", label: "Pending" },
              { k: "accepted", label: "Confirmed" },
              { k: "completed", label: "Completed" },
              { k: "rejected", label: "Cancelled" },
            ] as { k: FilterKey; label: string }[]).map((f) => (
              <Button
                key={f.k}
                size="sm"
                variant={filter === f.k ? "default" : "outline"}
                className="rounded-lg"
                onClick={() => setFilter(f.k)}
              >
                {f.label}
                <span className="ml-2 text-xs opacity-70">{counts[f.k]}</span>
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-2 border-dashed border-border/50 rounded-lg">
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {requests.length === 0
                    ? isUserView
                      ? "You haven't sent any booking requests yet"
                      : "No booking requests yet"
                    : "No booking requests match this filter"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((request) => {
                const cat = categorize(request);
                const artist = isUserView ? artistProfiles[request.profile_id] : null;
                const primaryName = isUserView
                  ? artist?.stage_name || "Artist"
                  : request.requester_name;
                return (
                  <BookingRequestCard
                    key={request.id}
                    booking={request}
                    viewer={isUserView ? "requester" : "artist"}
                    counterpartName={primaryName}
                    onClick={() => {
                      setSelected(request);
                      setOpen(true);
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BookingDetailsDialog
        open={open}
        onOpenChange={setOpen}
        booking={selected}
        viewer={isUserView ? "requester" : "artist"}
        counterpartName={
          selected
            ? isUserView
              ? artistProfiles[selected.profile_id]?.stage_name || "Artist"
              : selected.requester_name
            : ""
        }
        counterpartAvatarUrl={selected && isUserView ? artistProfiles[selected.profile_id]?.avatar_url : null}
        counterpartSubtitle={
          selected && isUserView
            ? [
                translateSpecialization(artistProfiles[selected.profile_id]?.specialization),
                artistProfiles[selected.profile_id]?.county,
              ]
                .filter(Boolean)
                .join(" · ")
            : null
        }
        artistName={
          selected
            ? artistProfiles[selected.profile_id]?.stage_name ||
              (isUserView ? "Artist" : artistProfiles[viewerId || ""]?.stage_name || "Artist")
            : "Artist"
        }
        onOffer={() => setOfferDialogOpen(true)}
        onArtistDecline={declineRequest}
        onDelete={handleDelete}
        onChanged={load}
      />

      <BookingOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        booking={selected}
        onSent={load}
      />
    </>
  );
};

export default BookingRequests;
